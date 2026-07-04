const fs = require('fs');
let content = fs.readFileSync('src/pages/Collections.tsx', 'utf8');

content = content.replace(
  `        totalCollected: tCollected,
        depositsTransfers: dTransfers,
        cashFinal: cFinal,
      };`,
  `        totalCollected: tCollected,
        depositsTransfers: dTransfers,
        cashFinal: cFinal,
        clientName: formData.noReceipt ? formData.clientName : null,
      };`
);

fs.writeFileSync('src/pages/Collections.tsx', content);
console.log("Patched handleSubmit");
