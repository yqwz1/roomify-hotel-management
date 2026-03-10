/**
 * Script to automatically convert physical Tailwind CSS properties to logical ones.
 * Run this in your frontend folder using: node scripts/convert-tailwind-logical.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../src');

// Regular expressions and their replacements
const replacements = [
  { regex: /\b(m|p)l-/g, replacement: '$1s-' },     // ml- -> ms-, pl- -> ps-
  { regex: /\b(m|p)r-/g, replacement: '$1e-' },     // mr- -> me-, pr- -> pe-
  { regex: /\btext-left\b/g, replacement: 'text-start' },
  { regex: /\btext-right\b/g, replacement: 'text-end' },
  { regex: /\bborder-l(-|\b)/g, replacement: 'border-s$1' },
  { regex: /\bborder-r(-|\b)/g, replacement: 'border-e$1' },
  { regex: /\brounded-l(-|\b)/g, replacement: 'rounded-s$1' },
  { regex: /\brounded-r(-|\b)/g, replacement: 'rounded-e$1' },
  { regex: /\bleft-([a-z0-9/.]+)\b/g, replacement: 'start-$1' },
  { regex: /\bright-([a-z0-9/.]+)\b/g, replacement: 'end-$1' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (/\.(jsx|tsx|js|ts|html)$/.test(file)) {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;

      for (const { regex, replacement } of replacements) {
        content = content.replace(regex, replacement);
      }

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
      }
    }
  }
}

console.log('Starting Tailwind logical properties conversion...');
processDirectory(srcDir);
console.log('Conversion complete! Please review changes using git diff.');
