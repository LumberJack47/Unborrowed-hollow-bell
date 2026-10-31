import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL(path,import.meta.url),'utf8');
const stripModule = text => text.replace(/^import[^\r\n]*\r?\n/gm,'').replace(/^export /gm,'');
const files = ['dist/engine.js','dist/game/world.js','dist/game/story.js','dist/game/render.js','dist/game/audio.js','dist/game/ledger.js','dist/game/access.js','dist/game/main.js'];
const script = (await Promise.all(files.map(read))).map(stripModule).join('\n\n');
new vm.Script(script,{filename:'unborrowed-bundle.js'});
const font = (await readFile(new URL('dist/fonts/VT323.ttf',import.meta.url))).toString('base64');
const css = (await read('dist/game.css')).replace("url('/fonts/VT323.ttf')",`url('data:font/ttf;base64,${font}')`);
const icon = await read('dist/favicon.svg'), license = await read('dist/fonts/VT323-OFL.txt');
const html = (await read('dist/index.html'))
  .replace('<link rel="icon" href="/favicon.svg" type="image/svg+xml">',()=>`<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(icon)}" type="image/svg+xml">`)
  .replace('<link rel="stylesheet" href="/game.css">',()=>`<style>${css}</style>`)
  .replace('<script type="module" src="/game/main.js"></script>',()=>`<script type="text/plain" id="font-license">${license}</script><script type="module">${script}</script>`);
await writeFile(new URL('dist/offline.html',import.meta.url),html);
await writeFile(new URL('../Unborrowed-offline.html',import.meta.url),html);
console.log('Built Unborrowed-offline.html: world, art, story, font, and audio included.');
