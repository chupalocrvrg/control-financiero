const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const targetStateStr = `  const [selectedCommerceEmployee, setSelectedCommerceEmployee] = useState<string>('global');`;

content = content.replace(targetStateStr, ``);
fs.writeFileSync('src/pages/Dashboard.tsx', content);
console.log("Patched dashboard state");
