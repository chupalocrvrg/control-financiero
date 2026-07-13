import fs from 'fs';

let content = fs.readFileSync('src/components/inventory/ArticlesTab.tsx', 'utf8');

// 1. Rename New Article button and add required state variables
content = content.replace(
  "const [formData, setFormData] = useState({",
  `const [matchedArticle, setMatchedArticle] = useState<Article | null>(null);\n  const [formData, setFormData] = useState({`
);

content = content.replace(
  "    name: '',\n    category: '',\n    brand: '',\n    model: '',\n    series: '',\n    barcode: '',",
  "    category: '',\n    brand: '',\n    model: '',\n    barcode: '',\n    requiresSeries: false,\n    seriesInput: '',"
);

// 2. Update handleOpenModal
content = content.replace(
  /setFormData\(\{[\s\S]*?name: article\.name,[\s\S]*?initialWarehouseId: '' \/\/ No initial warehouse edit after creation\n\s*\}\);/g,
  `setFormData({
        category: article.category || '',
        brand: article.brand || '',
        model: article.model || '',
        barcode: article.barcode || '',
        minStockAlert: article.minStockAlert,
        initialQuantity: article.quantity,
        initialWarehouseId: '',
        requiresSeries: article.requiresSeries || false,
        seriesInput: (article.seriesList || []).join('\\n')
      });`
);

content = content.replace(
  /setFormData\(\{[\s\S]*?name: '',[\s\S]*?initialWarehouseId: warehouses\[0\]\?\.id \|\| ''\n\s*\}\);/g,
  `setFormData({
        category: '',
        brand: '',
        model: '',
        barcode: '',
        minStockAlert: 5,
        initialQuantity: 0,
        initialWarehouseId: warehouses[0]?.id || '',
        requiresSeries: false,
        seriesInput: ''
      });`
);

// 3. Add useEffect for matching
content = content.replace(
  "const handleSubmit = async (e: React.FormEvent) => {",
  `useEffect(() => {
    if (editingArticle || !isModalOpen) {
      setMatchedArticle(null);
      return;
    }
    
    let match = null;
    if (formData.barcode && formData.barcode.trim()) {
      match = articles.find(a => a.barcode?.toLowerCase() === formData.barcode.trim().toLowerCase()) || null;
    } 
    if (!match && formData.model && formData.brand && formData.model.trim() && formData.brand.trim()) {
      match = articles.find(a => a.model?.toLowerCase() === formData.model.trim().toLowerCase() && a.brand?.toLowerCase() === formData.brand.trim().toLowerCase()) || null;
    }

    if (match) {
      setMatchedArticle(match);
      setFormData(prev => ({
        ...prev,
        category: prev.category || match!.category || '',
        brand: prev.brand || match!.brand || '',
        model: prev.model || match!.model || '',
        barcode: prev.barcode || match!.barcode || '',
        requiresSeries: match!.requiresSeries || false
      }));
    } else {
      setMatchedArticle(null);
    }
  }, [formData.barcode, formData.model, formData.brand, articles, editingArticle, isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {`
);

// 4. Update handleSubmit validations
content = content.replace(
  /if \(!formData\.name\.trim\(\)\) \{\s*setError\('El nombre del artículo es obligatorio\.'\);\s*return;\s*\}/g,
  ""
);

// Add series validation inside handleSubmit
const seriesValidation = `
    let seriesArray: string[] = [];
    if (formData.requiresSeries) {
      seriesArray = formData.seriesInput.split(/[\\n,]+/).map(s => s.trim()).filter(Boolean);
      const targetQuantity = editingArticle ? editingArticle.quantity : Number(formData.initialQuantity || 0);
      if (seriesArray.length !== targetQuantity) {
        setError(\`Debe ingresar exactamente \${targetQuantity} series (una por artículo). Actual: \${seriesArray.length}\`);
        setSubmitting(false);
        return;
      }
    }
    const computedName = \`\${formData.brand.trim()} \${formData.model.trim()}\`;
`;

content = content.replace(
  "try {\n      if (editingArticle) {",
  seriesValidation + "\n    try {\n      if (editingArticle) {"
);

// 5. Update editing logic
content = content.replace(
  /await updateDoc\(artRef, \{[\s\S]*?minStockAlert: Number\(formData\.minStockAlert\)[\s\S]*?\}\);/g,
  `await updateDoc(artRef, {
          name: computedName,
          category: formData.category.trim(),
          brand: formData.brand.trim(),
          model: formData.model.trim(),
          requiresSeries: formData.requiresSeries,
          seriesList: seriesArray,
          barcode: formData.barcode.trim(),
          minStockAlert: Number(formData.minStockAlert)
        });`
);

// 6. Update creation logic (and matched article add stock)
const creationLogic = `
        const batch = writeBatch(db);
        let artId = '';
        let currentArtSeries: string[] = [];

        if (matchedArticle) {
          artId = matchedArticle.id;
          currentArtSeries = matchedArticle.seriesList || [];
          
          const artRef = doc(db, 'articles', artId);
          batch.update(artRef, {
            quantity: matchedArticle.quantity + Number(formData.initialQuantity || 0),
            seriesList: [...currentArtSeries, ...seriesArray]
          });
        } else {
          const artRef = doc(collection(db, 'articles'));
          artId = artRef.id;
          const newArticle = {
            name: computedName,
            category: formData.category.trim(),
            brand: formData.brand.trim(),
            model: formData.model.trim(),
            requiresSeries: formData.requiresSeries,
            seriesList: seriesArray,
            barcode: formData.barcode.trim(),
            minStockAlert: Number(formData.minStockAlert),
            quantity: Number(formData.initialQuantity || 0),
            userId: currentEnterpriseId,
            createdAt: Timestamp.now()
          };
          batch.set(artRef, newArticle);
        }

        const invId = \`\${formData.initialWarehouseId}_\${artId}\`;
        const invRef = doc(db, 'warehouse_inventory', invId);
        
        // We need to know if warehouse_inventory exists to update it, but we are doing it in a batch...
        // Let's do it right before batch:
        const { getDoc } = await import('firebase/firestore');
        const invSnap = await getDoc(invRef);
        
        if (invSnap.exists()) {
          const existingInv = invSnap.data();
          batch.update(invRef, {
            quantity: existingInv.quantity + Number(formData.initialQuantity || 0),
            seriesList: [...(existingInv.seriesList || []), ...seriesArray]
          });
        } else {
          batch.set(invRef, {
            id: invId,
            warehouseId: formData.initialWarehouseId,
            articleId: artId,
            quantity: Number(formData.initialQuantity || 0),
            seriesList: seriesArray,
            userId: currentEnterpriseId
          });
        }

        await batch.commit();
`;

content = content.replace(
  /const batch = writeBatch\(db\);[\s\S]*?await batch\.commit\(\);/g,
  creationLogic
);

// 7. Update UI: replace "Nuevo Artículo" with "Ingreso de Mercadería"
content = content.replace(/>Nuevo Artículo</g, ">Ingreso de Mercadería<");
content = content.replace(/'Nuevo Artículo'/g, "'Ingreso de Mercadería'");

// 8. Update UI fields (remove Name field, add requiresSeries, seriesInput, matched badge)
content = content.replace(
  /<label className="text-\[10px\] font-black text-neutral-400 uppercase tracking-widest block mb-1\.5">Nombre del Artículo \*<\/label>[\s\S]*?<\/div>\s*<div>/g,
  `{matchedArticle && !editingArticle && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl mb-4">
                    <p className="text-xs font-bold text-green-700 dark:text-green-400">Artículo Existente detectado. Se ingresará stock adicional.</p>
                  </div>
                )}
                <div>`
);

content = content.replace(
  /<div>\s*<label className="text-\[10px\] font-black text-neutral-400 uppercase tracking-widest block mb-1\.5">Número de Serie \(Opcional\)<\/label>[\s\S]*?<\/div>/g,
  `<div>
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={formData.requiresSeries}
                        onChange={(e) => setFormData({ ...formData, requiresSeries: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded border-neutral-300 focus:ring-indigo-500"
                      />
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Requerir Series / Seriales</span>
                    </label>
                    {formData.requiresSeries && (
                      <textarea
                        placeholder="Ingrese series separadas por coma o salto de línea"
                        value={formData.seriesInput}
                        onChange={(e) => setFormData({ ...formData, seriesInput: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-neutral-900 dark:text-neutral-50 transition-all uppercase font-mono"
                      />
                    )}
                  </div>`
);

// Fix searchTerm filter (art.series doesn't exist anymore)
content = content.replace(
  /\(art\.series && art\.series\.toLowerCase\(\)\.includes\(searchTerm\.toLowerCase\(\)\)\) \|\|/g,
  `((art.seriesList || []).some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))) ||`
);

fs.writeFileSync('src/components/inventory/ArticlesTab.tsx', content);
console.log("Updated ArticlesTab.tsx");
