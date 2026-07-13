import fs from 'fs';

let content = fs.readFileSync('src/components/inventory/ArticlesTab.tsx', 'utf8');

const regex = /\{\/\* Nombre del Artículo \*\/\}\s*<div>\s*<label className="text-\[10px\] font-black text-neutral-400 uppercase tracking-widest block mb-1\.5">Nombre del Artículo \*<\/label>\s*<input\s*type="text"\s*required\s*placeholder="Ej\. Cocina de Inducción, Parlante Bluetooth, Nevera"\s*value=\{formData\.name(\s*\|\|\s*'')?\}\s*onChange=\{\(e\) => setFormData\(\{ \.\.\.formData, name: e\.target\.value \}\)\}\s*className="[^"]*"\s*\/>\s*<\/div>/;

if (!regex.test(content)) {
    console.log("Could not find the target to replace");
} else {
    const newContent = `{matchedArticle && !editingArticle && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl mb-4">
                    <p className="text-xs font-bold text-green-700 dark:text-green-400">Artículo Existente detectado. Se ingresará stock adicional.</p>
                  </div>
                )}
                {/* Nombre del Artículo Generado Automáticamente */}
                <div>
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5">Nombre del Artículo (Automático)</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Se generará automáticamente con Marca y Modelo"
                    value={\`\${formData.brand.trim()} \${formData.model.trim()}\`.trim()}
                    className="w-full px-4 py-3 bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none text-neutral-500 dark:text-neutral-400 cursor-not-allowed uppercase font-bold"
                  />
                </div>`;
    content = content.replace(regex, newContent);
    fs.writeFileSync('src/components/inventory/ArticlesTab.tsx', content);
    console.log("Replaced successfully!");
}
