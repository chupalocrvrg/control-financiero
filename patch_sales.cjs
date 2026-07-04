const fs = require('fs');
let content = fs.readFileSync('src/pages/Sales.tsx', 'utf8');

const targetStr = `                    <td className="px-6 py-4">
                      {sale.isMoto ? (
                        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                          <Bike className="w-4 h-4" />
                          <span className="capitalize text-xs">Moto {sale.motoType}</span>
                        </div>
                      ) : (
                        <span className="text-neutral-500">Mercadería General</span>
                      )}
                    </td>`;

const replaceStr = `                    <td className="px-6 py-4">
                      {sale.isMoto ? (
                        <div className="flex flex-col gap-1 mb-1">
                          <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                            <Bike className="w-4 h-4" />
                            <span className="capitalize text-xs">Moto {sale.motoType}</span>
                          </div>
                          {sale.article && <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{sale.article}</div>}
                        </div>
                      ) : (
                        <div className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">{sale.article || 'Mercadería General'}</div>
                      )}
                      {sale.clientName && (
                        <div className="text-xs text-neutral-500 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {sale.clientName}
                        </div>
                      )}
                    </td>`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replaceStr);
    fs.writeFileSync('src/pages/Sales.tsx', content);
    console.log("Sales updated");
} else {
    console.log("Sales pattern not found");
}
