const fs = require('fs');
let content = fs.readFileSync('src/pages/Collections.tsx', 'utf8');

// Update Interface
content = content.replace(
  `  createdAt: any;
}`,
  `  createdAt: any;
  clientName?: string;
}`
);

// Update useState
content = content.replace(
  `  const [formData, setFormData] = useState({
    employeeId: '',
    initialDate: format(new Date(), 'yyyy-MM-dd'),
    finalDate: format(new Date(), 'yyyy-MM-dd'),
    noReceipt: false,
    initialReceipt: '',
    finalReceipt: '',
    totalCollected: '',
    depositsTransfers: '',
  });`,
  `  const [formData, setFormData] = useState({
    employeeId: '',
    initialDate: format(new Date(), 'yyyy-MM-dd'),
    finalDate: format(new Date(), 'yyyy-MM-dd'),
    noReceipt: false,
    initialReceipt: '',
    finalReceipt: '',
    totalCollected: '',
    depositsTransfers: '',
    clientName: '',
  });`
);

fs.writeFileSync('src/pages/Collections.tsx', content);
console.log("Patched interface and state");
