import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("--- EMPLOYEES ---");
  const empSnap = await getDocs(collection(db, 'employees'));
  const employees = empSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(JSON.stringify(employees, null, 2));

  console.log("--- BUDGETS ---");
  const budgetSnap = await getDocs(collection(db, 'budgets'));
  const budgets = budgetSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(JSON.stringify(budgets, null, 2));

  console.log("--- COLLECTIONS ---");
  const collSnap = await getDocs(collection(db, 'collections'));
  const collections = collSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(JSON.stringify(collections, null, 2));

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
