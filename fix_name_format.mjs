import fs from 'fs';

let content = fs.readFileSync('src/components/inventory/ArticlesTab.tsx', 'utf8');

// Update computedName
content = content.replace(
  "const computedName = `${formData.brand.trim()} ${formData.model.trim()}`;",
  "const computedName = `${formData.category.trim()} ${formData.brand.trim()} ${formData.model.trim()}${formData.barcode.trim() ? ' ' + formData.barcode.trim() : ''}`.trim().replace(/\\s+/g, ' ');"
);

// Update UI
content = content.replace(
  "placeholder=\"Se generará automáticamente con Marca y Modelo\"",
  "placeholder=\"Categoría + Marca + Modelo + Código de Barras\""
);

content = content.replace(
  "value={`${formData.brand.trim()} ${formData.model.trim()}`.trim()}",
  "value={`${formData.category.trim()} ${formData.brand.trim()} ${formData.model.trim()}${formData.barcode.trim() ? ' ' + formData.barcode.trim() : ''}`.trim().replace(/\\s+/g, ' ')}"
);

fs.writeFileSync('src/components/inventory/ArticlesTab.tsx', content);
console.log("Updated name format");
