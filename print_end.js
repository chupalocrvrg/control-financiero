const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
console.log(JSON.stringify(code.slice(-20)));
