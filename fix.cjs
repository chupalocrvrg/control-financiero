const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

code = code.replace(
  /            <\/div>\n          <\/div>\n          <\/div>\n        \)\}/,
  `            </div>\n          </div>\n        )}`
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log('Fixed Dashboard.tsx extra div');
