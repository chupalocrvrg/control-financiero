const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const newCheckFetch = `
      // Fetch Checks for range
      const checksQ = query(collection(db, 'checks'), where('dueDate', '>=', reportStartDate), where('dueDate', '<=', reportEndDate), where('status', 'in', ['PENDING', 'PAID']));
      const checksSnap = await getDocs(checksQ);
      const filteredChecks = checksSnap.docs.map(d => ({ id: d.id, ...d.data() }) as any).sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());

      // Fetch Sales and Collections for range
`;

code = code.replace(
  /      const filteredChecks = checks\.filter\(c => \{[\s\S]*?\}\)\.sort\(\(a, b\) => parseISO\(a\.dueDate\)\.getTime\(\) - parseISO\(b\.dueDate\)\.getTime\(\)\);\n\n      \/\/ Fetch Sales and Collections for range/,
  newCheckFetch.trim() + '\n\n      // Fetch Sales and Collections for range'
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log('Patched checks query in Dashboard.tsx');
