/**
 * Firestore rules checks for daily reports and onboarding (users / companies / invites).
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
  writeBatch,
  Timestamp,
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

// --- Onboarding: nobody can put themselves into an existing company ---
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, "companies", COMPANY), { name: "Acme" });
  await setDoc(doc(db, "users", "adm"), { companyId: COMPANY, role: "admin", name: "Admin" });
  await setDoc(doc(db, "users", "sup"), { companyId: COMPANY, role: "super_admin" });
  const invite = (token, email, extra = {}) =>
    setDoc(doc(db, "invites", token), {
      token,
      email,
      role: "employee",
      companyId: COMPANY,
      status: "pending",
      portalAccess: null,
      portalSubRoles: null,
      expiresAtTs: Timestamp.fromMillis(Date.now() + 86_400_000),
      ...extra,
    });
  await invite("tok-ok", "new@acme.test");
  await invite("tok-old", "old@acme.test", { expiresAtTs: Timestamp.fromMillis(Date.now() - 1000) });
  await invite("tok-edit", "edit@acme.test");
  await setDoc(doc(db, "otpResets", "someone"), { otp: "123456" });
});

const asEmail = (uid, email) => testEnv.authenticatedContext(uid, { email }).firestore();

await check("stranger cannot join an existing company as admin", () =>
  assertFails(setDoc(doc(asEmail("x1", "x1@evil.test"), "users", "x1"), { companyId: COMPANY, role: "admin" }))
);

await check("stranger cannot join an existing company as employee", () =>
  assertFails(setDoc(doc(asEmail("x2", "x2@evil.test"), "users", "x2"), { companyId: COMPANY, role: "employee" }))
);

await check("stranger cannot overwrite an existing company in a founding batch", () => {
  const db = asEmail("x3", "x3@evil.test");
  const batch = writeBatch(db);
  batch.set(doc(db, "users", "x3"), { companyId: COMPANY, role: "admin" });
  batch.set(doc(db, "companies", COMPANY), { name: "Hijacked" }, { merge: true });
  return assertFails(batch.commit());
});

await check("founding a brand-new company in one batch works", () => {
  const db = asEmail("f1", "f1@new.test");
  const batch = writeBatch(db);
  batch.set(doc(db, "users", "f1"), { companyId: "co-f1", role: "admin", name: "Founder" });
  batch.set(doc(db, "companies", "co-f1"), { name: "New Co" });
  return assertSucceeds(batch.commit());
});

await check("profile without its company write is rejected", () =>
  assertFails(setDoc(doc(asEmail("f2", "f2@new.test"), "users", "f2"), { companyId: "co-f2", role: "admin" }))
);

await check("company doc alone (no profile) is rejected", () =>
  assertFails(setDoc(doc(asEmail("f3", "f3@new.test"), "companies", "co-f3"), { name: "Orphan" }))
);

const acceptBatch = (uid, email, token, profile, inviteUpdate = {}) => {
  const db = asEmail(uid, email);
  const batch = writeBatch(db);
  batch.set(doc(db, "users", uid), {
    companyId: COMPANY,
    role: "employee",
    portalAccess: [],
    portalSubRoles: {},
    inviteToken: token,
    ...profile,
  });
  batch.update(doc(db, "invites", token), {
    status: "accepted",
    acceptedBy: uid,
    acceptedAt: new Date().toISOString(),
    ...inviteUpdate,
  });
  return batch.commit();
};

await check("invitee with a different email cannot use the invite", () =>
  assertFails(acceptBatch("i0", "someone@else.test", "tok-ok", {}))
);

await check("invitee cannot take a higher role than invited", () =>
  assertFails(acceptBatch("i1", "new@acme.test", "tok-ok", { role: "admin" }))
);

await check("invitee cannot rewrite the invite while accepting", () =>
  assertFails(acceptBatch("i3", "edit@acme.test", "tok-edit", {}, { role: "admin" }))
);

await check("expired invite is rejected", () =>
  assertFails(acceptBatch("i4", "old@acme.test", "tok-old", {}))
);

await check("invitee accepts a valid invite", () =>
  assertSucceeds(acceptBatch("i2", "new@acme.test", "tok-ok", { name: "New Hire", mustChangePassword: true }))
);

await check("accepted invite cannot be reused", () =>
  assertFails(acceptBatch("i5", "new@acme.test", "tok-ok", {}))
);

// --- Profile updates: no self-escalation ---
await check("employee updates own name", () =>
  assertSucceeds(updateDoc(doc(asUser("emp1"), "users", "emp1"), { name: "Emp One", mustChangePassword: false }))
);

await check("employee cannot promote themselves", () =>
  assertFails(updateDoc(doc(asUser("emp1"), "users", "emp1"), { role: "admin" }))
);

await check("employee cannot move themselves to another company", () =>
  assertFails(updateDoc(doc(asUser("emp1"), "users", "emp1"), { companyId: "other-co" }))
);

await check("employee cannot grant themselves permissions", () =>
  assertFails(updateDoc(doc(asUser("emp1"), "users", "emp1"), { customPermissions: ["people.view_all_reports"] }))
);

await check("admin changes a teammate's role", () =>
  assertSucceeds(updateDoc(doc(asUser("adm"), "users", "emp2"), { role: "manager" }))
);

await check("admin cannot hand out super admin", () =>
  assertFails(updateDoc(doc(asUser("adm"), "users", "emp2"), { role: "super_admin" }))
);

await check("super admin can hand out super admin", () =>
  assertSucceeds(updateDoc(doc(asUser("sup"), "users", "emp2"), { role: "super_admin" }))
);

await check("admin cannot move a teammate to another company", () =>
  assertFails(updateDoc(doc(asUser("adm"), "users", "emp1"), { companyId: "other-co" }))
);

await check("admin cannot invite a super admin", () =>
  assertFails(
    setDoc(doc(asUser("adm"), "invites", "tok-sa"), {
      token: "tok-sa",
      email: "sa@acme.test",
      role: "super_admin",
      companyId: COMPANY,
      status: "pending",
    })
  )
);

await check("OTP reset codes are not readable", () =>
  assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(), "otpResets", "someone")))
);

await testEnv.cleanup();

const failed = results.filter((r) => !r.ok);
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.ok ? "" : `\n      ${r.err}`}`);
}
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
