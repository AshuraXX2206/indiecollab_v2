import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const PROJECT_ID = 'indiecollab-944a1';
const SERVICE_ACCOUNT_PATH = './service-account.json';

// Check args
const isProd = process.argv.includes('--prod');

async function deleteAuthUsers(authInstance) {
  let nextPageToken;
  let totalDeleted = 0;
  do {
    const listUsersResult = await authInstance.listUsers(1000, nextPageToken);
    const uids = listUsersResult.users.map((user) => user.uid);
    if (uids.length > 0) {
      await authInstance.deleteUsers(uids);
      totalDeleted += uids.length;
      console.log(`    Deleted batch of ${uids.length} users.`);
    }
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);
  console.log(`  ✅ Successfully deleted ${totalDeleted} auth users.`);
}

async function deleteCollectionRecursive(db, collectionRef, pathParts = []) {
  const colId = collectionRef.id;
  const currentPath = [...pathParts, colId].join('/');
  
  const snapshot = await db.collection(currentPath).get();
  console.log(`    Deleting ${snapshot.size} documents from ${currentPath}`);
  
  for (const doc of snapshot.docs) {
    // Recursively check for and delete subcollections first
    const subCollections = await doc.ref.listCollections();
    for (const subCol of subCollections) {
      await deleteCollectionRecursive(db, subCol, [...pathParts, colId, doc.id]);
    }
    // Delete the document itself
    await doc.ref.delete();
  }
}

async function wipeFirestore(dbInstance) {
  const collections = await dbInstance.listCollections();
  console.log(`  Found ${collections.length} top-level collections.`);
  for (const col of collections) {
    console.log(`  Clearing collection: ${col.id}...`);
    await deleteCollectionRecursive(dbInstance, col);
  }
  console.log(`  ✅ Firestore collections cleared.`);
}

async function main() {
  console.log('==================================================');
  console.log('   🔥 Firebase Cleanup & Database Purge Tool 🔥   ');
  console.log('==================================================');

  if (isProd) {
    console.log('\n⚠️ WARNING: You are about to wipe PRODUCTION data!');
    console.log('This will delete all users in Firebase Auth and all documents in Firestore.');
    console.log('Project ID:', PROJECT_ID);
    console.log('Confirming in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
      console.error(`❌ Error: Service Account Key not found at '${SERVICE_ACCOUNT_PATH}'.`);
      process.exit(1);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    // Ensure no emulator host variables are active
    delete process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

    const prodApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: PROJECT_ID
    }, 'production-wipe');

    console.log('\n--- Cleaning Production Auth ---');
    await deleteAuthUsers(prodApp.auth());

    console.log('\n--- Cleaning Production Firestore ---');
    await wipeFirestore(prodApp.firestore());

    await prodApp.delete();
    console.log('\n🎉 Production database and accounts wiped successfully!');
  } else {
    console.log('\n🧹 Mode: Local Emulator');
    
    // First try the REST endpoints (much faster and handles all metadata/configs)
    try {
      console.log('\n--- Attempting Emulator REST Wipe ---');
      const firestoreUrl = `http://127.0.0.1:8080/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
      const authUrl = `http://127.0.0.1:9099/emulator/v1/projects/${PROJECT_ID}/accounts`;

      const fsRes = await fetch(firestoreUrl, { method: 'DELETE' });
      if (fsRes.ok) {
        console.log('  ✅ Emulator Firestore cleared via REST API.');
      } else {
        throw new Error(`Firestore REST clear failed: ${fsRes.statusText}`);
      }

      const authRes = await fetch(authUrl, { method: 'DELETE' });
      if (authRes.ok) {
        console.log('  ✅ Emulator Auth cleared via REST API.');
      } else {
        throw new Error(`Auth REST clear failed: ${authRes.statusText}`);
      }
      
      console.log('\n🎉 Emulator database and accounts wiped successfully!');
    } catch (e) {
      console.log(`⚠️ REST clear failed/unavailable (is emulator running?). Falling back to Admin SDK.`);
      console.log(`Error detail: ${e.message}`);
      
      // Fallback: use Admin SDK pointed at the local emulators
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
      
      const localApp = admin.initializeApp({
        projectId: PROJECT_ID
      }, 'local-wipe');

      try {
        console.log('\n--- Cleaning Local Auth via Admin SDK ---');
        await deleteAuthUsers(localApp.auth());

        console.log('\n--- Cleaning Local Firestore via Admin SDK ---');
        await wipeFirestore(localApp.firestore());

        console.log('\n🎉 Emulator database and accounts wiped successfully via Admin SDK!');
      } catch (err) {
        console.error('❌ Failed to clean local emulator via Admin SDK:', err.message);
        console.log('Please ensure the Firebase emulators are running.');
      } finally {
        await localApp.delete();
      }
    }
  }
}

main().catch(console.error);
