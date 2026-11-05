import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const style = readFileSync(resolve(root, 'style.css'), 'utf8');
const collision = readFileSync(resolve(root, 'src/collision.js'), 'utf8')
  .replace(/\bexport\s+(?=(?:async\s+function|const|function|class)\b)/g, '');
const spatial = readFileSync(resolve(root, 'src/spatial.js'), 'utf8').replace(/\bexport\s+(?=(?:async\s+function|const|function|class)\b)/g, '');
const hall = readFileSync(resolve(root, 'src/hall.js'), 'utf8').replace(/\bexport\s+(?=(?:async\s+function|const|function|class)\b)/g, '');
const universe = readFileSync(resolve(root, 'src/universe.js'), 'utf8')
  .replace(/^import\s+[^\n]+;\s*/gm, '').replace(/\bexport\s+(?=(?:async\s+function|const|function|class)\b)/g, '');
const omegaTerrain = readFileSync(resolve(root, 'src/omega-terrain.js'), 'utf8').replace(/^import\s+[^\n]+;\s*/gm, '').replace(/\bexport\s+(?=(?:async\s+function|const|function|class)\b)/g, '');
const ecology = readFileSync(resolve(root, 'src/ecology.js'), 'utf8').replace(/^import\s+[^\n]+;\s*/gm, '').replace(/\bexport\s+(?=(?:async\s+function|const|function|class)\b)/g, '');
const omegaVisuals = readFileSync(resolve(root, 'src/omega-visuals.js'), 'utf8').replace(/^import\s+[^\n]+;\s*/gm, '').replace(/\bexport\s+(?=(?:async\s+function|const|function|class)\b)/g, '');
const art = readFileSync(resolve(root, 'src/art.js'), 'utf8').replace(/^import\s+[^\n]+;\s*/gm, '').replace(/\bexport\s+(?=(?:async\s+function|const|function|class)\b)/g, '');
const atlas = readFileSync(resolve(root, 'assets/sprites/atlas.png')).toString('base64');
const sound = readFileSync(resolve(root, 'src/sound.js'), 'utf8').replace(/\bexport\s+(?=(?:async\s+function|const|function|class)\b)/g, '');
const music = readFileSync(resolve(root, 'src/music.js'), 'utf8').replace(/\bexport\s+(?=(?:async\s+function|const|function|class)\b)/g, '');
const input = readFileSync(resolve(root, 'src/input.js'), 'utf8').replace(/\bexport\s+(?=(?:async\s+function|const|function|class)\b)/g, '');
const game = readFileSync(resolve(root, 'src/game.js'), 'utf8')
  .replace(/^import\s+[^\n]+;\s*/gm, '');
const standalone = html
  .replace('<link rel="stylesheet" href="style.css">', `<style>\n${style}\n</style>`)
  .replace('<script type="module" src="src/game.js"></script>', '')
  .replace('</body>', `<script>\n'use strict';\nwindow.__ASH_RUSH_ATLAS__='data:image/png;base64,${atlas}';\n${collision}\n${spatial}\n${hall}\n${universe}\n${omegaTerrain}\n${omegaVisuals}\n${ecology}\n${art}\n${sound}\n${music}\n${input}\n${game}\n</script>\n</body>`);
if (standalone.includes('src/game.js') || standalone.includes('stylesheet" href="style.css') || /^\s*(import|export)\s/m.test(standalone.split('<script>').pop())) throw Error('Standalone failed to inline files');
writeFileSync(resolve(root, 'ash-rush-standalone.html'), standalone, 'utf8');
console.log('Created ash-rush-standalone.html (all CSS & JavaScript in one file).');
