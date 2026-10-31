import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MAPS,TILE,newGame,runtimeFor,stepWorld,canOccupy,tileAt,saveState,loadState,enterScene,nearestEntity,entitiesFor} from '../../dist/game/world.js';
import {interaction,chooseStory} from '../../dist/game/story.js';
import {ArchiveLedger} from '../../dist/game/ledger.js';

test('new courier starts in traversable terrain with a reachable sign',()=>{
 const s=newGame();assert.ok(canOccupy(s,s.x,s.y));assert.equal(s.scene,'village');
 s.x=25*TILE;s.y=29.4*TILE;assert.equal(nearestEntity(s).id,'sign');
});
test('movement is real-time, diagonal speed is normalized, and solid trees stop movement',()=>{
 const a=newGame(),b=newGame();stepWorld(a,runtimeFor(a),{x:1,y:0},.04);stepWorld(b,runtimeFor(b),{x:1,y:1},.04);
 assert.ok(Math.abs(Math.hypot(a.x-400,a.y-496)-Math.hypot(b.x-400,b.y-496))<.001);
 a.x=4.5*TILE;a.y=5.5*TILE;const rt=runtimeFor(a);for(let i=0;i<80;i++)stepWorld(a,rt,{x:1,y:0},.04);
 assert.ok(a.x<5*TILE,'tree island must stop the courier');
});
test('short bridge gap blocks walking and can be crossed using an acquired dash',()=>{
 const s=newGame();s.scene='river';s.x=22.4*TILE;s.y=21.5*TILE;let r=runtimeFor(s);
 for(let i=0;i<15;i++)stepWorld(s,r,{x:1,y:0},.04);assert.ok(s.x<=23*TILE-4);
 s.flags.dash=true;let events=stepWorld(s,r,{x:1,y:0,dash:true},.04);assert.ok(events.includes('dash'));
 for(let i=0;i<8;i++)stepWorld(s,r,{x:0,y:0},.04);assert.ok(s.x>25*TILE+4);assert.ok(canOccupy(s,s.x,s.y));
});
test('dash range is consistent at different frame rates',()=>{
 const distances=[];
 for(const dt of [1/30,1/60,1/120]){const s=newGame();s.flags.dash=true;const r=runtimeFor(s);const start=s.x;stepWorld(s,r,{x:1,y:0,dash:true},dt);while(r.dashTime>0)stepWorld(s,r,{x:0,y:0},dt);distances.push(s.x-start);}
 assert.ok(distances.every(d=>Math.abs(d-65)<.001));
});
test('a mistimed dash returns safely, while repairing the bridge changes collision',()=>{
 const s=newGame();s.scene='river';s.flags.dash=true;s.x=21*TILE;s.y=21.5*TILE;const r=runtimeFor(s);
 let events=[];for(let i=0;i<9;i++)events.push(...stepWorld(s,r,{x:i?0:1,y:0,dash:i===0},.04));
 assert.ok(events.includes('fell'));assert.ok(canOccupy(s,s.x,s.y));
 assert.equal(tileAt(s,23,21),4);interaction(s,'winch');assert.equal(tileAt(s,23,21),5);assert.ok(canOccupy(s,24*TILE,21.5*TILE));
});
test('deep river remains impassable during a dash',()=>{
 const s=newGame();s.scene='river';s.x=19.5*TILE;s.y=15.5*TILE;s.flags.dash=true;const r=runtimeFor(s);
 for(let i=0;i<10;i++)stepWorld(s,r,{x:1,y:0,dash:i===0},.04);assert.ok(s.x<20*TILE);
});
test('light reveals a real hidden passage, and the missing tongue gates the belfry',()=>{
 const s=newGame();s.scene='woods';s.x=12.5*TILE;s.y=13*TILE;const r=runtimeFor(s);
 assert.ok(!s.flags.secret);stepWorld(s,r,{x:0,y:0},.04);assert.ok(!s.flags.secret);
 chooseStory(s,interaction(s,'brin'),'listen');stepWorld(s,r,{x:0,y:0},.04);assert.equal(s.flags.secret,true);assert.equal(tileAt(s,12,11),6);
 assert.equal(interaction(s,'rootdoor').travel,undefined);interaction(s,'clapper');assert.equal(interaction(s,'rootdoor').travel.scene,'belfry');
});
test('both complete story endings are reachable and remember character choices',()=>{
 for(const ending of ['song','quiet']){
  const s=newGame();chooseStory(s,interaction(s,'brin'),'listen');chooseStory(s,interaction(s,'tove'),'name');interaction(s,'clapper');
  s.scene='woods';s.flags.secret=true;const door=interaction(s,'rootdoor');const r=runtimeFor(s);enterScene(s,r,door.travel.scene,door.travel.spawn);
  assert.equal(s.scene,'belfry');chooseStory(s,interaction(s,'nim'),'free');const final=chooseStory(s,interaction(s,'bell'),ending);
  assert.equal(s.ending,ending);assert.equal(final.ending,true);assert.equal(s.relationships.brin,1);assert.equal(s.relationships.tove,1);assert.equal(s.relationships.nim,2);
  assert.ok(interaction(s,'brin').lines.length>1);assert.ok(interaction(s,'tove').lines[0].includes('friend'));assert.equal(loadState(saveState(s)).ending,ending);
 }
});
test('discovered rooms, ability flags, relationships and position survive serialization',()=>{
 const s=newGame();s.flags.lantern=true;s.flags.dash=true;s.flags.flower=true;s.relationships.brin=3;const r=runtimeFor(s);enterScene(s,r,'river',[5,25]);
 const restored=loadState(saveState(s));assert.equal(restored.scene,'river');assert.equal(restored.x,80);assert.equal(restored.flags.flower,true);assert.deepEqual(restored.discovered,['village','river']);assert.equal(restored.relationships.brin,3);
 assert.equal(loadState('{bad'),null);assert.equal(loadState('{"version":99}'),null);
});
test('unsafe or corrupt save positions recover to a playable location',()=>{
 const s=newGame();s.x=1e10;s.y=-300;const restored=loadState(saveState(s));assert.equal(restored.scene,'village');assert.ok(canOccupy(restored,restored.x,restored.y));
});
test('the ending changes who lives in the village, including after a reload',()=>{
 const s=newGame();s.ending='quiet';const r=runtimeFor(s);enterScene(s,r,'village',[29,24]);
 assert.ok(entitiesFor(s).some(e=>e.id==='nim'));
 const loaded=loadState(saveState(s));assert.ok(entitiesFor(loaded).some(e=>e.id==='nim'));
 loaded.scene='belfry';assert.ok(!entitiesFor(loaded).some(e=>e.id==='nim'));
});
test('a secret flower can change Brin’s relationship and that choice persists',()=>{
 const s=newGame();chooseStory(s,interaction(s,'brin'),'practical');assert.equal(s.relationships.brin,0);
 interaction(s,'flower');interaction(s,'letter');const response=chooseStory(s,interaction(s,'brin'),'give-flower');
 assert.ok(response.lines.some(line=>line.includes('noticing')));assert.equal(s.relationships.brin,2);
 const loaded=loadState(saveState(s));assert.equal(loaded.flags.flowerGiven,true);assert.equal(loaded.flags.letter,true);assert.equal(loaded.relationships.brin,2);
});
test('optional archive actually changes records and produces reviewed and excluded exports',()=>{
 const l=new ArchiveLedger('Date,Description,Amount,Currency\n2026-01-01,Cafe,-10,USD\n2026-01-01,Cafe,-10,USD\n2026-01-02,Metro,-20,USD','test.csv');
 l.categorize('Food & drink');l.categorize('Transport');l.duplicate('exclude');assert.equal(l.complete,true);assert.equal(l.records[1].duplicateDecision,'exclude');
 l.undo();assert.equal(l.complete,false);l.duplicate('keep');assert.equal(l.complete,true);assert.ok(l.export().includes('Food & drink'));assert.ok(l.export().includes('mosswake_reviewed'));assert.ok(l.exportLog().includes('undo'));
});

// Reachability is checked against the same solid terrain and prop collision as play.
function reachable(state,start,target,radius=27){
 const queue=[start],seen=new Set([start.join(',')]);
 while(queue.length){const [x,y]=queue.shift();if(Math.hypot(x*TILE+8-target[0],y*TILE+8-target[1])<radius)return true;
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;if(!seen.has(k)&&canOccupy(state,nx*TILE+8,ny*TILE+8)){seen.add(k);queue.push([nx,ny]);}}
 }return false;
}
test('critical NPCs, chest, hidden entrance, and optional flower have walkable approaches',()=>{
 const s=newGame();assert.ok(reachable(s,[25,31],[28.5*TILE,21.5*TILE]));assert.ok(reachable(s,[25,31],[16.5*TILE,22.5*TILE]));
 s.scene='river';assert.ok(reachable(s,[4,24],[17.2*TILE,24.7*TILE]));s.flags.bridge=true;assert.ok(reachable(s,[4,24],[42*TILE,16.5*TILE]));
 s.scene='woods';assert.ok(reachable(s,[28,34],[12.5*TILE,11.6*TILE]));assert.ok(reachable(s,[28,34],[43*TILE,18.5*TILE]));
 s.scene='belfry';assert.ok(reachable(s,[22,27],[22*TILE,14.5*TILE]));assert.ok(reachable(s,[22,27],[22*TILE,10*TILE],42));
});
