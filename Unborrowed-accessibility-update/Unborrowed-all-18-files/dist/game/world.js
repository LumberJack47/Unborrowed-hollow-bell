export const TILE = 16;
export const TERRAIN = { GRASS: 0, PATH: 1, WATER: 2, WALL: 3, GAP: 4, STONE: 5, MOSS: 6 };

function makeMap(id, name, subtitle, w, h, biome) {
  return { id, name, subtitle, w, h, biome, tiles: Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => x < 2 || y < 2 || x >= w - 2 || y >= h - 2 ? 3 : 0)), entities: [] };
}
function rect(map, x, y, w, h, value) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (map.tiles[j]?.[i] !== undefined) map.tiles[j][i] = value; }
function path(map, points, width = 3, tile = 1) {
  for (let n = 1; n < points.length; n++) {
    const [ax, ay] = points[n - 1], [bx, by] = points[n], steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let i = 0; i <= steps; i++) rect(map, Math.round(ax + (bx - ax) * i / Math.max(steps, 1)) - Math.floor(width / 2), Math.round(ay + (by - ay) * i / Math.max(steps, 1)) - Math.floor(width / 2), width, width, tile);
  }
}
const entity = (id, kind, x, y, extra = {}) => ({ id, kind, x: x * TILE, y: y * TILE, ...extra });

export function buildMaps() {
  const village = makeMap('village', 'Mosswake', 'A village between the rain and the roots', 60, 40, 'village');
  path(village, [[25, 34], [25, 25], [29, 21], [29, 3]], 4);
  path(village, [[29, 25], [58, 25]], 4);
  path(village, [[25, 25], [16, 25], [16, 22]], 3);
  rect(village, 26, 18, 9, 7, 5);
  rect(village, 12, 16, 9, 6, 3);
  rect(village, 40, 7, 12, 8, 2);
  rect(village, 8, 29, 7, 5, 2);
  // Tree islands are visible, solid terrain rather than invisible map boundaries.
  for (const [x, y, w, h] of [[5, 5, 11, 7], [36, 29, 9, 7], [44, 16, 6, 4], [5, 20, 4, 5], [37, 3, 2, 5]]) rect(village, x, y, w, h, 3);
  village.entities = [
    entity('brin', 'npc', 28.5, 21.5, { name: 'Brin', sprite: 'brin' }),
    entity('orrin', 'house', 16.5, 22.5, { name: 'Orrin’s archive', sprite: 'house' }),
    entity('well', 'well', 32, 20, { name: 'The silent well' }),
    entity('sign', 'sign', 25, 28, { name: 'A rain-soft sign' }),
    entity('camp', 'camp', 23, 32, { name: 'Your little camp' }),
    entity('cat', 'cat', 34, 24, { name: 'A very important cat' }),
    entity('wood-exit', 'exit', 29.5, 2.6, { to: 'woods', spawn: [28.5, 34], name: 'The Listening Wood' }),
    entity('river-exit', 'exit', 58, 25.5, { to: 'river', spawn: [4.5, 24.5], name: 'Glasswater' }),
  ];
  rect(village, 27, 0, 5, 4, 1); rect(village, 56, 23, 4, 5, 1);

  const woods = makeMap('woods', 'The Listening Wood', 'Some paths only open for a small light', 52, 38, 'woods');
  for (const [x, y, w, h] of [[5, 3, 16, 6], [32, 4, 15, 10], [4, 17, 9, 15], [36, 20, 12, 13], [19, 20, 5, 6], [16, 11, 5, 4]]) rect(woods, x, y, w, h, 3);
  path(woods, [[28, 36], [28, 28], [31, 22], [28, 16], [24, 12], [12, 12]], 3);
  path(woods, [[31, 22], [36, 17], [43, 17]], 2, 6);
  rect(woods, 40, 16, 6, 4, 2); rect(woods, 42, 18, 2, 2, 6);
  rect(woods, 39, 17, 5, 1, 5);
  rect(woods, 9, 9, 6, 3, 3);
  woods.entities = [
    entity('rootdoor', 'rootdoor', 12.5, 11.6, { name: 'A seam in the roots' }),
    entity('mothstone', 'stone', 25, 18, { name: 'A stone covered in moths' }),
    entity('flower', 'flower', 43, 18.5, { name: 'A starflower', hiddenWhen: 'flower' }),
    entity('letter', 'letter', 34, 16, { name: 'A letter caught in a branch' }),
    entity('wood-return', 'exit', 28.5, 36, { to: 'village', spawn: [29.5, 5], name: 'Mosswake' }),
  ];
  rect(woods, 26, 34, 5, 4, 1);

  const river = makeMap('river', 'Glasswater', 'The river remembers every crossing', 52, 36, 'river');
  rect(river, 20, 0, 8, 36, 2);
  for (const [x, y, w, h] of [[4, 3, 11, 8], [35, 4, 13, 7], [37, 26, 10, 7], [5, 29, 10, 4], [11, 15, 4, 4]]) rect(river, x, y, w, h, 3);
  path(river, [[2, 25], [8, 25], [17, 24], [17, 21]], 3);
  path(river, [[30, 21], [36, 21], [38, 16], [43, 16]], 3);
  rect(river, 17, 20, 15, 3, 5); rect(river, 23, 20, 2, 3, 4);
  river.entities = [
    entity('tove', 'npc', 17.2, 24.7, { name: 'Tove', sprite: 'tove' }),
    entity('clapper', 'chest', 42, 16.5, { name: 'A brass-bound chest', hiddenWhen: 'clapper' }),
    entity('winch', 'winch', 30.5, 22.5, { name: 'A bridge winch' }),
    entity('riverstone', 'stone', 10, 23, { name: 'A river-worn stone' }),
    entity('river-return', 'exit', 2.6, 25.5, { to: 'village', spawn: [55, 25.5], name: 'Mosswake' }),
  ];
  rect(river, 0, 23, 5, 5, 1);

  const belfry = makeMap('belfry', 'The Buried Belfry', 'A voice can be a home. Or a cage.', 44, 34, 'belfry');
  rect(belfry, 0, 0, 44, 34, 3); rect(belfry, 7, 5, 30, 25, 5);
  rect(belfry, 11, 9, 3, 4, 3); rect(belfry, 30, 9, 3, 4, 3); rect(belfry, 11, 21, 3, 4, 3); rect(belfry, 30, 21, 3, 4, 3);
  rect(belfry, 19, 3, 6, 5, 5);
  for (const [x, y] of [[8, 8], [35, 8], [8, 26], [35, 26]]) rect(belfry, x, y, 1, 1, 2);
  belfry.entities = [
    entity('nim', 'npc', 22, 14.5, { name: 'Nim', sprite: 'nim' }),
    entity('bell', 'bell', 22, 10, { name: 'The hollow bell' }),
    entity('inscription', 'stone', 17, 24, { name: 'An unfinished inscription' }),
    entity('belfry-return', 'exit', 22, 29, { to: 'woods', spawn: [12.5, 14], name: 'The Listening Wood' }),
  ];
  return { village, woods, river, belfry };
}

export const MAPS = buildMaps();
export function entitiesFor(state) {
  const entities = MAPS[state.scene].entities;
  if (!state.ending || !state.flags.homecoming) return entities;
  if (state.scene === 'belfry') return entities.filter(e => e.id !== 'nim');
  if (state.scene === 'village') return [...entities, entity('nim','npc',34.5,21.5,{name:'Nim',sprite:'nim'})];
  return entities;
}
export function newGame() {
  return { version: 2, scene: 'village', x: 25 * TILE, y: 31 * TILE, facing: 'up', light: false, flags: {}, relationships: { brin: 0, tove: 0, nim: 0 }, discovered: ['village'], ending: null, playTime: 0 };
}
export function tileAt(state, tx, ty) {
  const map = MAPS[state.scene];
  if (state.scene === 'river' && state.flags.bridge && tx >= 23 && tx <= 24 && ty >= 20 && ty <= 22) return 5;
  if (state.scene === 'woods' && state.flags.secret && tx >= 11 && tx <= 13 && ty >= 10 && ty <= 12) return 6;
  return map?.tiles[ty]?.[tx] ?? 3;
}
export function canOccupy(state, x, y, dashing = false) {
  const r = 4;
  for (const [px, py] of [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]]) {
    const t = tileAt(state, Math.floor(px / TILE), Math.floor(py / TILE));
    if (t === 2 || t === 3 || (t === 4 && !dashing)) return false;
  }
  for (const e of entitiesFor(state)) {
    const radius = { npc: 6, well: 10, bell: 13, chest: 8, camp: 7, sign: 3, stone: 5, winch: 5 }[e.kind];
    if (radius && Math.hypot(e.x - x, e.y - y) < radius + 3) return false;
  }
  return true;
}
export function runtimeFor(state) { return { dashTime: 0, cooldown: 0, dashX: 0, dashY: -1, safeX: state.x, safeY: state.y, transition: 0, moving: false, footsteps: 0 }; }
export function movePlayer(state, runtime, dx, dy, distance, dashing = false) {
  const count = Math.max(1, Math.ceil(distance / 2));
  let moved = false;
  for (let i = 0; i < count; i++) {
    const sx = dx * distance / count, sy = dy * distance / count;
    if (canOccupy(state, state.x + sx, state.y, dashing)) { state.x += sx; moved ||= Boolean(sx); }
    if (canOccupy(state, state.x, state.y + sy, dashing)) { state.y += sy; moved ||= Boolean(sy); }
  }
  return moved;
}
export function stepWorld(state, runtime, input, dt) {
  const events = []; dt = Math.min(Math.max(dt, 0), .04);
  runtime.cooldown = Math.max(0, runtime.cooldown - dt); runtime.transition = Math.max(0, runtime.transition - dt);
  let dx = input.x || 0, dy = input.y || 0;
  if (dx || dy) { const length = Math.hypot(dx, dy); dx /= length; dy /= length; state.facing = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up'; }
  if (input.dash && state.flags.dash && runtime.cooldown <= 0) {
    const face = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[state.facing];
    runtime.dashX = dx || dy ? dx : face[0]; runtime.dashY = dx || dy ? dy : face[1]; runtime.dashTime = .25; runtime.cooldown = .85; events.push('dash');
  }
  const dashing = runtime.dashTime > 0;
  if (dashing) { dx = runtime.dashX; dy = runtime.dashY; }
  const movementTime = dashing ? Math.min(dt, runtime.dashTime) : dt;
  runtime.moving = movePlayer(state, runtime, dx, dy, movementTime * (dashing ? 260 : 82), dashing);
  runtime.dashTime = Math.max(0, runtime.dashTime - dt);
  if (!runtime.dashTime && !canOccupy(state, state.x, state.y)) {
    state.x = runtime.safeX; state.y = runtime.safeY; events.push('fell');
  }
  if (!runtime.dashTime && canOccupy(state, state.x, state.y)) { runtime.safeX = state.x; runtime.safeY = state.y; }
  if (runtime.moving) runtime.footsteps += dt;
  state.playTime += dt;
  if (state.scene === 'woods' && state.flags.lantern && state.light && Math.hypot(state.x - 12.5 * TILE, state.y - 12 * TILE) < 65 && !state.flags.secret) {
    state.flags.secret = true; events.push('secret');
  }
  if (!runtime.transition) {
    const exit = MAPS[state.scene].entities.find(e => e.kind === 'exit' && Math.hypot(state.x - e.x, state.y - e.y) < 12);
    if (exit) { enterScene(state, runtime, exit.to, exit.spawn); events.push('scene'); }
  }
  return events;
}
export function enterScene(state, runtime, scene, spawn) {
  state.scene = scene; state.x = spawn[0] * TILE; state.y = spawn[1] * TILE;
  if (!state.discovered.includes(scene)) state.discovered.push(scene);
  if (scene === 'village' && state.ending) state.flags.homecoming = true;
  runtime.safeX = state.x; runtime.safeY = state.y; runtime.dashTime = 0; runtime.transition = .9;
}
export function nearestEntity(state) {
  return entitiesFor(state).filter(e => e.kind !== 'exit' && !(e.hiddenWhen && state.flags[e.hiddenWhen]))
    .map(e => ({ ...e, distance: Math.hypot(e.x - state.x, e.y - state.y) }))
    .filter(e => e.distance < (e.kind === 'house' ? 34 : e.kind === 'bell' ? 42 : 30))
    .sort((a, b) => a.distance - b.distance)[0];
}
export function saveState(state) {
  const copy = structuredClone(state);
  // Only game discoveries and decisions persist; imported financial records never do.
  return JSON.stringify(copy);
}
export function loadState(text) {
  try {
    const s = JSON.parse(text);
    if (s.version !== 2 || !MAPS[s.scene] || !Number.isFinite(s.x) || !Number.isFinite(s.y) || !s.flags || !s.relationships || !Array.isArray(s.discovered)) return null;
    const blank = newGame();
    s.flags = Object.fromEntries(Object.entries(s.flags).filter(([k, v]) => /^[a-zA-Z]+$/.test(k) && typeof v === 'boolean'));
    s.relationships = { brin: Number(s.relationships.brin) || 0, tove: Number(s.relationships.tove) || 0, nim: Number(s.relationships.nim) || 0 };
    s.discovered = s.discovered.filter(id => MAPS[id]);
    s.facing = ['up', 'down', 'left', 'right'].includes(s.facing) ? s.facing : 'down';
    s.ending = ['song', 'quiet'].includes(s.ending) ? s.ending : null;
    s.playTime = Math.max(0, Number(s.playTime) || 0);
    const result = { ...blank, ...s };
    if (!canOccupy(result, result.x, result.y)) { result.scene = 'village'; result.x = blank.x; result.y = blank.y; }
    return result;
  } catch { return null; }
}
