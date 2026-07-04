const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Find the last '}' before 'function GlobalCommerceCard'
const matchIndex = code.indexOf('function GlobalCommerceCard');
if (matchIndex !== -1) {
    const codeBefore = code.slice(0, matchIndex);
    const lastBraceIndex = codeBefore.lastIndexOf('}');
    if (lastBraceIndex !== -1) {
        code = code.slice(0, lastBraceIndex) + code.slice(lastBraceIndex + 1);
        fs.writeFileSync('src/pages/Dashboard.tsx', code);
        console.log('Removed an extra } before GlobalCommerceCard');
    }
}
