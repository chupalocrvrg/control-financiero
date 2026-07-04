const fs = require('fs');
let code = fs.readFileSync('src/pages/Sales.tsx', 'utf8');

// 1. Add article to Sale interface
code = code.replace(
  `  clientName?: string;`,
  `  clientName?: string;\n  article: string;`
);

// 2. Add article to formData
code = code.replace(
  `    clientName: ''\n  });`,
  `    clientName: '',\n    article: ''\n  });`
);

// 3. Add article to handleOpenModal (if editing)
code = code.replace(
  `        clientName: sale.clientName || ''\n      });`,
  `        clientName: sale.clientName || '',\n        article: sale.article || ''\n      });`
);

// 4. Add article to handleOpenModal (if new)
code = code.replace(
  `        clientName: ''\n      });`,
  `        clientName: '',\n        article: ''\n      });`
);

// 5. Add article to handleSubmit (saleData)
code = code.replace(
  `        clientName: formData.clientName,\n      };`,
  `        clientName: formData.clientName,\n        article: formData.article,\n      };`
);

// 6. Add article to Table display (Header)
code = code.replace(
  `                  <th className="px-6 py-4">Empleado</th>\n                  <th className="px-6 py-4">Cliente</th>`,
  `                  <th className="px-6 py-4">Empleado</th>\n                  <th className="px-6 py-4">Cliente</th>\n                  <th className="px-6 py-4">Artículo</th>`
);

// 7. Add article to Table display (Body)
code = code.replace(
  `                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 font-medium">\n                      {sale.clientName || '-'}\n                    </td>`,
  `                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 font-medium">\n                      {sale.clientName || '-'}\n                    </td>\n                    <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">\n                      {sale.article || '-'}\n                    </td>`
);

// 8. Add article to Modal Form
const formArticle = `
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                  <ShoppingCart className="w-4 h-4 text-neutral-400" /> Artículo Vendido
                </label>
                <input
                  type="text"
                  required
                  value={formData.article}
                  onChange={(e) => setFormData({...formData, article: e.target.value})}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white"
                  placeholder="Ej. Moto XYZ / Repuestos"
                />
              </div>
`;

code = code.replace(
  `              <div className="grid grid-cols-2 gap-4">`,
  formArticle + `\n              <div className="grid grid-cols-2 gap-4">`
);

fs.writeFileSync('src/pages/Sales.tsx', code);
console.log('Patched Sales.tsx with article');
