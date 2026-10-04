/* audio.js — WebAudio-synthesised sound. No files, no autoplay.
 * Muted by default; the AudioContext is only created when the player turns
 * sound on (a user gesture). Owned by whoever wants to improve sound.
 *
 *   audio.toggle() -> bool   audio.enabled
 *   audio.onEvent(ev)        engine events -> one-shot sounds
 *   audio.frame(game)        per-frame: ambience (crickets/silence, dread drone)
 */
let ac = null, master = null, cricketGain = null, droneGain = null, drone = null;
let cricketTimer = 0;

function ensure() {
  if (ac) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
  cricketGain = ac.createGain(); cricketGain.gain.value = 0.12; cricketGain.connect(master);
  droneGain = ac.createGain(); droneGain.gain.value = 0; droneGain.connect(master);
  // detuned calliope-ish drone for dread
  drone = [110, 110 * 1.498, 110 * 1.06].map((f) => {
    const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = f;
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 500;
    o.connect(lp); lp.connect(droneGain); o.start(); return o;
  });
}

function tone(freq, dur, { type = "square", vol = 0.2, slide = 0, delay = 0 } = {}) {
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t0 + dur);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
}
function noise(dur, { vol = 0.2, freq = 1200, q = 1, dest = master, delay = 0 } = {}) {
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ac.createBufferSource(); s.buffer = buf;
  const f = ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q;
  const g = ac.createGain(); g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(dest); s.start(t0);
}

export const audio = {
  enabled: false,
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) { ensure(); if (ac && ac.state === "suspended") ac.resume(); }
    else if (ac) ac.suspend();
    return this.enabled;
  },
  onEvent(ev) {
    if (!this.enabled || !ac) return;
    switch (ev.type) {
      case "hit": tone(520, 0.12, { type: "square", vol: 0.12, slide: 1.6 }); tone(330, 0.15, { type: "triangle", vol: 0.1, slide: 0.6, delay: 0.03 }); break; // honk
      case "ding": tone(1320, 0.6, { type: "sine", vol: 0.2 }); break;
      case "hurt": noise(0.25, { vol: 0.35, freq: 300 }); tone(160, 0.3, { type: "sawtooth", vol: 0.15, slide: 0.5 }); break;
      case "grab": tone(880, 0.25, { type: "triangle", vol: 0.08, slide: 0.5 }); break; // a giggle-squeak
      case "swing": noise(0.08, { vol: 0.12, freq: 2500, q: 2 }); break;
      case "throw": noise(0.12, { vol: 0.1, freq: 1800, q: 3 }); break;
      case "burst": noise(0.4, { vol: 0.4, freq: 900, q: 0.5 }); for (let i = 0; i < 6; i++) noise(0.03, { vol: 0.15, freq: 3000, delay: 0.05 + i * 0.04 }); break;
      case "pickup": tone(660, 0.08, { type: "triangle", vol: 0.12 }); tone(990, 0.12, { type: "triangle", vol: 0.12, delay: 0.07 }); break;
      case "break": noise(0.15, { vol: 0.2, freq: 600 }); break;
      case "spawn": tone(98, 0.8, { type: "sawtooth", vol: 0.12, slide: 0.8 }); tone(147, 0.8, { type: "sawtooth", vol: 0.08, slide: 0.8 }); break;
      case "cookie": tone(300, 0.5, { type: "sine", vol: 0.15, slide: 0.4 }); break;
      case "splash": noise(0.4, { vol: 0.25, freq: 700, q: 0.7 }); break;
      case "mirror": tone(1500, 0.4, { type: "sine", vol: 0.08, slide: 0.7 }); tone(1510, 0.4, { type: "sine", vol: 0.08, slide: 0.69 }); break;
      case "marked": tone(220, 0.6, { type: "triangle", vol: 0.12, slide: 1.5 }); break;
      case "dash": noise(0.1, { vol: 0.1, freq: 900, q: 1.5 }); break;
      case "exit": [523, 659, 784].forEach((f, i) => tone(f, 0.3, { type: "triangle", vol: 0.12, delay: i * 0.1 })); break;
      case "caught": [392, 370, 349, 330, 311].forEach((f, i) => tone(f, 0.4, { type: "square", vol: 0.08, delay: i * 0.22 })); break;
      case "uiClick": tone(740, 0.05, { type: "triangle", vol: 0.08 }); break;
    }
  },
  frame(game, dt) {
    if (!this.enabled || !ac) return;
    const silent = game && game.silence;
    // crickets: the bugs sing until they don't
    cricketGain.gain.setTargetAtTime(silent || !game ? 0 : 0.12, ac.currentTime, 0.15);
    cricketTimer -= dt;
    if (cricketTimer <= 0 && game && !silent) {
      cricketTimer = 0.25 + Math.random() * 0.5;
      for (let i = 0; i < 3; i++) noise(0.025, { vol: 0.25, freq: 4200 + Math.random() * 600, q: 18, dest: cricketGain, delay: i * 0.05 });
    }
    const dread = game ? game.dread : 0;
    droneGain.gain.setTargetAtTime(dread * 0.07, ac.currentTime, 0.4);
    if (drone) drone[2].frequency.setTargetAtTime(110 * (1.06 + dread * 0.05), ac.currentTime, 0.5);
  },
  stopAmbience() { if (ac) { cricketGain.gain.setTargetAtTime(0, ac.currentTime, 0.1); droneGain.gain.setTargetAtTime(0, ac.currentTime, 0.1); } },
};
