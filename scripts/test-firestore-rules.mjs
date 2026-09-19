/**
 * Firestore rules checks for daily reports.
 * Run with: npm run test:rules
 *
 * The script pins firebase-tools 13.x because newer CLI releases require JDK 21+
 * and this machine runs JDK 17. Drop the pin once the JDK is upgraded.
 */
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

const COMPANY = "acme";
const results = [];

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (err) {
    results.push({ name, ok: false, err: err?.message ?? String(err) });
  }
}

const testEnv = await initializeTestEnvironment({
  projectId: "rules-check",
  firestore: { rules: readFileSync("firestore.rules", "utf8") },
});

await testEnv.clearFirestore();

// Seed user profiles and two reports without going through the rules.
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, "users", "emp1"), { companyId: COMPANY, role: "employee" });
  await setDoc(doc(db, "users", "emp2"), { companyId: COMPANY, role: "employee" });
  await setDoc(doc(db, "users", "mgr"), { companyId: COMPANY, role: "manager" });
  // Reproduces the field shape that previously broke the helper.
  await setDoc(doc(db, "users", "mgrNull"), {
    companyId: COMPANY,
    role: "manager",
    portalSubRoles: null,
    customPermissions: null,
  });
  await setDoc(doc(db, "users", "mgrDemoted"), {
    companyId: COMPANY,
    role: "manager",
    portalSubRoles: { people: "employee" },
  });
  await setDoc(doc(db, "users", "empCustom"), {
    companyId: COMPANY,
    role: "employee",
    customPermissions: ["people.view_all_reports"],
  });
  await setDoc(doc(db, "users", "outsider"), { companyId: "other-co", role: "manager" });

  await setDoc(doc(db, "companies", COMPANY, "daily_reports", "r1"), {
    employeeId: "emp1",
    date: "2026-09-17",
    summary: "emp1 report",
  });
  await setDoc(doc(db, "companies", COMPANY, "daily_reports", "r2"), {
    employeeId: "emp2",
    date: "2026-09-17",
    summary: "emp2 report",
  });
  await setDoc(doc(db, "companies", COMPANY, "tasks", "t1"), { title: "unrelated" });
});

const asUser = (uid) => testEnv.authenticatedContext(uid).firestore();
const reportsOf = (db) => collection(db, "companies", COMPANY, "daily_reports");

// --- The requirement: every employee can read their own reports ---
await check("employee reads own report doc", () =>
  assertSucceeds(getDoc(doc(asUser("emp1"), "companies", COMPANY, "daily_reports", "r1")))
);

await check("employee lists own reports (filtered query)", async () => {
  const snap = await assertSucceeds(
    getDocs(query(reportsOf(asUser("emp1")), where("employeeId", "==", "emp1")))
  );
  if (snap.size !== 1) throw new Error(`expected 1 own report, got ${snap.size}`);
});

await check("employee updates own report", () =>
  assertSucceeds(
    updateDoc(doc(asUser("emp1"), "companies", COMPANY, "daily_reports", "r1"), {
      summary: "edited",
    })
  )
);

await check("employee creates own report", () =>
  assertSucceeds(
    setDoc(doc(asUser("emp1"), "companies", COMPANY, "daily_reports", "new1"), {
      employeeId: "emp1",
      date: "2026-09-18",
    })
  )
);

// --- Employees must not reach anyone else's reports ---
await check("employee cannot read another member's report", () =>
  assertFails(getDoc(doc(asUser("emp1"), "companies", COMPANY, "daily_reports", "r2")))
);

await check("employee cannot list all reports", () =>
  assertFails(getDocs(reportsOf(asUser("emp1"))))
);

await check("employee cannot list another member's reports", () =>
  assertFails(getDocs(query(reportsOf(asUser("emp1")), where("employeeId", "==", "emp2"))))
);

await check("employee cannot forge a report for someone else", () =>
  assertFails(
    setDoc(doc(asUser("emp1"), "companies", COMPANY, "daily_reports", "forged"), {
      employeeId: "emp2",
      date: "2026-09-18",
    })
  )
);

// --- Managers and admins see everything ---
await check("manager lists all reports", async () => {
  const snap = await assertSucceeds(getDocs(reportsOf(asUser("mgr"))));
  if (snap.size < 2) throw new Error(`expected all reports, got ${snap.size}`);
});

await check("manager with null portalSubRoles still lists all reports", () =>
  assertSucceeds(getDocs(reportsOf(asUser("mgrNull"))))
);

await check("manager demoted via People sub-role cannot list all reports", () =>
  assertFails(getDocs(reportsOf(asUser("mgrDemoted"))))
);

await check("employee with custom permission lists all reports", () =>
  assertSucceeds(getDocs(reportsOf(asUser("empCustom"))))
);

// --- Company isolation and untouched collections ---
await check("outsider cannot read reports", () =>
  assertFails(getDoc(doc(asUser("outsider"), "companies", COMPANY, "daily_reports", "r1")))
);

await check("other company subcollections stay readable by members", () =>
  assertSucceeds(getDocs(collection(asUser("emp1"), "companies", COMPANY, "tasks")))
);

await check("other company subcollections stay writable by members", () =>
  assertSucceeds(
    setDoc(doc(asUser("emp1"), "companies", COMPANY, "tasks", "t2"), { title: "new" })
  )
);

await check("nested subcollections stay accessible", () =>
  assertSucceeds(
    setDoc(doc(asUser("emp1"), "companies", COMPANY, "tasks", "t1", "comments", "c1"), {
      body: "hi",
    })
  )
);

await testEnv.cleanup();

const failed = results.filter((r) => !r.ok);
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : `\n      ${r.err}`}`);
}
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
