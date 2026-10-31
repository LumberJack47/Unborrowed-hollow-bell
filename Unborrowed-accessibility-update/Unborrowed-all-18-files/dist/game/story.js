const say = (speaker, portrait, lines, choices = [], extra = {}) => ({ speaker, portrait, lines, choices, ...extra });
const option = (id, label, effect, next) => ({ id, label, effect, next });
export function chooseStory(state, node, id) {
  const choice = node.choices.find(c => c.id === id);
  if (!choice) return null;
  choice.effect?.(state);
  return choice.next?.(state) || null;
}
export function interaction(s, id) {
  switch (id) {
    case 'sign': return say('A rain-soft sign', 'sign', ['MOSSWAKE. Population: mostly listening.', 'North: the wood. East: Glasswater. Below: please do not ask below.']);
    case 'camp': return say('Your little camp', 'player', ['The fire is warm. Your letter is dry.', 'On the envelope, in unfamiliar handwriting: “To whoever still listens.”'], [], { save: true });
    case 'cat': s.flags.cat = true; return say('A very important cat', 'cat', ['The cat regards you with the gravity of a small king.', 'You offer a respectful nod. It offers you one blink.', 'For reasons no one can explain, this feels like progress.']);
    case 'well': return say('The silent well', 'well', s.ending === 'song' ? ['A single note rises from the water.', 'It sounds almost, but not quite, like your name.'] : s.ending === 'quiet' ? ['There is no bell in the water.', 'For the first time, you can hear the frogs.'] : ['You lean over the old stones.', 'Far below, something inhales. Nothing rings.']);
    case 'brin':
      if (s.ending) return say('Brin', 'brin', s.ending === 'song' ? [s.relationships.brin > 0 ? 'You came back. I thought you might.' : 'So. You found a way to wake it.', 'One note. Given freely. That is more than we had any right to ask.', 'The village sounds different when you stop trying to make it sound the same.'] : ['No bell, then.', 'I was afraid of the silence. I think I filled it with the wrong story.', 'Nim is upstairs now. I can wait for a song. Or not. We have time.']);
      if (s.flags.lantern && s.flags.flower && !s.flags.flowerGiven) return say('Brin', 'brin', ['A starflower? I have not seen one since the roots closed.'], [
        option('give-flower', 'It looked like it belonged here.', st => { st.flags.flowerGiven = true; st.relationships.brin += 2; }, () => say('Brin', 'brin', ['I used to leave these by the bell.', 'Thank you. Not for fixing anything. Just... for noticing.'])),
        option('keep-flower', 'I would like to keep it a little longer.', null, () => say('Brin', 'brin', ['Then keep it somewhere it can see the sky.'])),
      ]);
      if (s.flags.lantern) return say('Brin', 'brin', s.flags.clapper ? ['That brass tongue belongs to the old bell.', 'Take your light into the north wood. Where the path bends west, the roots have a seam.', 'Light it with L. The roots have forgotten how to hide from kindness.'] : ['Tove keeps the crossing east of here. If anyone remembers the bell’s tongue, it is them.', 'The lantern is yours. L to light it. Not every path is visible without it.']);
      s.flags.metBrin = true;
      return say('Brin', 'brin', ['A letter? For whoever still listens?', 'Then it is probably for the one we stopped listening to.', 'Our bell fell silent when we locked its voice beneath the roots. We thought we were keeping the village safe.'], [
        option('listen', 'Tell me about the voice.', st => { st.flags.lantern = true; st.light = true; st.relationships.brin += 1; }, () => say('Brin', 'brin', ['Their name is Nim. At least, that was the name they chose.', 'Take my lantern. L will wake its light. In the north wood, light reveals what roots conceal.', 'And find Tove at Glasswater, east of here. They kept the bell’s missing brass tongue.'], [], { item: 'A listening lantern' })),
        option('practical', 'Can you show me a way through?', st => { st.flags.lantern = true; st.light = true; }, () => say('Brin', 'brin', ['Through is a difficult direction around here.', 'Borrow the lantern. L to light it. Tove waits east, at Glasswater. Find the bell’s tongue there.', 'If you go north later, remember: the roots move for light.'], [], { item: 'A borrowed lantern' })),
      ]);
    case 'tove':
      if (s.ending) return say('Tove', 'tove', [s.relationships.tove > 0 ? 'You came back, my friend. Kept your feet dry?' : 'You again. Bridge is still holding.', ...(s.ending === 'song' ? ['Heard it all the way out here. One little note.', 'The river did not stop. Good. Would hate to be put out of a job by a bell.'] : ['No grand ringing? Fine by me.', 'Quiet is not the same thing as empty. Rivers taught me that.'])]);
      if (s.flags.dash) return say('Tove', 'tove', s.flags.clapper ? ['Found it, did you?', 'The winch on the far bank can mend the bridge. Useful if you dislike dramatic entrances.', 'Brin’s roots are north of the village. Bring a light.'] : ['Walk close to the broken planks. Face across. Hold a direction and tap Shift.', 'The ribbon carries you over the short gap. Water elsewhere is still water.', 'The brass-bound chest is on the far bank, northeast of the bridge.']);
      return say('Tove', 'tove', ['You have the look of someone about to fall in a river.', 'That gap is shorter than it looks. The trick is to leave the ground before you start arguing with it.'], [
        option('name', 'I’m listening. What should I call you?', st => { st.flags.dash = true; st.relationships.tove += 1; }, () => say('Tove', 'tove', ['Tove. Bridge keeper. Temporarily between bridges.', 'Here. A wind ribbon. Hold a direction, then tap Shift to dash. It will carry you over the missing planks.', 'If you are looking for the bell’s tongue, try the chest across the river. I was keeping it out of reach of regret.'], [], { item: 'A wind ribbon · Shift to dash' })),
        option('cross', 'How do I get across?', st => { st.flags.dash = true; }, () => say('Tove', 'tove', ['Direct. I like that.', 'Take this wind ribbon. Hold a direction and tap Shift near the gap. No ribbon can make the whole river a road.', 'There is a brass tongue in the chest on the far bank. Bring it somewhere it can say something useful.'], [], { item: 'A wind ribbon · Shift to dash' })),
      ]);
    case 'clapper':
      s.flags.clapper = true;
      return say('The brass-bound chest', 'clapper', ['Inside: a small brass tongue, wrapped in a handkerchief.', 'A note reads: “It was never ours to keep.”', 'The metal is warm. It is listening.'], [], { item: 'The bell’s brass tongue' });
    case 'winch':
      if (s.flags.bridge) return say('The old winch', 'winch', ['The bridge is holding. A modest miracle, made of rope.']);
      s.flags.bridge = true;
      return say('The old winch', 'winch', ['You turn the handle. Somewhere under the water, old wood finds old wood.', 'The missing planks rise into place. The way back is safe.'], [], { item: 'The bridge is mended' });
    case 'riverstone': return say('A river-worn stone', 'stone', ['Someone scratched a message into the stone:', '“Move first. Be frightened after.”', 'Underneath, in smaller letters: “Aim for the bridge.”']);
    case 'mothstone': return say('The moth stone', 'stone', ['The moths are facing west.', 'Carved beneath their wings: “Bring a light to the place the roots forget.”']);
    case 'letter':
      s.flags.letter = true;
      return say('A letter caught in a branch', 'letter', ['“Dear Brin. I did not stop singing because I was angry.”', '“I stopped because no one asked if I was tired.”', 'It is signed with a tiny drawing of a moth.']);
    case 'flower':
      s.flags.flower = true;
      return say('A starflower', 'flower', ['A flower grows on a little island of moss.', 'When you lift it, the stars do not come off on your hands.', 'Someone in Mosswake might remember it.'], [], { item: 'A starflower' });
    case 'rootdoor':
      if (!s.flags.secret) return say('The roots', 'rootdoor', ['There is a seam here. It almost looks like a door.', 'You feel a small, patient need for light.'], [], { hint: 'A listening lantern can be lit with L.' });
      if (!s.flags.clapper) return say('The rootway', 'rootdoor', ['The lantern reveals a stair beneath the roots.', 'A brass-shaped hollow seals the first step. The old bell is missing its tongue.', 'Tove keeps things that should not have been kept. Look east, across Glasswater.']);
      return say('The rootway', 'rootdoor', ['The brass tongue fits. The roots unfold without a sound.', 'Below, someone is humming to no one.'], [], { travel: { scene: 'belfry', spawn: [22, 27] } });
    case 'inscription': return say('An unfinished inscription', 'stone', ['“A voice freely given may wake a village.”', 'The next line was carved much later:', '“A voice freely kept may teach it to listen.”']);
    case 'nim':
      if (s.ending && !s.flags.homecoming) return say('Nim','nim',['The stair is open now. No more locks.','I will meet you by the well when you are ready.']);
      if (s.ending) return say('Nim', 'nim', s.ending === 'song' ? ['There. One note. Mine, and yours, and nobody’s property.', 'Do you think the moss heard it? I hope the moss heard it.'] : ['I thought they would be disappointed.', 'Maybe they are. Maybe they can be disappointed and kind at the same time.', 'It is nice up here.']);
      if (s.flags.nimMet) return say('Nim', 'nim', ['The bell is waiting just north of us.', 'I can share one note. Or we can leave it quiet.', 'Will you decide with me, instead of for me?']);
      s.flags.nimMet = true;
      return say('Nim', 'nim', ['Oh. You found the stair.', 'I used to live inside that bell. Every morning, everyone wanted the same beautiful sound.', 'No one asked if I wanted a morning of my own.'], [
        option('free', 'You don’t owe anyone your voice.', st => { st.relationships.nim += 2; }, () => say('Nim', 'nim', ['...I was hoping someone might say that.', 'I could lend the bell one note. Not forever. Just one. Or we could let it sleep.', 'Put the brass tongue in the bell, north of us. We can choose there. Together.'])),
        option('return', 'The village misses you.', st => { st.relationships.nim += 1; }, () => say('Nim', 'nim', ['Do they miss me? Or the noise I made?', 'No. That was unkind. I miss them too.', 'Bring the tongue to the bell, north of us. I will share one note, if we choose it together.'])),
      ]);
    case 'bell':
      if (s.ending) return say('The hollow bell', 'bell', s.ending === 'song' ? ['A note, freely given, still hangs in the air.'] : ['A quiet bell. An open door. Both can be a beginning.']);
      if (!s.flags.nimMet) return say('The hollow bell', 'bell', ['The old brass waits.', 'Someone is waiting just south of you. Perhaps you should ask before ringing.']);
      return say('Nim', 'nim', ['The tongue settles into place. The bell is whole again.', 'Nim takes your hand.', 'One note, or one quiet morning. Neither has to last forever.'], [
        option('song', 'Ring it together. One freely given note.', st => { st.ending = 'song'; st.flags.bell = true; }, st => say('Nim', 'nim', [st.relationships.nim > 1 ? 'Thank you for asking.' : 'Just this once. With you.', 'You reach for the bell together.', 'For the first time in years, Mosswake hears a sound that belongs to no one.'], [], { ending: true })),
        option('quiet', 'Let the bell rest. Let Nim come home.', st => { st.ending = 'quiet'; st.flags.bell = true; }, () => say('Nim', 'nim', ['Then... let us go upstairs.', 'The bell stays quiet. The stair stays open.', 'For the first time in years, Mosswake has to listen to something small.'], [], { ending: true })),
      ]);
    case 'orrin': return say('Orrin', 'orrin', s.flags.archiveHelp ? ['My paper moth still remembers your hands.', 'Some stories are made of names and numbers. Someone has to give them a place.'] : ['Ah. A visitor with hands. A tremendous improvement on my usual clientele.', 'I keep the village archive. Sometimes I help visitors put a real ledger in order.', 'You may stay for a story, or bring a transaction CSV. The latter actually changes the file you take home.'], [
      option('archive-story', 'Tell me about the village.', null, () => say('Orrin', 'orrin', ['We filed Nim under “bell.” A terrible cataloguing error.', 'Be careful what you call things. After a while, they may believe you.'])),
      option('ledger-import', 'Bring a real ledger from my device (CSV).', null, () => say('Orrin', 'orrin', ['Choose a CSV with Date, Description, and Amount columns. Currency is optional.', 'The file stays on this device. This ledger is held only until you close the game; take an export before leaving.'], [], { command: 'import-ledger' })),
      option('ledger-practice', 'Try a practice ledger.', null, () => say('Orrin', 'orrin', ['Twenty-four little scraps of paper. Every decision writes to the actual practice ledger.', 'When we finish, you can download it.'], [], { command: 'practice-ledger' })),
      option('leave', 'I’m just passing through.', null, () => say('Orrin', 'orrin', ['A noble profession. Mind the roots.'])),
    ]);
    default: return say('The wood', 'player', ['Only the leaves answer.']);
  }
}
