const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /import \{ fileURLToPath \} from "url";\n/g,
  ''
);

code = code.replace(
  /const __filename = fileURLToPath\(import\.meta\.url\);\nconst __dirname = path\.dirname\(__filename\);\n/g,
  `const __dirname = path.resolve();\n`
);

fs.writeFileSync('server.ts', code);
console.log('Patched server.ts');
