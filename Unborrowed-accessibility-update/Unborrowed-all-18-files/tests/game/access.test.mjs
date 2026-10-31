import test from 'node:test';
import assert from 'node:assert/strict';
import {accessibleTargets,visitAccessible} from '../../dist/game/access.js';
import {newGame,runtimeFor,enterScene,canOccupy,saveState,loadState} from '../../dist/game/world.js';
import {interaction,chooseStory} from '../../dist/game/story.js';

function finish(state,node) {
  if (node.travel) enterScene(state,runtimeFor(state),node.travel.scene,node.travel.spawn);
}
function visit(state,id) {
  const result=visitAccessible(state,id);assert.ok(!result.error,result.error);
  if(result.travel){enterScene(state,runtimeFor(state),result.travel.scene,result.travel.spawn);return;}
  assert.ok(canOccupy(state,state.x,state.y),'Switching to visual mode must leave the player on safe ground');
  return interaction(state,id);
}
test('text exploration preserves bridge and lantern gates',()=>{
  const s=newGame();visit(s,'river-exit');
  assert.match(visitAccessible(s,'clapper').error,/broken bridge/);
  assert.equal(s.flags.clapper,undefined);
  visit(s,'river-return');visit(s,'wood-exit');
  let n=visit(s,'rootdoor');assert.equal(n.travel,undefined);assert.equal(s.flags.secret,undefined);
  s.flags.lantern=true;s.light=true;n=visit(s,'rootdoor');assert.equal(s.flags.secret,true);assert.equal(n.travel,undefined);
});
for(const ending of ['song','quiet'])test(`text exploration reaches ${ending} ending through shared story choices`,()=>{
  const s=newGame();let n=visit(s,'brin');finish(s,chooseStory(s,n,'listen'));
  visit(s,'river-exit');n=visit(s,'tove');finish(s,chooseStory(s,n,'name'));
  finish(s,visit(s,'clapper'));finish(s,visit(s,'winch'));
  assert.ok(!accessibleTargets(s).some(e=>e.id==='clapper'));
  visit(s,'river-return');visit(s,'wood-exit');finish(s,visit(s,'rootdoor'));
  assert.equal(s.scene,'belfry');n=visit(s,'nim');finish(s,chooseStory(s,n,'free'));
  n=visit(s,'bell');n=chooseStory(s,n,ending);assert.equal(n.ending,true);assert.equal(s.ending,ending);
  visit(s,'belfry-return');visit(s,'wood-return');
  assert.ok(accessibleTargets(s).some(e=>e.id==='nim'));
  assert.deepEqual(loadState(saveState(s)).relationships,s.relationships);
});
