const fs = require('fs');
let content = fs.readFileSync('src/pages/Collections.tsx', 'utf8');

const targetTableStr = `                      {coll.noReceipt ? (
                        <span className="text-amber-600 dark:text-amber-400 italic">Sin Recibo (Agencia)</span>
                      ) : (`;

const replaceTableStr = `                      {coll.noReceipt ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-amber-600 dark:text-amber-400 italic">Sin Recibo (Agencia)</span>
                          {coll.clientName && (
                            <div className="text-xs text-neutral-500 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {coll.clientName}
                            </div>
                          )}
                        </div>
                      ) : (`;

content = content.replace(targetTableStr, replaceTableStr);
fs.writeFileSync('src/pages/Collections.tsx', content);
console.log("Patched Collections table");
