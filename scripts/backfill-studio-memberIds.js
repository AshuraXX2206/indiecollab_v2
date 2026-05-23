import admin from "firebase-admin";
import fs from "fs";

const PROJECT_ID = "indiecollab-944a1";
const SERVICE_ACCOUNT_PATH = "./service-account.json";
const SHOULD_WRITE = process.argv.includes("--write");

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`Missing ${SERVICE_ACCOUNT_PATH}. Download a Firebase service account key before running this migration.`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: PROJECT_ID,
});

const db = admin.firestore();

async function main() {
  const [usersSnap, studiosSnap] = await Promise.all([
    db.collection("users").get(),
    db.collection("studios").get(),
  ]);

  const usersByName = new Map();
  usersSnap.docs.forEach((doc) => {
    const user = doc.data();
    if (typeof user.displayName === "string" && !usersByName.has(user.displayName)) {
      usersByName.set(user.displayName, doc.id);
    }
  });

  let changed = 0;
  const batch = db.batch();

  studiosSnap.docs.forEach((doc) => {
    const studio = doc.data();
    if (Array.isArray(studio.memberIds) && studio.memberIds.length > 0) return;

    const members = Array.isArray(studio.members) ? studio.members : [];
    const memberIds = members
      .map((memberName) => {
        if (memberName === studio.ownerName) return studio.ownerId;
        return usersByName.get(memberName) || "";
      })
      .filter(Boolean);

    if (studio.ownerId && !memberIds.includes(studio.ownerId)) {
      memberIds.unshift(studio.ownerId);
    }

    const uniqueMemberIds = [...new Set(memberIds)];
    console.log(`${doc.id}: ${uniqueMemberIds.length} memberIds derived from ${members.length} members`);

    if (SHOULD_WRITE) {
      batch.update(doc.ref, { memberIds: uniqueMemberIds });
    }
    changed += 1;
  });

  if (SHOULD_WRITE && changed > 0) {
    await batch.commit();
    console.log(`Backfilled ${changed} studio documents.`);
  } else if (!SHOULD_WRITE) {
    console.log(`Dry run only. Re-run with --write to update ${changed} studio documents.`);
  } else {
    console.log("No studio documents needed backfill.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await admin.app().delete();
  });
