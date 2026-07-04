const fs = require('fs');
let content = fs.readFileSync('src/pages/Collections.tsx', 'utf8');

const targetFormStr = `                <div className="flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer h-10 px-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl w-full">
                    <input
                      type="checkbox"
                      checked={formData.noReceipt}
                      onChange={(e) => setFormData({...formData, noReceipt: e.target.checked})}
                      className="w-5 h-5 text-amber-600 rounded border-neutral-300 focus:ring-amber-500"
                    />
                    <span className="font-medium text-amber-800 dark:text-amber-400 text-sm">
                      Cobro en agencia (Sin recibo de talonario)
                    </span>
                  </label>
                </div>
              </div>`;

const replacementFormStr = `                <div className="flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer h-10 px-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl w-full">
                    <input
                      type="checkbox"
                      checked={formData.noReceipt}
                      onChange={(e) => setFormData({...formData, noReceipt: e.target.checked})}
                      className="w-5 h-5 text-amber-600 rounded border-neutral-300 focus:ring-amber-500"
                    />
                    <span className="font-medium text-amber-800 dark:text-amber-400 text-sm">
                      Cobro en agencia (Sin recibo de talonario)
                    </span>
                  </label>
                </div>
              </div>
              
              {formData.noReceipt && (
                <div className="mb-6 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-neutral-400" /> Nombre del Cliente
                  </label>
                  <input
                    type="text"
                    required={formData.noReceipt}
                    value={formData.clientName}
                    onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white"
                    placeholder="Nombre del cliente al que se le cobró"
                  />
                </div>
              )}`;

content = content.replace(targetFormStr, replacementFormStr);
fs.writeFileSync('src/pages/Collections.tsx', content);
console.log("Patched form");
