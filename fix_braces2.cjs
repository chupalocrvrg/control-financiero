const fs = require('fs');
let lines = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8').split('\n');

const idx = lines.findIndex(l => l.includes('function GlobalCommerceCard'));
if (idx !== -1) {
    lines.splice(idx, 0, '}');
    fs.writeFileSync('src/pages/Dashboard.tsx', lines.join('\n'));
    console.log('Added } before GlobalCommerceCard');
}
