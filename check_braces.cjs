const fs = require('fs');
const code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

let open = 0;
for (let i = 0; i < code.length; i++) {
    if (code[i] === '{') open++;
    else if (code[i] === '}') open--;
}
console.log('Open braces: ' + open);
