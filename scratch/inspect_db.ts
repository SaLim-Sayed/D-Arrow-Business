import fs from "fs";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  serverTimestamp, 
  Timestamp 
} from "firebase/firestore";

// Load .env
const envFile = fs.readFileSync(".env", "utf8");
const envVars: Record<string, string> = {};
envFile.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    envVars[match[1]] = value;
  }
});

const firebaseConfig = {
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  console.log("Signing in...");
  try {
    const userCredential = await signInWithEmailAndPassword(auth, "admin@darrow.com", "admin123");
    console.log("Signed in successfully as:", userCredential.user.email, "UID:", userCredential.user.uid);
  } catch (err: any) {
    console.log("Sign in failed:", err.message);
  }

  // Get users
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    console.log(`Users count: ${usersSnap.docs.length}`);
    for (const uDoc of usersSnap.docs) {
      console.log(` - User ID: ${uDoc.id}, Email: ${uDoc.data().email}, Name: ${uDoc.data().name}, CompanyID: ${uDoc.data().companyId}`);
    }
  } catch (err: any) {
    console.log("Fetch users error:", err.message);
  }

  // Fetch employees from d-arrow or company
  try {
    const employeesSnap = await getDocs(collection(db, "companies", "d-arrow", "employees"));
    console.log(`Employees count in d-arrow: ${employeesSnap.docs.length}`);
    for (const empDoc of employeesSnap.docs) {
      console.log(` - Employee ID: ${empDoc.id}, Name: ${empDoc.data().firstName} ${empDoc.data().lastName || ""}, Email: ${empDoc.data().email}`);
    }
  } catch (err: any) {
    console.log("Fetch employees error:", err.message);
  }
}

main().catch(console.error);
