import {MAPS, TILE, tileAt, entitiesFor} from './world.js';

const noise = (x, y, seed = 0) => { let n = Math.imul(x + 71, 374761393) ^ Math.imul(y + seed + 29, 668265263); n = Math.imul(n ^ n >>> 13, 1274126177); return (n ^ n >>> 16) >>> 0; };
const palette = {
  village: { grass: '#3e5942', grass2: '#46624a', dark: '#2e4636', path: '#887653', fleck: '#9c8b61', tree: ['#172c2b', '#243c33', '#34513c', '#4d6844'], stone: '#637366' },
  woods: { grass: '#29473b', grass2: '#304d3f', dark: '#203a34', path: '#5c6950', fleck: '#788369', tree: ['#142a2c', '#1c3831', '#2c4a3b', '#3e5c43'], stone: '#536b62' },
  river: { grass: '#425c43', grass2: '#4b6447', dark: '#334c3b', path: '#8c7956', fleck: '#aa9365', tree: ['#193330', '#2b4537', '#3d5b40', '#617c4b'], stone: '#73816b' },
  belfry: { grass: '#263c43', grass2: '#2b4248', dark: '#1a2c36', path: '#536063', fleck: '#71817a', tree: ['#14242d', '#243841', '#344b50', '#4a6562'], stone: '#43595b' },
};

function pixels(ctx, color, rects) { ctx.fillStyle = color; for (const r of rects) ctx.fillRect(...r); }
function star(ctx, x, y, color, size = 2) { pixels(ctx, color, [[x - size, y, size * 2 + 1, 1], [x, y - size, 1, size * 2 + 1]]); }

export function drawCharacter(ctx, who, x, y, time = 0, moving = false, facing = 'down', scale = 1, light = false) {
  ctx.save(); ctx.translate(Math.round(x - 8 * scale), Math.round(y - 23 * scale)); ctx.scale(scale, scale);
  const step = moving ? Math.sin(time * 13) : 0, bob = moving ? Math.round(Math.abs(step)) : 0;
  const leg = step > 0 ? 1 : 0;
  pixels(ctx, '#15252c', [[3, 21 + leg, 4, 3], [9, 21 + 1 - leg, 4, 3]]);
  ctx.translate(0, -bob);
  if (who === 'nim') {
    pixels(ctx, '#244d57', [[3, 4, 10, 18], [1, 10, 14, 9]]);
    pixels(ctx, '#9acbb9', [[4, 4, 8, 7], [3, 11, 10, 9], [2, 19, 4, 2], [10, 19, 4, 2]]);
    pixels(ctx, '#d5e6be', [[3, 1, 2, 5], [11, 1, 2, 5], [2, 0, 2, 2], [12, 0, 2, 2], [5, 4, 6, 2]]);
    pixels(ctx, '#34626a', [[5, 6, 6, 5], [6, 12, 4, 7]]);
    pixels(ctx, '#f7d28c', [[5, 7, 1, 2], [10, 7, 1, 2], [7, 13, 2, 2]]);
  } else if (who === 'brin') {
    pixels(ctx, '#283d37', [[3, 7, 10, 15], [1, 13, 14, 6]]);
    pixels(ctx, '#a47b54', [[4, 10, 8, 12], [2, 13, 2, 7], [12, 13, 2, 7]]);
    pixels(ctx, '#dbc9a0', [[4, 5, 8, 7], [3, 9, 2, 4], [11, 9, 2, 4], [6, 13, 4, 8]]);
    pixels(ctx, '#576e56', [[2, 4, 12, 3], [4, 1, 8, 4], [6, 0, 5, 2]]);
    pixels(ctx, '#8da478', [[4, 2, 7, 1], [1, 6, 14, 1]]);
    pixels(ctx, '#394a3b', [[5, 8, 1, 1], [10, 8, 1, 1], [7, 11, 2, 1]]);
    pixels(ctx, '#e5b873', [[1, 18, 2, 4]]);
  } else if (who === 'tove') {
    pixels(ctx, '#192d30', [[3, 4, 10, 18], [1, 12, 14, 7]]);
    pixels(ctx, '#7eac8a', [[3, 4, 10, 7], [2, 2, 4, 4], [10, 2, 4, 4], [1, 12, 3, 7], [12, 12, 3, 7]]);
    pixels(ctx, '#c3d4a0', [[3, 3, 2, 2], [11, 3, 2, 2], [5, 8, 6, 2]]);
    pixels(ctx, '#263c40', [[4, 4, 1, 2], [11, 4, 1, 2]]);
    pixels(ctx, '#b58b59', [[4, 12, 8, 10], [5, 10, 2, 4], [9, 10, 2, 4]]);
    pixels(ctx, '#548b9a', [[2, 10, 12, 3], [3, 13, 3, 5]]);
    pixels(ctx, '#d5bb78', [[6, 17, 4, 3]]);
  } else if (who === 'orrin') {
    pixels(ctx, '#253d45', [[2, 5, 12, 17], [0, 12, 16, 7]]);
    pixels(ctx, '#a98761', [[3, 3, 10, 10], [2, 1, 3, 5], [11, 1, 3, 5]]);
    pixels(ctx, '#e1cba1', [[4, 5, 3, 5], [9, 5, 3, 5], [7, 10, 2, 3]]);
    pixels(ctx, '#4b392e', [[4, 6, 3, 3], [9, 6, 3, 3]]);
    pixels(ctx, '#d7b96e', [[3, 5, 5, 1], [8, 5, 5, 1], [3, 9, 5, 1], [8, 9, 5, 1], [3, 5, 1, 5], [12, 5, 1, 5]]);
    pixels(ctx, '#668d94', [[4, 14, 8, 8]]);
  } else {
    // A red-caped courier, with a small amber hood and an unaddressed letter.
    pixels(ctx, '#1d2c32', [[4, 3, 8, 19], [2, 10, 12, 9]]);
    pixels(ctx, '#984f4a', [[2, 10, 12, 11], [1, 14, 3, 7], [12, 12, 3, 9]]);
    pixels(ctx, '#bd6b53', [[3, 11, 2, 9], [11, 11, 2, 8]]);
    pixels(ctx, '#517b78', [[5, 12, 6, 9]]);
    pixels(ctx, '#e5bc7d', [[4, 4, 8, 7], [2, 13, 2, 4], [12, 13, 2, 4]]);
    pixels(ctx, '#bf8e55', [[3, 2, 10, 4], [5, 0, 7, 3], [2, 5, 12, 2]]);
    pixels(ctx, '#e9cb8a', [[4, 2, 7, 2], [3, 5, 10, 1]]);
    if (facing !== 'up') pixels(ctx, '#293438', [[5, 8, 1, 1], [10, 8, 1, 1], [7, 10, 2, 1]]);
    else pixels(ctx, '#a97849', [[4, 7, 8, 4]]);
    pixels(ctx, '#e3a36b', [[3, 11, 10, 2], [11, 12, 3, 3]]);
    if (light) { pixels(ctx, '#414a34', [[13, 15, 3, 6]]); pixels(ctx, '#ffcf7d', [[14, 16, 2, 3]]); }
  }
  ctx.restore();
}

export function portrait(who) {
  const canvas = document.createElement('canvas'); canvas.width = 48; canvas.height = 48;
  const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false;
  if (['player', 'brin', 'tove', 'nim', 'orrin'].includes(who)) drawCharacter(c, who, 24, 49, 0, false, 'down', 2);
  else if (who === 'cat') { pixels(c, '#d8c7a3', [[9, 17, 30, 22], [9, 8, 7, 13], [32, 8, 7, 13]]); pixels(c, '#324343', [[16, 25, 4, 3], [29, 25, 4, 3], [23, 31, 4, 2]]); }
  else if (who === 'flower') { for (let i = 0; i < 5; i++) star(c, 24 + Math.round(Math.cos(i * 1.256) * 9), 21 + Math.round(Math.sin(i * 1.256) * 9), '#e7d498', 3); pixels(c, '#819b73', [[23, 24, 2, 20], [17, 33, 7, 3]]); }
  else if (who === 'clapper' || who === 'bell') { pixels(c, '#d4ab68', [[18, 7, 12, 27], [15, 29, 18, 8], [21, 4, 6, 5]]); pixels(c, '#f0d396', [[19, 9, 3, 20]]); }
  else if (who === 'lantern') { pixels(c, '#bb9c64', [[17, 6, 14, 3], [14, 9, 3, 11], [31, 9, 3, 11], [12, 18, 24, 4], [12, 39, 24, 4], [12, 21, 4, 19], [32, 21, 4, 19]]); pixels(c, '#ecd18e', [[17, 23, 14, 14]]); pixels(c, '#fff1ba', [[22, 25, 5, 10]]); }
  else if (who === 'ribbon') { pixels(c, '#4c808d', [[8, 10, 8, 15], [13, 18, 17, 7], [26, 20, 8, 18], [31, 31, 10, 6]]); pixels(c, '#96c5bb', [[9, 11, 3, 10], [15, 19, 13, 2], [27, 24, 2, 10]]); }
  else if (who === 'moth') { pixels(c,'#ded5ae',[[6,12,12,10],[10,21,11,9],[29,12,12,10],[26,21,11,9],[21,17,6,21],[17,9,3,10],[28,9,3,10]]);pixels(c,'#a8a582',[[10,15,7,2],[30,15,7,2],[14,24,5,2],[28,24,5,2],[23,22,2,14]]); }
  else if (who === 'letter') { pixels(c, '#c9c29f', [[8, 13, 33, 23]]); pixels(c, '#e6dfbb', [[10, 14, 29, 19]]); pixels(c, '#92866b', [[11, 17, 7, 2], [17, 20, 7, 2], [23, 17, 8, 2], [29, 14, 8, 2]]); pixels(c, '#a26853', [[21, 22, 7, 7]]); }
  else { pixels(c, '#6a8073', [[9, 12, 30, 27], [14, 7, 20, 7]]); pixels(c, '#acb594', [[14, 12, 21, 3], [17, 20, 3, 12], [26, 20, 5, 3]]); }
  return canvas.toDataURL();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false }); this.ctx.imageSmoothingEnabled = false;
    this.ground = new Map(); this.camera = { x: 0, y: 0 }; this.scene = null;
    this.shade = document.createElement('canvas'); this.shade.width = 640; this.shade.height = 360;
  }
  makeGround(map) {
    const canvas = document.createElement('canvas'); canvas.width = map.w * 16; canvas.height = map.h * 16;
    const c = canvas.getContext('2d'), p = palette[map.biome];
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
      const t = map.tiles[y][x], n = noise(x, y), xx = x * 16, yy = y * 16;
      c.fillStyle = t === 1 ? p.path : t === 2 || t === 4 ? '#234650' : t === 5 ? p.stone : n % 3 ? p.grass : p.grass2; c.fillRect(xx, yy, 16, 16);
      if (t === 5) { pixels(c, '#243c3a', [[xx, yy, 16, 1], [xx + (y % 2 ? 6 : 13), yy, 1, 16]]); pixels(c, '#91a08a55', [[xx + 2, yy + 2, 8, 1]]); }
      else if (t !== 2 && t !== 4) {
        c.fillStyle = t === 1 ? p.fleck : p.dark;
        for (let k = 0; k < 4; k++) c.fillRect(xx + (n >>> (k * 3) & 13) + 1, yy + (n >>> (k * 4 + 2) & 13) + 1, k % 2 + 1, 1);
        if (t === 0 && n % 13 === 0) { pixels(c, '#9a8d65', [[xx + 5, yy + 9, 1, 3], [xx + 4, yy + 8, 3, 1]]); }
        if (t === 0 && n % 29 === 0) { pixels(c, '#a97367', [[xx + 9, yy + 6, 3, 2]]); pixels(c, '#d3b28b', [[xx + 10, yy + 8, 1, 2]]); }
      }
    }
    this.ground.set(map.id, canvas); return canvas;
  }
  draw(state, runtime, time, title = false) {
    const c = this.ctx, map = MAPS[state.scene], p = palette[map.biome];
    const targetX = Math.max(0, Math.min(map.w * 16 - 640, state.x - 320)), targetY = Math.max(0, Math.min(map.h * 16 - 360, state.y - 196));
    if (this.scene !== state.scene) { this.camera.x = targetX; this.camera.y = targetY; this.scene = state.scene; }
    this.camera.x += (targetX - this.camera.x) * .13; this.camera.y += (targetY - this.camera.y) * .13;
    const cx = Math.round(this.camera.x), cy = Math.round(this.camera.y);
    c.fillStyle = '#14252b'; c.fillRect(0, 0, 640, 360);
    c.drawImage(this.ground.get(map.id) || this.makeGround(map), -cx, -cy);
    const minX = Math.max(0, Math.floor(cx / 16) - 2), maxX = Math.min(map.w, Math.ceil((cx + 640) / 16) + 2), minY = Math.max(0, Math.floor(cy / 16) - 3), maxY = Math.min(map.h, Math.ceil((cy + 360) / 16) + 3);
    for (let y = minY; y < maxY; y++) for (let x = minX; x < maxX; x++) {
      const t = tileAt(state, x, y), n = noise(x, y), xx = x * 16 - cx, yy = y * 16 - cy;
      if (t === 2 || t === 4) {
        c.fillStyle = t === 4 ? '#172f3a' : '#264d56'; c.fillRect(xx, yy, 16, 16);
        c.fillStyle = '#48747a'; const drift = Math.floor(time * 3 + n % 8) % 12;
        c.fillRect(xx + drift, yy + (n % 8) + 3, 5, 1); c.fillStyle = '#345f68'; c.fillRect(xx + (drift + 7) % 12, yy + 12, 3, 1);
        if (t === 4) { pixels(c, '#132833', [[xx, yy + 2, 16, 3]]); if (n % 2) star(c, xx + 8, yy + 7 + Math.round(Math.sin(time * 2)), '#80aca3', 1); }
      }
      if (state.scene === 'river' && state.flags.bridge && map.tiles[y][x] === 4) { c.fillStyle = '#927c56'; c.fillRect(xx, yy, 16, 16); pixels(c, '#443e32', [[xx, yy, 1, 16], [xx + 8, yy, 1, 16]]); }
      if (state.scene === 'woods' && state.flags.secret && x >= 11 && x <= 13 && y >= 10 && y <= 12) { c.fillStyle = '#344d44'; c.fillRect(xx, yy, 16, 16); pixels(c, '#647b64', [[xx + 2, yy + 10, 12, 2]]); }
      if (t === 5 && state.scene === 'river' && x >= 17 && x <= 31 && y >= 20 && y <= 22) { c.fillStyle = '#8c7955'; c.fillRect(xx, yy, 16, 16); pixels(c, '#c0a479', [[xx + 1, yy, 2, 16]]); pixels(c, '#554a38', [[xx, yy, 16, 1], [xx + 7, yy, 1, 16]]); }
    }
    // Shadows and leaf clusters are rooted in the same solid terrain used by collision.
    const objects = [];
    for (let y = minY; y < maxY; y++) for (let x = minX; x < maxX; x++) {
      if (tileAt(state, x, y) !== 3 || state.scene === 'village' && x >= 12 && x <= 20 && y >= 16 && y <= 21) continue;
      objects.push({ kind: state.scene === 'belfry' ? 'rock' : 'tree', x: x * 16 + 8, y: y * 16 + 16, seed: noise(x, y) });
    }
    objects.push(...entitiesFor(state).filter(e => e.kind !== 'exit' && !(e.hiddenWhen && state.flags[e.hiddenWhen] && e.kind !== 'chest')));
    if (state.scene === 'belfry') objects.push({kind:'stairs',x:22*16,y:29*16});
    if (runtime.dashTime > 0) {
      for (let i = 3; i >= 1; i--) { c.globalAlpha = (4 - i) * .08; drawCharacter(c, 'player', state.x - cx - runtime.dashX * i * 9, state.y - cy - runtime.dashY * i * 9, time, true, state.facing); }
      c.globalAlpha = 1;
    }
    objects.push({ kind: 'player', x: state.x, y: state.y }); objects.sort((a, b) => a.y - b.y);
    for (const o of objects) {
      const x = Math.round(o.x - cx), y = Math.round(o.y - cy); if (x < -100 || x > 740 || y < -80 || y > 470) continue;
      if (o.kind === 'tree') this.tree(c, x, y, p.tree, o.seed);
      else if (o.kind === 'rock') this.rock(c, x, y, o.seed);
      else if (o.kind === 'player') { pixels(c, '#142a2a66', [[x - 6, y - 1, 13, 4]]); drawCharacter(c, 'player', x, y, time, runtime.moving, state.facing, 1, state.flags.lantern && state.light); }
      else this.object(c, o, x, y, state, time);
    }
    this.lighting(state, time, cx, cy);
    // Quiet living details: spores, moths, drifting pollen, and distant birds.
    for (let i = 0; i < (state.scene === 'woods' ? 36 : 20); i++) {
      const x = (noise(i, 3) % (map.w * 16) + Math.sin(time * .25 + i) * 13) - cx;
      const y = (noise(i, 7) % (map.h * 16) + Math.cos(time * .4 + i) * 8) - cy;
      if (x >= 0 && x < 640 && y >= 0 && y < 360) { c.globalAlpha = .3 + Math.sin(time * 1.4 + i) * .2; star(c, Math.floor(x), Math.floor(y), '#e6daa0', i % 3 ? 0 : 1); }
    }
    c.globalAlpha = 1;
    if (title) { c.fillStyle = '#09121c55'; c.fillRect(0, 0, 640, 360); }
  }
  tree(c, x, y, colors, seed) {
    pixels(c, '#192e2e66', [[x - 12, y - 1, 28, 5]]);
    pixels(c, '#463e32', [[x - 3, y - 18, 6, 20], [x - 5, y - 1, 11, 3]]);
    pixels(c, '#6b5740', [[x - 2, y - 14, 2, 15]]);
    x += seed % 5 - 2; y -= seed % 3 * 2;
    pixels(c, colors[0], [[x - 15, y - 27, 30, 15], [x - 10, y - 36, 20, 26], [x - 19, y - 22, 38, 9]]);
    pixels(c, colors[1], [[x - 13, y - 29, 25, 14], [x - 8, y - 35, 17, 16], [x - 17, y - 22, 33, 7]]);
    pixels(c, colors[2], [[x - 9, y - 32, 15, 9], [x - 14, y - 25, 11, 6], [x + 3, y - 24, 10, 5]]);
    pixels(c, colors[3], [[x - 6, y - 32, 7, 2], [x - 12, y - 23, 3, 1], [x + 7, y - 22, 3, 1]]);
    if (seed % 9 === 0) pixels(c, '#b49365', [[x - 8, y - 26, 2, 2], [x + 5, y - 17, 2, 1]]);
  }
  rock(c, x, y, n) {
    pixels(c, '#172b35', [[x - 9, y - 24, 19, 26]]); pixels(c, '#293e45', [[x - 7, y - 23, 15, 23]]); pixels(c, '#3b5155', [[x - 6, y - 23, 12, 3], [x - 7, y - 17, 2, 15]]);
    if (n % 3) pixels(c, '#6e8a7b', [[x - 4, y - 16, 2, 6], [x + 2, y - 6, 3, 2]]);
  }
  object(c, o, x, y, s, t) {
    if (o.kind === 'stairs') { pixels(c,'#112730',[[x-17,y-20,35,26]]); for(let i=0;i<6;i++)pixels(c,'#6a8072',[[x-13,y-16+i*4,27,2]]); pixels(c,'#a8b397',[[x-19,y-19,3,26],[x+17,y-19,3,26]]); return; }
    if (o.kind === 'npc') { pixels(c, '#12292a66', [[x - 7, y - 1, 15, 4]]); drawCharacter(c, o.sprite, x, y + Math.round(Math.sin(t * 1.5 + x) * (o.id === 'nim' ? 2 : .4)), t); return; }
    if (o.kind === 'house') {
      pixels(c, '#13272766', [[x - 77, y - 2, 158, 9]]);
      pixels(c, '#343f37', [[x - 71, y - 62, 144, 63]]); pixels(c, '#839079', [[x - 68, y - 59, 138, 57]]);
      for (let i = 0; i < 6; i++) pixels(c, '#65715f', [[x - 67, y - 56 + i * 9, 134, 1]]);
      pixels(c, '#465c56', [[x - 82, y - 67, 164, 10], [x - 73, y - 78, 146, 12], [x - 61, y - 89, 122, 12], [x - 45, y - 98, 90, 12], [x - 24, y - 106, 48, 10]]);
      for (let i = 0; i < 5; i++) pixels(c, '#6a8170', [[x - 74 + i * 10, y - 70 - i * 7, 144 - i * 20, 2]]);
      pixels(c, '#263c3c', [[x - 12, y - 36, 25, 38], [x - 52, y - 42, 23, 23], [x + 31, y - 42, 23, 23]]);
      pixels(c, '#d5ae6c', [[x - 49, y - 39, 17, 16], [x + 34, y - 39, 17, 16]]); pixels(c, '#65735c', [[x - 42, y - 42, 2, 23], [x - 52, y - 31, 23, 2], [x + 41, y - 42, 2, 23], [x + 31, y - 31, 23, 2]]);
      pixels(c, '#9a7950', [[x - 9, y - 32, 18, 33]]); pixels(c, '#d7b66b', [[x + 5, y - 16, 2, 2]]); pixels(c, '#a49670', [[x - 16, y, 32, 4]]);
      pixels(c, '#4a6754', [[x + 56, y - 10, 9, 11], [x + 54, y - 13, 13, 3]]); return;
    }
    if (o.kind === 'well') { pixels(c, '#253e3b', [[x - 16, y - 9, 33, 13]]); pixels(c, '#7f8e7d', [[x - 18, y - 13, 36, 5], [x - 16, y - 3, 33, 7], [x - 18, y - 10, 5, 12], [x + 13, y - 10, 5, 12]]); pixels(c, '#375961', [[x - 11, y - 9, 23, 6]]); pixels(c, '#a9b097', [[x - 14, y - 13, 9, 2], [x + 5, y - 13, 9, 2]]); }
    if (o.kind === 'sign') { pixels(c, '#3d3b31', [[x - 2, y - 9, 4, 11]]); pixels(c, '#a08b60', [[x - 12, y - 20, 25, 12]]); pixels(c, '#d0ba83', [[x - 10, y - 18, 20, 1]]); pixels(c, '#5c5b43', [[x - 8, y - 15, 16, 1], [x - 5, y - 12, 10, 1]]); }
    if (o.kind === 'camp') { pixels(c, '#343b34', [[x - 11, y - 1, 23, 5]]); pixels(c, '#77654a', [[x - 9, y - 2, 19, 2], [x - 7, y - 5, 15, 3]]); pixels(c, '#d58150', [[x - 5, y - 11, 10, 8], [x - 2, y - 17 + Math.round(Math.sin(t * 8)), 5, 11]]); pixels(c, '#f5cd7e', [[x - 2, y - 9, 4, 6]]); }
    if (o.kind === 'cat') { const blink = Math.sin(t * .7) > .99; pixels(c, '#c4b18c', [[x - 8, y - 10, 17, 10], [x - 8, y - 14, 4, 8], [x + 4, y - 14, 4, 8], [x + 7, y - 4, 8, 3]]); pixels(c, '#495446', [[x - 4, y - 7, 2, blink ? 1 : 2], [x + 3, y - 7, 2, blink ? 1 : 2], [x, y - 3, 2, 1]]); }
    if (o.kind === 'chest') { const open = s.flags.clapper; pixels(c, '#3a382e', [[x - 12, y - 13, 25, 16]]); pixels(c, '#977447', [[x - 10, y - 12, 21, 13]]); pixels(c, '#ccac69', [[x - 8, y - 13, 3, 14], [x + 6, y - 13, 3, 14], [x - 11, y - 7, 23, 2]]); if (open) pixels(c, '#263b39', [[x - 9, y - 12, 19, 6]]); else { pixels(c, '#f0d195', [[x - 1, y - 8, 4, 5]]); star(c, x + 13, y - 17 + Math.round(Math.sin(t * 2) * 2), '#e4ce8b', 1); } }
    if (o.kind === 'winch') { pixels(c, '#6d644a', [[x - 9, y - 3, 20, 5], [x - 6, y - 18, 4, 17], [x + 5, y - 18, 4, 17]]); pixels(c, '#bca879', [[x - 10, y - 17, 24, 4], [x + 11, y - 22, 3, 10]]); }
    if (o.kind === 'stone') { pixels(c, '#6c8073', [[x - 9, y - 13, 18, 15], [x - 6, y - 17, 12, 5]]); pixels(c, '#a2ad8d', [[x - 5, y - 12, 10, 1], [x - 3, y - 8, 6, 1]]); }
    if (o.kind === 'letter') { pixels(c, '#425e42', [[x - 8, y - 3, 17, 3], [x + 5, y - 17, 2, 18]]); pixels(c, '#d8cfac', [[x - 5, y - 13, 12, 9]]); pixels(c, '#a48b6d', [[x - 4, y - 12, 10, 1], [x, y - 9, 3, 2]]); }
    if (o.kind === 'flower') { pixels(c, '#8fa779', [[x, y - 10, 1, 12], [x - 4, y - 3, 5, 2]]); star(c, x, y - 13, '#e7d49a', 4); pixels(c, '#f7eecb', [[x - 1, y - 14, 3, 3]]); }
    if (o.kind === 'rootdoor') {
      if (s.flags.secret) { pixels(c, '#0d242b', [[x - 15, y - 31, 31, 34]]); for (let i = 0; i < 4; i++) pixels(c, '#6d846b', [[x - 12, y - 5 + i * 3, 25, 1]]); pixels(c, '#afc493', [[x - 18, y - 30, 3, 24], [x + 15, y - 30, 3, 24]]); }
      else { pixels(c, '#344639', [[x - 17, y - 29, 34, 31]]); pixels(c, '#74816a', [[x - 13, y - 29, 3, 27], [x + 6, y - 29, 4, 27], [x - 5, y - 20, 4, 22], [x - 15, y - 7, 33, 3]]); star(c, x + 5, y - 22, '#b7bea0', 1); }
    }
    if (o.kind === 'bell') { pixels(c, '#1a3038', [[x - 23, y - 50, 47, 56]]); pixels(c, '#526d68', [[x - 23, y - 49, 5, 53], [x + 19, y - 49, 5, 53], [x - 22, y - 51, 46, 6]]); pixels(c, '#ba9d68', [[x - 13, y - 43, 27, 29], [x - 19, y - 22, 39, 10], [x - 5, y - 48, 11, 8]]); pixels(c, '#e1c58a', [[x - 11, y - 41, 5, 24], [x - 17, y - 20, 35, 2]]); pixels(c, '#665c46', [[x - 14, y - 13, 28, 4]]); if (s.flags.bell) pixels(c, '#e4c778', [[x - 2, y - 19, 5, 15]]); }
  }
  lighting(s, t, cx, cy) {
    const c = this.shade.getContext('2d'); c.clearRect(0, 0, 640, 360); c.globalCompositeOperation = 'source-over';
    c.fillStyle = s.ending ? '#14243a20' : s.scene === 'belfry' ? '#071b2e9c' : s.scene === 'woods' ? '#0b1e2b7a' : '#14283830'; c.fillRect(0, 0, 640, 360);
    const glow = (x, y, radius, power) => { c.globalCompositeOperation = 'destination-out'; const g = c.createRadialGradient(x, y, 2, x, y, radius); g.addColorStop(0, `rgba(0,0,0,${power})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - radius, y - radius, radius * 2, radius * 2); };
    glow(s.x - cx, s.y - cy - 10, s.flags.lantern && s.light ? 120 + Math.sin(t * 3) * 2 : 54, s.flags.lantern && s.light ? .98 : .35);
    for (const e of entitiesFor(s)) if (e.kind === 'camp' || e.kind === 'house' || e.id === 'nim' || e.kind === 'bell') glow(e.x - cx, e.y - cy - 15, e.kind === 'house' ? 100 : 75, .8);
    this.ctx.drawImage(this.shade, 0, 0);
    this.ctx.save(); this.ctx.globalCompositeOperation = 'screen';
    for (const e of entitiesFor(s)) if (e.kind === 'camp' || e.id === 'nim') {
      const x = e.x - cx, y = e.y - cy - 10, g = this.ctx.createRadialGradient(x, y, 1, x, y, e.kind === 'camp' ? 60 : 45);
      g.addColorStop(0, e.kind === 'camp' ? '#ebaa4c24' : '#9de0c328'); g.addColorStop(1, '#00000000'); this.ctx.fillStyle = g; this.ctx.fillRect(x - 65, y - 65, 130, 130);
    }
    this.ctx.restore();
  }
}
