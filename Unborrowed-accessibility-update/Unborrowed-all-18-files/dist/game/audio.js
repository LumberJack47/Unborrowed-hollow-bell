// An original, generated ambient score. Nothing is streamed or downloaded.
export class Soundscape {
  constructor() { this.enabled = false; this.context = null; this.scene = 'village'; this.ending = null; this.index = 0; this.timer = null; }
  setEnabled(value) {
    this.enabled = value;
    if (value) {
      this.context ||= new (window.AudioContext || window.webkitAudioContext)();
      if (!this.master) { this.master = this.context.createGain(); this.master.gain.value = .16; this.master.connect(this.context.destination); }
      this.context.resume();
      if (!this.timer) { this.note(); this.timer = setInterval(() => this.note(), 1050); }
    } else { clearInterval(this.timer); this.timer = null; this.context?.suspend(); }
  }
  tone(frequency, duration = 2.5, volume = .12, type = 'sine', delay = 0) {
    if (!this.enabled || !this.context || document.hidden) return;
    const t = this.context.currentTime + delay, o = this.context.createOscillator(), g = this.context.createGain();
    o.type = type; o.frequency.value = frequency; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(volume, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + duration);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + duration + .1);
  }
  note() {
    const motifs = { village: [293.66, 440, 349.23, 329.63, 293.66, 220, 261.63, 220], woods: [293.66, 220, 349.23, 261.63, 0, 329.63, 220, 0], river: [440, 349.23, 293.66, 329.63, 440, 523.25, 349.23, 0], belfry: [146.83, 0, 293.66, 0, 220, 0, 349.23, 0] };
    const notes = this.ending === 'song' ? [293.66, 369.99, 440, 587.33, 440, 369.99, 329.63, 293.66] : motifs[this.scene];
    const n = notes[this.index++ % notes.length]; if (n) { this.tone(n, 3.8, .07, 'sine'); this.tone(n * 2.003, 2.4, .015, 'triangle'); }
    if (this.index % 4 === 0) this.tone(this.scene === 'belfry' ? 73.42 : 146.83, 5, .045, 'sine');
  }
  effect(id) {
    if (id === 'item' || id === 'secret') { [293.66, 440, 587.33].forEach((n, i) => this.tone(n, .8, .13, 'triangle', i * .12)); }
    if (id === 'dash') { this.tone(220, .16, .05, 'triangle'); this.tone(440, .12, .03, 'sine', .06); }
    if (id === 'talk') this.tone(370, .08, .04, 'triangle');
    if (id === 'bell') { [146.83, 293.66, 440.8, 614.8, 881.5].forEach((n, i) => this.tone(n, 7 - i * .6, .15 / (i + 1), 'sine')); }
  }
}
