import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import fs from "fs";

// Load configuration
const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
console.log("Using config:", firebaseConfig);

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});

async function runTest() {
  try {
    console.log("Attempting to read users collection...");
    const snap = await getDocs(collection(db, "users"));
    console.log(`Read users collection successfully! Found ${snap.size} documents.`);
    
    console.log("Attempting to write a test user document...");
    const testId = "guest-test-" + Date.now();
    await setDoc(doc(db, "users", testId), {
      id: testId,
      displayName: "Test Bot",
      avatarUrl: "https://example.com/avatar.png",
      primaryRole: "Core Developer",
      isAvailable: true,
      createdAt: new Date().toISOString()
    });
    console.log("Write user document successfully!");

    console.log("Attempting to read back the test user...");
    const userSnap = await getDoc(doc(db, "users", testId));
    if (userSnap.exists()) {
      console.log("Read back test user successfully:", userSnap.data());
    } else {
      console.warn("Test user document not found!");
    }
  } catch (err) {
    console.error("Test failed with error:", err);
  }
}

runTest();
