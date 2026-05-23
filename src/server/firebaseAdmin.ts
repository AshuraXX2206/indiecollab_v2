import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

// 1. Read firebase-applet-config.json fallback
let firebaseAppConfig: any = {};
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
if (fs.existsSync(configPath)) {
  try {
    firebaseAppConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch (err) {
    // Silent fallback
  }
}

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || 
                         process.env.VITE_FIREBASE_PROJECT_ID || 
                         process.env.GOOGLE_CLOUD_PROJECT || 
                         process.env.GCLOUD_PROJECT || 
                         firebaseAppConfig.projectId;

// 2. Initialize Firebase Admin SDK if not already done
if (!admin.apps.length) {
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: firebaseProjectId,
      });
    } else {
      // Try to load Application Default Credentials (ADC) first, which succeeds on Cloud Run
      // and grants administrative privileges (bypassing Firestore security rules).
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: firebaseProjectId,
        });
      } catch (adcErr) {
        // Fall back to project ID only if ADC is not available (e.g. local development)
        if (firebaseProjectId) {
          admin.initializeApp({
            projectId: firebaseProjectId,
          });
        } else {
          admin.initializeApp();
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ Firebase Admin SDK initialization in helper failed:", err);
  }
}

// 3. Resolve the Firestore database ID
// If the variable is explicitly set to empty, default, or (default), we want to use the default database (undefined)
// If it is NOT set, we fall back to firestoreDatabaseId in the applet config.
const dbIdFromEnv = process.env.FIREBASE_DATABASE_ID || process.env.VITE_FIREBASE_DATABASE_ID;
const resolvedDbId = (typeof dbIdFromEnv !== "undefined")
  ? dbIdFromEnv
  : firebaseAppConfig.firestoreDatabaseId;

const finalDbId = (resolvedDbId === "(default)" || resolvedDbId === "default" || !resolvedDbId)
  ? undefined
  : resolvedDbId;

// 4. Retrieve and export the Firestore instance
export const db = finalDbId ? getFirestore(finalDbId) : getFirestore();
export { admin };
