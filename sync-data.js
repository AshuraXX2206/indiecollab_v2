import admin from 'firebase-admin';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_ID = 'indiecollab-944a1';
const SERVICE_ACCOUNT_PATH = './service-account.json';

// Helper to run shell commands
function runCommand(cmd) {
  try {
    console.log(`Running: ${cmd}`);
    return execSync(cmd, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Command failed: ${cmd}`);
    console.error(error.message);
    throw error;
  }
}

async function main() {
  console.log('=== Firebase Local-to-Production Sync ===');

  // 1. Verify Service Account for Production
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`\n[ERROR] Service Account Key not found at '${SERVICE_ACCOUNT_PATH}'.`);
    console.log('To synchronize Firestore data to production, you need a Service Account Key:');
    console.log('  1. Go to Firebase Console: https://console.firebase.google.com/');
    console.log(`  2. Open project: ${PROJECT_ID}`);
    console.log('  3. Go to Project Settings -> Service Accounts.');
    console.log('  4. Click "Generate new private key" and download the JSON file.');
    console.log(`  5. Save it in the project root directory as 'service-account.json'.`);
    process.exit(1);
  }

  // 2. Synchronize Auth Users (via Firebase CLI)
  console.log('\n--- Syncing Firebase Auth Users ---');
  const authExportPath = './firebase-data/auth_export/accounts.json';
  if (fs.existsSync(authExportPath)) {
    try {
      runCommand(`npx.cmd firebase auth:import ${authExportPath} --project ${PROJECT_ID}`);
      console.log('✅ Auth users synced successfully.');
    } catch (e) {
      console.error('❌ Failed to sync Auth users.');
    }
  } else {
    console.log(`⚠️ No local Auth export found at '${authExportPath}'. Skipping Auth sync.`);
    console.log('If you want to sync Auth, export emulator data first using:');
    console.log('  npx.cmd firebase emulators:export ./firebase-data');
  }

  // 3. Synchronize Firestore Data
  console.log('\n--- Syncing Firestore Data ---');
  
  // Set up local emulator connection
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  const localApp = admin.initializeApp({
    projectId: PROJECT_ID
  }, 'local-emulator');
  const localDb = localApp.firestore();

  // Set up production connection
  const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  // Unset environment variable to connect to production
  delete process.env.FIRESTORE_EMULATOR_HOST;
  const prodApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID
  }, 'production');
  const prodDb = prodApp.firestore();

  try {
    // Check if emulator is accessible
    // We try to list collections on emulator; if it fails, emulator is not running
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    const collections = await localDb.listCollections();
    delete process.env.FIRESTORE_EMULATOR_HOST;

    console.log(`Found ${collections.length} top-level collections in local Firestore emulator.`);
    
    for (const col of collections) {
      console.log(`Syncing collection: ${col.id}...`);
      await syncCollection(col, localDb, prodDb);
    }
    
    console.log('✅ Firestore sync completed.');
  } catch (error) {
    console.error('❌ Firestore sync failed. Is the local Firestore emulator running on port 8080?');
    console.error(error);
  } finally {
    await localApp.delete();
    await prodApp.delete();
  }
}

// Recursively copy collections and documents (including subcollections)
async function syncCollection(collectionRef, localDb, prodDb, pathParts = []) {
  const colId = collectionRef.id;
  const currentPath = [...pathParts, colId].join('/');
  
  // Get all documents in the collection
  // Temporarily point to emulator for local read
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  const snapshot = await localDb.collection(currentPath).get();
  delete process.env.FIRESTORE_EMULATOR_HOST;

  console.log(`  - Copying ${snapshot.size} documents from ${currentPath}`);

  for (const doc of snapshot.docs) {
    const docData = doc.data();
    const docPath = `${currentPath}/${doc.id}`;

    // Write to production
    await prodDb.doc(docPath).set(docData, { merge: true });

    // Recursively check for and copy subcollections
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    const subCollections = await doc.ref.listCollections();
    delete process.env.FIRESTORE_EMULATOR_HOST;

    for (const subCol of subCollections) {
      await syncCollection(subCol, localDb, prodDb, [...pathParts, colId, doc.id]);
    }
  }
}

main().catch(console.error);
