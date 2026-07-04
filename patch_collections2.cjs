const fs = require('fs');
let content = fs.readFileSync('src/pages/Collections.tsx', 'utf8');

// Update handleOpenModal editing
content = content.replace(
  `        totalCollected: collectionData.totalCollected.toString(),
        depositsTransfers: collectionData.depositsTransfers.toString(),`,
  `        totalCollected: collectionData.totalCollected.toString(),
        depositsTransfers: collectionData.depositsTransfers.toString(),
        clientName: collectionData.clientName || '',`
);

// Update handleOpenModal new
content = content.replace(
  `        totalCollected: '',
        depositsTransfers: '',`,
  `        totalCollected: '',
        depositsTransfers: '',
        clientName: '',`
);

fs.writeFileSync('src/pages/Collections.tsx', content);
console.log("Patched handleOpenModal");
