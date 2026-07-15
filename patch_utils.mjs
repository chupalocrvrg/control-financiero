import fs from 'fs';
const file = 'src/lib/utils.ts';
let code = fs.readFileSync(file, 'utf8');

const oldBlock = `export const SUPER_ADMIN_EMAILS = [
  import.meta.env.VITE_SUPER_ADMIN_EMAIL,
  'marcelogutama3eroa@gmail.com',
  'blacksirius869@gmail.com'
].filter(Boolean) as string[];`;

const newBlock = `export const SUPER_ADMIN_EMAILS = [
  import.meta.env.VITE_SUPER_ADMIN_EMAIL,
  ...(import.meta.env.VITE_SUPER_ADMIN_EMAILS || '').split(',').map(e => e.trim())
].filter(Boolean) as string[];`;

if (code.includes(oldBlock)) {
  code = code.replace(oldBlock, newBlock);
  fs.writeFileSync(file, code);
  console.log('patched utils.ts');
} else {
  console.log('block not found');
}
