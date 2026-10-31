import {MAPS,TILE,newGame,runtimeFor,stepWorld,nearestEntity,enterScene,saveState,loadState} from './world.js';
import {interaction,chooseStory} from './story.js';
import {Renderer,portrait} from './render.js';
import {Soundscape} from './audio.js';
import {ArchiveLedger} from './ledger.js';
import {CATEGORIES} from '../engine.js';

const $ = selector => document.querySelector(selector);
const esc = text => String(text ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SAVE_KEY = 'mosswake.story.v2';
const renderer = new Renderer($('#world')), audio = new Soundscape(), keys = new Set();
let state = newGame(), runtime = runtimeFor(state), cached = null, running = false, dialogue = null, ledger = null;
let toastTimeout, areaTimeout, savedTimeout, lastTime = performance.now(), lastSave = 0, lastStatus = 0, requestDash = false;
let hasStorage = true;
try { cached = loadState(localStorage.getItem(SAVE_KEY)); } catch { hasStorage = false; }
if (cached) $('#continue-game').hidden = false;

function persist(quiet = false) {
  if (!running) return;
  const safe = { ...state, x: runtime.dashTime ? runtime.safeX : state.x, y: runtime.dashTime ? runtime.safeY : state.y };
  cached = structuredClone(safe);
  try {
    localStorage.setItem(SAVE_KEY, saveState(safe)); hasStorage = true;
    if (!quiet) { $('#save-indicator').textContent = '◇ Story remembered'; $('#save-indicator').classList.add('visible'); clearTimeout(savedTimeout); savedTimeout = setTimeout(()=>$('#save-indicator').classList.remove('visible'),1500); }
  } catch { hasStorage = false; if (!quiet) toast('This browser cannot keep a save. Pause → Save a copy of your story.'); }
}
function toast(text) { $('#toast').textContent = text; $('#toast').classList.add('visible'); clearTimeout(toastTimeout); toastTimeout = setTimeout(()=>$('#toast').classList.remove('visible'),3300); }
function updateHud() {
  const map = MAPS[state.scene]; $('#place-name').textContent = map.name; $('#place-subtitle').textContent = map.subtitle;
  $('#lantern-button').hidden = !state.flags.lantern; $('#lantern-button').classList.toggle('lit', Boolean(state.light));
  $('#lantern-button').setAttribute('aria-pressed', String(Boolean(state.light)));
  audio.scene = state.scene; audio.ending = state.ending;
}
function areaBanner() {
  updateHud(); const banner = $('#area-banner'); banner.querySelector('span').textContent = MAPS[state.scene].name;
  banner.classList.add('visible'); clearTimeout(areaTimeout); areaTimeout = setTimeout(()=>banner.classList.remove('visible'),2600);
}
function fadeScene(scene, spawn) {
  keys.clear(); $('#fade').classList.add('active');
  setTimeout(()=>{ enterScene(state,runtime,scene,spawn); renderer.scene = null; areaBanner(); persist(); $('#fade').classList.remove('active'); },220);
}
function begin(continueSaved = false) {
  state = continueSaved && cached ? structuredClone(cached) : newGame(); runtime = runtimeFor(state); running = true;
  if (!continueSaved) ledger = null;
  $('#title-screen').hidden = true; $('#ending-screen').hidden = true; $('#hud').hidden = false;
  $('#touch-controls').style.visibility = 'visible'; $('#world').focus({preventScroll:true}); keys.clear(); updateHud(); areaBanner();
  if (!state.flags.intro) {
    state.flags.intro = true;
    openDialogue({ speaker:'An unaddressed letter',portrait:'letter',lines:['The road ends at a village that has forgotten the sound of morning.','Your letter says: “To whoever still listens.”','By the silent well, a keeper named Brin is watching the roots.'],choices:[] });
  }
  persist();
}
function confirmNewGame() {
  if (!cached) { begin(false); return; }
  openDialogue({speaker:'A new beginning',portrait:'letter',lines:[`Begin another story? Your current local story will be replaced. You can save a copy from the pause menu first.${ledger ? ' The ledger on Orrin’s desk will also be cleared.' : ''}`],choices:[
    {id:'new',label:'Begin a new story.',effect:()=>{closeDialogue();begin(false);}},
    {id:'cancel',label:'Keep this story.',effect:()=>closeDialogue()},
  ]});
}

function openDialogue(node) {
  keys.clear(); runtime.moving = false; $('#interaction-prompt').hidden = true;
  dialogue = { node, line:0, characters:0, choice:0, ready:false };
  $('#dialogue').hidden = false; $('#dialogue-portrait').src = portrait(node.portrait || 'player'); $('#dialogue-portrait').alt = `${node.speaker} portrait`;
  $('#speaker').textContent = node.speaker; $('#dialogue-choices').replaceChildren(); $('#advance-dialogue').hidden = false;
  $('#dialogue-accessible').textContent = node.lines[0] || ''; $('#dialogue-text').textContent = ''; audio.effect('talk');
}
function closeDialogue() { dialogue = null; $('#dialogue').hidden = true; $('#dialogue-choices').replaceChildren(); $('#world').focus({preventScroll:true}); }
function completeDialogue(node) {
  closeDialogue();
  if (node.item) { toast(node.item); audio.effect('item'); }
  if (node.hint) toast(node.hint);
  if (node.travel) fadeScene(node.travel.scene,node.travel.spawn);
  if (node.ending) showEnding();
  if (node.command === 'import-ledger') $('#ledger-input').click();
  if (node.command === 'practice-ledger') { ledger = ArchiveLedger.practice(); openLedger(); }
  if (node.save || node.item || node.ending) persist();
  updateHud();
}
function advanceDialogue() {
  if (!dialogue) return;
  const d = dialogue, text = d.node.lines[d.line] || '';
  if (d.characters < text.length) { d.characters = text.length; paintDialogue(); return; }
  if (d.line < d.node.lines.length - 1) {
    d.line++; d.characters = 0; $('#dialogue-accessible').textContent = d.node.lines[d.line]; paintDialogue(); audio.effect('talk');
  } else if (d.node.choices?.length) {
    d.ready = true; showChoices();
  } else completeDialogue(d.node);
}
function showChoices() {
  if (!dialogue) return;
  $('#advance-dialogue').hidden = true;
  const box = $('#dialogue-choices'); box.replaceChildren();
  dialogue.node.choices.forEach((choice,index)=>{
    const button = document.createElement('button'); button.textContent = choice.label; button.setAttribute('aria-label',choice.label); button.className = index === dialogue.choice ? 'selected' : '';
    button.addEventListener('click',()=>selectChoice(index)); box.append(button);
  });
  box.querySelector('.selected')?.scrollIntoView({block:'nearest'});
}
function selectChoice(index) {
  if (!dialogue) return;
  const d = dialogue, choice = d.node.choices[index]; if (!choice) return;
  // Archive choices have their own callbacks; story choices are pure state transitions.
  if (choice.run) { const next = choice.run(); persist(); if (next) openDialogue(next); else closeDialogue(); return; }
  const next = chooseStory(state,d.node,choice.id);
  // A choice callback may have opened a different screen, including a new game.
  if (dialogue !== d) return;
  if (next) openDialogue(next); else closeDialogue();
  updateHud(); persist();
}
function paintDialogue(dt = 0) {
  if (!dialogue) return;
  const d = dialogue, text = d.node.lines[d.line] || '';
  d.characters = Math.min(text.length, d.characters + dt * 43);
  $('#dialogue-text').textContent = text.slice(0,Math.floor(d.characters));
  if (d.characters >= text.length && d.line === d.node.lines.length - 1 && d.node.choices?.length && !d.ready) { d.ready = true; showChoices(); }
}
function interact() {
  if (!running || dialogue || document.querySelector('dialog[open]') || !$('#ending-screen').hidden) return;
  const e = nearestEntity(state);
  if (!e) { toast('Only the leaves answer.'); return; }
  if (e.id === 'orrin' && ledger) { archiveMenu(); return; }
  const node = interaction(state,e.id); openDialogue(node); persist(); updateHud();
}
function toggleLight() {
  if (!running) return;
  if (!state.flags.lantern) { toast('A little light would help. Brin may have one.'); return; }
  state.light = !state.light; updateHud(); persist(true); audio.effect('talk');
}
function handleWorldEvents(events) {
  for (const event of events) {
    if (event === 'scene') { renderer.scene = null; areaBanner(); persist(); keys.clear(); }
    if (event === 'secret') { toast('The roots remember a door.'); audio.effect('secret'); persist(); }
    if (event === 'dash') audio.effect('dash');
    if (event === 'fell') { toast('The river returns you to the bank. Try closer to the gap.'); keys.clear(); }
  }
}
function directions() { return { x: (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0), y: (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0) }; }
function blocked() { return !running || dialogue || document.querySelector('dialog[open]') || !$('#ending-screen').hidden || !$('#title-screen').hidden; }
function stepInput(dt) {
  const input = directions(); input.dash = requestDash; requestDash = false;
  handleWorldEvents(stepWorld(state,runtime,input,dt));
}
function gameKey(event) {
  const key = event.key.toLowerCase();
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (key === 'm' && !event.repeat) { toggleSound(); return; }
  if (document.querySelector('dialog[open]')) { if (key === 'escape') document.querySelector('dialog[open]').close(); return; }
  if (!$('#title-screen').hidden && !dialogue && event.target.tagName === 'BUTTON' && key === 'enter') return;
  if (['arrowup','arrowdown','arrowleft','arrowright',' ','enter','shift'].includes(key)) event.preventDefault();
  if (dialogue) {
    if (event.repeat) return;
    if (dialogue.ready && ['arrowup','w','arrowdown','s'].includes(key)) {
      const count = dialogue.node.choices.length; dialogue.choice = (dialogue.choice + (key === 'arrowup' || key === 'w' ? -1 : 1) + count) % count; showChoices();
    } else if (['e','enter',' '].includes(key)) { if (dialogue.ready) selectChoice(dialogue.choice); else advanceDialogue(); }
    else if (key === 'escape') { closeDialogue(); persist(); }
    return;
  }
  if (!$('#title-screen').hidden) { if (key === 'enter' && !event.repeat) cached ? begin(true) : begin(false); return; }
  if (!$('#ending-screen').hidden) {
    if (['e','enter'].includes(key) && !event.repeat) {
      const selected = document.activeElement?.matches('[data-ending]') ? document.activeElement : $('#ending-screen [data-ending="home"]'); selected?.click();
    }
    return;
  }
  if (key === 'escape' && !event.repeat) { pause(); return; }
  if (key === 'i' && !event.repeat) { openBag(); return; }
  if (key === 'l' && !event.repeat) { toggleLight(); return; }
  if (key === 'e' || key === 'enter') { if (!event.repeat) interact(); return; }
  if (key === 'shift' && !event.repeat) { if (state.flags.dash) requestDash = true; else toast('Tove at Glasswater knows how to cross a gap.'); }
  if (['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].includes(key)) {
    keys.add(key);
    // A fast tap still produces a step; held keys continue in the real-time loop.
    if (!event.repeat && !blocked()) stepInput(1/60);
  }
}
function pause() { if (!running) return; keys.clear(); runtime.moving = false; persist(); $('#pause-menu > p').textContent = hasStorage ? 'Your discoveries and choices are saved in this browser.' : 'Autosave is unavailable here. Save a copy of your story before leaving.'; $('#pause-menu').showModal(); }
function openBag() {
  if (!running) return; keys.clear(); runtime.moving = false;
  const items = [ ['letter','An unaddressed letter','“To whoever still listens.” It brought you here.'] ];
  if (state.flags.lantern) items.push(['lantern','A listening lantern',`${state.light ? 'Lit' : 'Unlit'}. Press L. The roots cannot hide from its light.`]);
  if (state.flags.dash) items.push(['ribbon','A wind ribbon','Hold a direction and tap Shift. One short, brave step.']);
  if (state.flags.clapper) items.push(['clapper','A brass tongue','Not yours to keep. The bell beneath the roots is waiting.']);
  if (state.flags.flower && !state.flags.flowerGiven) items.push(['flower','A starflower','Some things should be given to someone who remembers.']);
  if (state.flags.letter) items.push(['letter','Nim’s unfinished letter','“No one asked if I was tired.”']);
  if (state.flags.archiveHelp) items.push(['moth','A paper moth','Orrin folded this from a page you helped put in order.']);
  $('#bag-items').innerHTML = items.map(([who,name,description])=>`<div class="bag-item"><img src="${portrait(who)}" alt=""><div><strong>${esc(name)}</strong><p>${esc(description)}</p></div></div>`).join('');
  $('#bag-menu').showModal();
}
function showEnding() {
  keys.clear(); persist(); audio.ending = state.ending; if (state.ending === 'song') audio.effect('bell');
  const screen = $('#ending-screen'); screen.innerHTML = `<small>UNBORROWED · AN ENDING</small><h2>${state.ending === 'song' ? 'A note, freely given.' : 'Room for a small voice.'}</h2><p>${state.ending === 'song' ? 'The bell rings once. Windows open. The river keeps moving. Nim is already looking at the sky.' : 'The bell sleeps. A door opens. Nim steps into a village that is learning another way to wake.'}</p><p>${state.relationships.brin > 0 ? 'Brin leaves a light burning by the well.' : 'By the well, Brin looks up from the roots.'}</p><div class="ending-actions"><button data-ending="home">Return to Mosswake ↗</button><button data-ending="stay">Stay a little longer</button></div><p class="ending-note">Your story is remembered. You can keep wandering.</p>`;
  screen.hidden = false;
}
function toggleSound() {
  try { audio.setEnabled(!audio.enabled); $('#sound-button').setAttribute('aria-pressed',String(audio.enabled)); $('#title-sound').setAttribute('aria-pressed',String(audio.enabled)); $('#title-sound').innerHTML = `Sound: ${audio.enabled ? 'on' : 'off'} <span>M</span>`; }
  catch { toast('This browser could not wake the sound. The world is still yours.'); }
}
function download(text, filename, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text],{type})), a = document.createElement('a'); a.href = url; a.download = filename; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),10000);
}

// The original real-world chore lives only inside this optional NPC encounter.
// It shares the exact processing engine with its downloadable output.
function archiveMenu() {
  openDialogue({speaker:'Orrin',portrait:'orrin',lines:[ledger.complete ? 'Every scrap has a place. Shall I wrap up a copy for you?' : 'Your ledger is still on my desk. We can continue, or take a copy as it stands.'],choices:[
    {id:'continue',label:ledger.complete ? 'Look at the finished ledger.' : 'Continue putting the ledger in order.',run:()=>ledgerNode()},
    {id:'export',label:'Take a reviewed CSV copy.',run:()=>{ exportLedger(); return {speaker:'Orrin',portrait:'orrin',lines:['The download has started. Keep it somewhere dry.','Unreviewed records, if any, are kept and marked. Excluded rows have their own copy.'],choices:[]}; }},
    ...(ledger.records.some(r=>r.duplicateDecision==='exclude')?[{id:'excluded',label:'Take the excluded rows separately.',run:()=>{exportLedger(true);return {speaker:'Orrin',portrait:'orrin',lines:['Nothing was destroyed. These are the rows you chose to set aside.'],choices:[]};}}]:[]),
    {id:'log',label:'Take the decision log.',run:()=>{download(ledger.exportLog(),'mosswake-decisions.csv');return {speaker:'Orrin',portrait:'orrin',lines:['A record of what changed, and what you chose to undo.'],choices:[]};}},
    ...(ledger.history.length ? [{id:'undo',label:'Undo my last ledger decision.',run:()=>{ledger.undo();return ledgerNode();}}] : []),
    {id:'leave',label:'Leave the desk for now.',run:()=>null},
  ]});
}
function exportLedger(excluded = false) {
  const base = ledger.filename.replace(/\.(csv|tsv)$/i,'').replace(/[^a-z0-9_-]/gi,'-');
  download(ledger.export(excluded),`${base}-${excluded?'excluded':'mosswake-'+(ledger.complete?'reviewed':'partial')}.csv`);
}
function ledgerNode(page = 0) {
  const r = ledger.next();
  if (!r) {
    state.flags.archiveHelp = true; persist();
    const patterns = new Set(ledger.records.filter(r=>r.recurring).map(r=>`${r.merchant}|${r.amount}|${r.currency}`)).size;
    return {speaker:'Orrin',portrait:'orrin',lines:[`There. ${ledger.records.length} real records reviewed. ${patterns} possible recurring payment patterns are noted in the export.`,`I made you a paper moth. It does not improve your life in any measurable way. I think you may like it.`],choices:[
      {id:'export',label:'Take the reviewed CSV.',run:()=>{exportLedger();return {speaker:'Orrin',portrait:'orrin',lines:['The download has started. Original columns preserved, review fields added.','The paper moth is in your satchel. The rest of the village is still waiting.'],choices:[]};}},
      ...(ledger.records.some(r=>r.duplicateDecision==='exclude')?[{id:'excluded',label:'Take the excluded rows separately.',run:()=>{exportLedger(true);return {speaker:'Orrin',portrait:'orrin',lines:['The excluded rows are on their way, unchanged except for your review notes.'],choices:[]};}}]:[]),
      {id:'back',label:'Back to the archive.',run:()=>{setTimeout(archiveMenu,0);return null;}},
    ]};
  }
  if (r.duplicateOf && !r.duplicateDecision) {
    const first = ledger.records.find(x=>x.id===r.duplicateOf);
    const ref = ledger.parsed.headers.findIndex(h=>/^(reference|ref|transaction.?id|id)$/i.test(h));
    return {speaker:'Orrin',portrait:'orrin',lines:[`Two scraps look alike: ${r.merchant}, ${ledger.money(r)}, ${r.date}.`,`${ref>=0?'References: '+first.raw[ref]+' / '+r.raw[ref]+'. ':''}Source rows ${first.id+1} and ${r.id+1} share a date, merchant, amount, and currency. They may still be separate purchases. Nothing is excluded without your choice.`],choices:[
      {id:'keep',label:'Keep both. They may both be real.',run:()=>{ledger.duplicate('keep');return ledgerNode();}},
      {id:'exclude',label:`Exclude source row ${r.id+1} from the main copy.`,run:()=>{ledger.duplicate('exclude');return ledgerNode();}},
      {id:'back',label:'Back to the desk.',run:()=>{setTimeout(archiveMenu,0);return null;}},
    ]};
  }
  const categories = page === 0 ? [r.suggestion,...CATEGORIES.filter(c=>c!==r.suggestion)].slice(0,4) : [r.suggestion,...CATEGORIES.filter(c=>c!==r.suggestion)].slice(4);
  return {speaker:'Orrin',portrait:'orrin',lines:[`“${r.merchant}”\n${ledger.money(r)} · ${r.date} · source row ${r.id+1}`,`Where should this one live? My guess is ${r.suggestion.toLowerCase()}, but you know your own story.`],choices:[
    ...categories.map(category=>({id:category,label:category,run:()=>{ledger.categorize(category);return ledgerNode();}})),
    {id:'more',label:page ? 'Earlier categories…' : 'Other categories…',run:()=>ledgerNode(page ? 0 : 1)},
    {id:'back',label:'Back to the desk.',run:()=>{setTimeout(archiveMenu,0);return null;}},
  ]};
}

$('#new-game').addEventListener('click',confirmNewGame); $('#continue-game').addEventListener('click',()=>begin(true));
$('#advance-dialogue').addEventListener('click',advanceDialogue); $('#pause-button').addEventListener('click',pause); $('#bag-button').addEventListener('click',openBag);
$('#lantern-button').addEventListener('click',toggleLight); $('#sound-button').addEventListener('click',toggleSound); $('#title-sound').addEventListener('click',toggleSound);
$('#fullscreen-button').addEventListener('click',()=>{ if (!document.fullscreenElement) $('#game-shell').requestFullscreen?.().catch(()=>toast('Full screen is unavailable here.')); else document.exitFullscreen?.(); });
document.addEventListener('keydown',gameKey); document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();if(running)persist(true);});
document.addEventListener('visibilitychange',()=>{keys.clear();if(running)persist(true);});
document.addEventListener('click',e=>{
  const close = e.target.closest('[data-close]'); if (close) close.closest('dialog').close();
  const action = e.target.closest('[data-menu]')?.dataset.menu;
  if (action) {
    $('#pause-menu').close();
    if (action === 'bag') openBag();
    if (action === 'controls') $('#notes-menu').showModal();
    if (action === 'save-copy') { download(saveState(cached || state),'unborrowed-story.json','application/json'); toast('Your story copy is on its way.'); }
    if (action === 'load-copy') $('#story-input').click();
    if (action === 'title') { persist(); running = false; keys.clear(); $('#hud').hidden = true; $('#title-screen').hidden = false; $('#continue-game').hidden = !cached; $('#touch-controls').style.visibility = 'hidden'; }
  }
  const ending = e.target.closest('[data-ending]')?.dataset.ending;
  if (ending) { $('#ending-screen').hidden = true; if (ending === 'home') fadeScene('village',[29,24]); else $('#world').focus({preventScroll:true}); }
});
for (const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('close',()=>{keys.clear();$('#world').focus({preventScroll:true});});
for (const button of document.querySelectorAll('[data-walk]')) {
  const key = {up:'w',down:'s',left:'a',right:'d'}[button.dataset.walk];
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);if(!blocked()){keys.add(key);stepInput(1/60);}});
  for (const type of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(type,()=>keys.delete(key));
}
$('#touch-interact').addEventListener('click',()=>dialogue ? advanceDialogue() : interact());
$('#touch-dash').addEventListener('click',()=>{if(state.flags.dash)requestDash=true;else toast('Ask Tove about the river.');});
$('#ledger-input').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;
  try{if(file.size>5*1024*1024)throw Error('The archive accepts ledgers smaller than 5 MB.');ledger=new ArchiveLedger(await file.text(),file.name);openLedger();}
  catch(error){openDialogue({speaker:'Orrin',portrait:'orrin',lines:[error.message],choices:[]});}finally{e.target.value='';}
});
function openLedger(){openDialogue(ledgerNode());}
$('#story-input').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;
  try{if(file.size>100000)throw Error();const saved=loadState(await file.text());if(!saved)throw Error();cached=saved;begin(true);toast('Your path is remembered.');}
  catch{toast('That story could not be read. Your current path is safe.');}finally{e.target.value='';}
});
window.addEventListener('beforeunload',e=>{if(running)persist(true);if(ledger?.audit.length){e.preventDefault();e.returnValue='';}});

function frame(now) {
  const dt=Math.min((now-lastTime)/1000,.04);lastTime=now;const active=!blocked()&&!document.hidden;
  if(active)stepInput(dt);else runtime.moving=false;
  paintDialogue(dt);renderer.draw(state,runtime,now/1000,!$('#title-screen').hidden);
  const e=active?nearestEntity(state):null,prompt=$('#interaction-prompt');
  if(e){prompt.hidden=false;prompt.querySelector('span').textContent=e.name;const cx=renderer.camera.x,cy=renderer.camera.y;prompt.style.left=`${Math.max(12,Math.min(88,(e.x-cx)/640*100))}%`;prompt.style.top=`${Math.max(15,Math.min(78,(e.y-cy-40)/360*100))}%`;}else prompt.hidden=true;
  if(now-lastStatus>220){lastStatus=now;const text=`${MAPS[state.scene].name}. Position ${Math.round(state.x)}, ${Math.round(state.y)}. Facing ${state.facing}.${e?' Nearby: '+e.name+'. Press E.':''}${state.flags.lantern?' Lantern '+(state.light?'lit':'unlit')+'.':''}${state.flags.dash?' Mossstep available.':''}`;if($('#world-status').textContent!==text)$('#world-status').textContent=text;}
  if(active&&now-lastSave>2500){lastSave=now;persist(true);}
  requestAnimationFrame(frame);
}
$('#touch-controls').style.visibility='hidden';requestAnimationFrame(frame);
