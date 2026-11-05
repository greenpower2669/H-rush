import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const style = readFileSync(resolve(root, 'style.css'), 'utf8');
const collision = readFileSync(resolve(root, 'src/collision.js'), 'utf8')
  .replace(/\bexport\s+(?=(?:const|function|class)\b)/g, '');
const game = readFileSync(resolve(root, 'src/game.js'), 'utf8')
  .replace(/^import\s+\{[^\n]+\}\s+from\s+'\.\/collision\.js';\s*/m, '');
const standalone = html
  .replace('<link rel="stylesheet" href="style.css">', `<style>\n${style}\n</style>`)
  .replace('<script type="module" src="src/game.js"></script>', '')
  .replace('</body>', `<script>\n'use strict';\n${collision}\n${game}\n</script>\n</body>`);
if (standalone.includes('src/game.js') || standalone.includes('stylesheet" href="style.css')) throw Error('Standalone failed to inline files');
writeFileSync(resolve(root, 'ash-rush-standalone.html'), standalone, 'utf8');
console.log('Created ash-rush-standalone.html (all CSS & JavaScript in one file).');