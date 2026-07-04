const fs = require('fs');
let tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));

if (!tsconfig.exclude) {
  tsconfig.exclude = [];
}
tsconfig.exclude.push('dist');

fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2));
console.log('Patched tsconfig.json');
