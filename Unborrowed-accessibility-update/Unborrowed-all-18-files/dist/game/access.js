import {entitiesFor,canOccupy} from './world.js';

// A turn-based equivalent of exploration, using the same story state and gates.
// It deliberately removes precision movement, not story requirements.
export function accessibleTargets(state) {
  return entitiesFor(state).filter(entity => !(entity.hiddenWhen && state.flags[entity.hiddenWhen]))
    .map(entity => ({...entity, locked: state.scene === 'river' && ['clapper','winch'].includes(entity.id) && !state.flags.dash && !state.flags.bridge,
      label: entity.kind === 'exit' ? `Travel to ${entity.name}` : `Visit ${entity.name}`}));
}

export function visitAccessible(state, id) {
  const target = accessibleTargets(state).find(entity => entity.id === id);
  if (!target) return {error:'That discovery is no longer here.'};
  if (target.locked) return {error:'The broken bridge blocks the far bank. Speak to Tove to acquire the wind ribbon first.'};
  if (target.kind === 'exit') return {travel:{scene:target.to,spawn:target.spawn}};
  // Find an actual safe position beside the entity so switching modes preserves playability.
  let position;
  for (let radius = 16; radius <= 48 && !position; radius += 4) {
    for (let angle = 0; angle < 16; angle++) {
      const x = target.x + Math.cos(angle*Math.PI/8)*radius;
      const y = target.y + Math.sin(angle*Math.PI/8)*radius;
      if (canOccupy(state,x,y)) { position = {x,y}; break; }
    }
  }
  if (!position) return {error:'There is no safe approach here.'};
  Object.assign(state,position);
  if (id === 'rootdoor' && state.flags.lantern && state.light) state.flags.secret = true;
  return {entity:target};
}
