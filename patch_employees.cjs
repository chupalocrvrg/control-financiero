const fs = require('fs');
let code = fs.readFileSync('src/pages/Employees.tsx', 'utf8');

// Remove email from Employee interface
code = code.replace(
  `  lastName: string;\n  email: string;\n  role: 'vendedor' | 'cobrador' | 'ambos';`,
  `  lastName: string;\n  role: 'vendedor' | 'cobrador' | 'ambos';`
);

// Remove email from formData
code = code.replace(
  `    lastName: '',\n    email: '',\n    role: 'vendedor' as 'vendedor' | 'cobrador' | 'ambos'`,
  `    lastName: '',\n    role: 'vendedor' as 'vendedor' | 'cobrador' | 'ambos'`
);

// Remove email from handleOpenModal (editing)
code = code.replace(
  `        lastName: employee.lastName,\n        email: employee.email || '',\n        role: employee.role`,
  `        lastName: employee.lastName,\n        role: employee.role`
);

// Remove email from handleOpenModal (new)
code = code.replace(
  `        lastName: '',\n        email: '',\n        role: 'vendedor'`,
  `        lastName: '',\n        role: 'vendedor'`
);

// Remove email from handleSubmit updateDoc
code = code.replace(
  `          lastName: formData.lastName,\n          email: formData.email,\n          role: formData.role`,
  `          lastName: formData.lastName,\n          role: formData.role`
);

// Remove email from handleSubmit addDoc
code = code.replace(
  `          lastName: formData.lastName,\n          email: formData.email,\n          role: formData.role,\n          createdAt: Timestamp.now()`,
  `          lastName: formData.lastName,\n          role: formData.role,\n          createdAt: Timestamp.now()`
);

// Remove email column from table header
code = code.replace(
  `                  <th className="px-6 py-4">Nombre Completo</th>\n                  <th className="px-6 py-4">Email</th>\n                  <th className="px-6 py-4">Rol</th>`,
  `                  <th className="px-6 py-4">Nombre Completo</th>\n                  <th className="px-6 py-4">Rol</th>`
);

// Remove email column from table body
code = code.replace(
  `                    <td className="px-6 py-4 text-neutral-500">\n                      {emp.email || 'N/A'}\n                    </td>`,
  ``
);

// Remove email from form
code = code.replace(
  /              <div>\n                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Email \(para login\)<\/label>\n                <input\n                  type="email"\n                  value={formData\.email}\n                  onChange=\{\(e\) => setFormData\(\{\.\.\.formData, email: e\.target\.value\}\)\}\n                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white"\n                  placeholder="Ej\. empleado@empresa\.com"\n                \/>\n              <\/div>/,
  ``
);


fs.writeFileSync('src/pages/Employees.tsx', code);
console.log('Patched Employees.tsx');
