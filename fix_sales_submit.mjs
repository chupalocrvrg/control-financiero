import fs from 'fs';

let content = fs.readFileSync('src/components/inventory/SalesTab.tsx', 'utf8');

// Also update SaleItemRow interface
const interfaceStr = `interface SaleItemRow {
  articleId: string;
  name?: string;
  warehouseId: string;
  warehouseName?: string;
  quantity: number;
  isGift: boolean;`;

const newInterfaceStr = `interface SaleItemRow {
  articleId: string;
  name?: string;
  warehouseId: string;
  warehouseName?: string;
  quantity: number;
  isGift: boolean;
  selectedSeries?: string[];`;

content = content.replace(interfaceStr, newInterfaceStr);

// In handleSubmit
const submitStr = `      await executeInventorySale(
        currentEnterpriseId,
        clientName.trim(),
        sellerId,
        sellerName,
        saleItems
      );`;

const newSubmitStr = `      await executeInventorySale(
        currentEnterpriseId,
        clientName.trim(),
        sellerId,
        sellerName,
        saleItems.map(item => ({
          ...item,
          seriesList: item.selectedSeries
        }))
      );`;

content = content.replace(submitStr, newSubmitStr);

// also we must ensure that series validation happens!
// if an article requires series, the length of selectedSeries must match quantity.
const validationStr = `    for (const item of saleItems) {
      if (item.quantity <= 0) {
        setError('Las cantidades a vender deben ser mayores a 0.');
        return;
      }`;

const newValidationStr = `    for (const item of saleItems) {
      if (item.quantity <= 0) {
        setError('Las cantidades a vender deben ser mayores a 0.');
        return;
      }
      const art = articles.find(a => a.id === item.articleId);
      if (art?.requiresSeries && item.quantity !== (item.selectedSeries?.length || 0)) {
        setError(\`El artículo "\${art.name}" requiere que seleccione \${item.quantity} series. Seleccionadas: \${item.selectedSeries?.length || 0}\`);
        return;
      }`;

content = content.replace(validationStr, newValidationStr);

fs.writeFileSync('src/components/inventory/SalesTab.tsx', content);
console.log("SalesTab submit updated!");
