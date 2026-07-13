import fs from 'fs';
const file = 'src/types/inventory.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace('series?: string; // Optional serial number', 'requiresSeries?: boolean; // Whether this article requires serial numbers\n  seriesList?: string[]; // Array of available serial numbers globally');
code = code.replace('quantity: number;\n  userId: string;', 'quantity: number;\n  seriesList?: string[]; // Array of serial numbers available in this warehouse\n  userId: string;');
code = code.replace('series?: string;', 'seriesList?: string[];');
code = code.replace('series?: string;', 'seriesList?: string[];'); // for LoanReturnArticle
code = code.replace('isGift: boolean;', 'isGift: boolean;\n  seriesList?: string[];'); // for SoldArticle

fs.writeFileSync(file, code);
console.log("updated types");
