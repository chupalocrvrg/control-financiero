import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

initializeApp({
  projectId: firebaseConfig.projectId
});

// Pass the firestoreDatabaseId to getFirestore
const db = getFirestore(firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("--- EMPLOYEES ---");
  const empSnap = await db.collection('employees').get();
  const employees = empSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(JSON.stringify(employees, null, 2));

  console.log("--- BUDGETS ---");
  const budgetSnap = await db.collection('budgets').get();
  const budgets = budgetSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(JSON.stringify(budgets, null, 2));

  console.log("--- COLLECTIONS ---");
  const collSnap = await db.collection('collections').get();
  const collections = collSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(JSON.stringify(collections, null, 2));

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
