const fs = require('fs');
let lines = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8').split('\n');

const startIndex = lines.findIndex((l, i) => i > 600 && l.includes("const handleGenerateAdvancedReport = async"));

if (startIndex !== -1) {
    const endIndex = lines.findIndex((l, i) => i > startIndex && l.trim() === "};" && lines[i-1].includes("setLoading(false);"));
    lines.splice(startIndex, endIndex - startIndex + 1);
    fs.writeFileSync('src/pages/Dashboard.tsx', lines.join('\n'));
    console.log('Removed duplicate from line ' + startIndex);
} else {
    console.log('Not found around line 600+');
}
