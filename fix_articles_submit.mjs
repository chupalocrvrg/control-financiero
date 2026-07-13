import fs from 'fs';

let content = fs.readFileSync('src/components/inventory/ArticlesTab.tsx', 'utf8');

const regex = /const handleSubmit = async \(\e: React.FormEvent\) => \{\s*e.preventDefault\(\);\s*if \(\!currentEnterpriseId\) return;\s*/;

const newBlock = `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEnterpriseId) return;

    if (matchedArticle && !editingArticle) {
      const confirmed = await showConfirm(
        'Código de barras / Artículo ya registrado',
        \`El artículo con este código de barras o datos ya está registrado como "\${matchedArticle.name}". ¿Desea sumar el nuevo ingreso a dicho producto? (Esto evitará duplicados)\`,
        { type: 'warning', confirmText: 'Sí, sumar stock', cancelText: 'No, cancelar' }
      );
      if (!confirmed) {
        return;
      }
    }

`;

if (regex.test(content)) {
    content = content.replace(regex, newBlock);
    fs.writeFileSync('src/components/inventory/ArticlesTab.tsx', content);
    console.log('Replaced successfully');
} else {
    console.log('Regex failed');
}
