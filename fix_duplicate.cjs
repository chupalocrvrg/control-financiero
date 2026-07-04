const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const regex = /const handleGenerateAdvancedReport = async \(reportType: 'pdf' \| 'excel'\) => \{[\s\S]*?XLSX\.writeFile\(wb, \`Reporte_Avanzado_\$\{reportStartDate\}_\$\{reportEndDate\}\.xlsx\`\);\n      \}\n      setShowCustomReportModal\(false\);\n    \} catch \(e\) \{\n      console\.error\(e\);\n      alert\('Error generando el reporte\.'\);\n    \} finally \{\n      setLoading\(false\);\n    \}\n  \};/g;

const matches = [...code.matchAll(regex)];
if (matches.length > 1) {
  code = code.slice(0, matches[1].index) + code.slice(matches[1].index + matches[1][0].length);
  fs.writeFileSync('src/pages/Dashboard.tsx', code);
  console.log('Removed duplicate handleGenerateAdvancedReport');
} else {
  console.log('Not enough matches found. Only ' + matches.length);
}
