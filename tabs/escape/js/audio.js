/* audio.js — WebAudio-synthesised sound. No files, no autoplay.
 * Muted by default on every visit; the AudioContext is only created when the
 * player turns sound on (a user gesture). Volume comes from settings.js.
 *
 *   audio.toggle() -> bool   audio.enabled
 *   audio.onEvent(ev)        engine/ui events -> one-shot sounds (unknown types ignored)
 *   audio.frame(game, dt)    per-frame ambience: a detuned calliope waltz that warps
 *                            with dread, crickets that stop dead in silence zones,
 *                            a wind bed, and a heartbeat that quickens with dread.
 *                            game === null means a menu (calliope only, far away).
 *   audio.stopAmbience()
 */
import { settings, onSettings } from "./settings.js";

let ac = null, master = null, sfx = null, amb = null, cricketGain = null, droneGain = null, drone = null;
let callGain = null, callFilter = null, windGain = null, heartGain = null, wobble = null;
let cricketTimer = 0, nextNote = 0, noteIdx = 0, nextBeat = 0, ambOn = true;
let dread = 0, sanityLoss = 0, silent = false;

const vol = () => 0.85 * settings.volume;
onSettings(() => { if (master) master.gain.setTargetAtTime(vol(), ac.currentTime, 0.05); });

function ensure() {
  if (ac) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4; comp.connect(ac.destination);
  master = ac.createGain(); master.gain.value = vol(); master.connect(comp);
  sfx = ac.createGain(); sfx.gain.value = 1; sfx.connect(master);
  amb = ac.createGain(); amb.gain.value = 1; amb.connect(master);
  cricketGain = ac.createGain(); cricketGain.gain.value = 0; cricketGain.connect(amb);
  droneGain = ac.createGain(); droneGain.gain.value = 0; droneGain.connect(amb);
  heartGain = ac.createGain(); heartGain.gain.value = 0.9; heartGain.connect(master);
  // calliope bus: lowpass (muffles in silence / far away) + a slow tape-warble LFO shared by every pipe
  callFilter = ac.createBiquadFilter(); callFilter.type = "lowpass"; callFilter.frequency.value = 1800; callFilter.Q.value = 0.7;
  callGain = ac.createGain(); callGain.gain.value = 0; callFilter.connect(callGain); callGain.connect(amb);
  wobble = ac.createOscillator(); wobble.frequency.value = 0.37;
  const wobbleAmt = ac.createGain(); wobbleAmt.gain.value = 14; wobble.connect(wobbleAmt); wobble.start();
  wobble.amt = wobbleAmt;
  // detuned dread drone
  drone = [55, 55 * 1.498, 55 * 1.06].map((f) => {
    const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.value = f;
    const lp = ac.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 380;
    o.connect(lp); lp.connect(droneGain); o.start(); return o;
  });
  // wind: looping filtered noise
  const len = ac.sampleRate * 3, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  let b = 0; for (let i = 0; i < len; i++) { b = 0.985 * b + 0.015 * (Math.random() * 2 - 1); d[i] = b * 6; }
  const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
  const wf = ac.createBiquadFilter(); wf.type = "bandpass"; wf.frequency.value = 420; wf.Q.value = 0.6;
  windGain = ac.createGain(); windGain.gain.value = 0;
  src.connect(wf); wf.connect(windGain); windGain.connect(amb); src.start();
  nextNote = ac.currentTime + 0.2; nextBeat = ac.currentTime + 0.5;
}

function tone(freq, dur, { type = "square", vol = 0.2, slide = 0, delay = 0, dest = sfx, attack = 0.004 } = {}) {
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + dur + 0.05);
}
function noise(dur, { vol = 0.2, freq = 1200, q = 1, dest = sfx, delay = 0, sweep = 0 } = {}) {
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ac.createBufferSource(); s.buffer = buf;
  const f = ac.createBiquadFilter(); f.type = "bandpass"; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
  if (sweep) f.frequency.exponentialRampToValueAtTime(freq * sweep, t0 + dur);
  const g = ac.createGain(); g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(dest); s.start(t0);
}

/* ---- the calliope: a slow minor waltz, two detuned pipes per note, oom-pah-pah under it.
   Each entry: [melody semitone above A3 or null, beats, bass semitone above A1] */
const WALTZ = [
  [12, 2, 0], [15, 1, null], [14, 1, 0], [12, 1, null], [11, 1, null], [12, 3, 0], [7, 3, -5],
  [8, 2, 5], [12, 1, null], [11, 1, 5], [8, 1, null], [7, 1, null], [5, 2, -5], [4, 1, null], [7, 3, -5],
  [12, 2, 0], [15, 1, null], [19, 1, 0], [18, 1, null], [15, 1, null], [14, 2, 5], [12, 1, null], [11, 3, -5],
  [8, 1, 5], [11, 1, null], [14, 1, null], [17, 2, 1], [16, 1, null], [12, 1, -5], [11, 1, null], [7, 1, null], [12, 3, 0],
];
const A3 = 220, A1 = 55;
function pipe(freq, t, dur, v, detuneCents) {
  for (const [type, det, mul] of [["square", -detuneCents, 0.45], ["triangle", detuneCents, 1]]) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq; o.detune.value = det; wobble.amt.connect(o.detune);
    // a drunk note now and then: it sags flat as it is held
    if (Math.random() < 0.06 + dread * 0.2) o.frequency.setTargetAtTime(freq * 0.955, t + dur * 0.3, dur * 0.4);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * mul, t + 0.03);
    g.gain.setTargetAtTime(v * mul * 0.6, t + 0.05, 0.2); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(callFilter); o.start(t); o.stop(t + dur + 0.05);
  }
}
function scheduleCalliope() {
  const beat = 0.5 + dread * 0.12; // it slows as they close in, like a music box winding down
  while (nextNote < ac.currentTime + 0.25) {
    const [m, beats, bass] = WALTZ[noteIdx % WALTZ.length];
    const det = 9 + dread * 28 + sanityLoss * 30;
    if (m != null) pipe(A3 * 2 ** (m / 12), nextNote, beats * beat * 0.95, 0.075, det);
    if (bass != null) { // oom on the downbeat, pah-pah after
      pipe(A1 * 2 ** (bass / 12) * 2, nextNote, beat * 0.8, 0.07, det * 0.5);
      for (let k = 1; k < 3; k++) pipe(A1 * 2 ** ((bass + 12) / 12) * 2, nextNote + k * beat, beat * 0.4, 0.03, det);
    }
    nextNote += beats * beat; noteIdx++;
  }
}
function scheduleHeart() {
  if (dread < 0.18) { nextBeat = Math.max(nextBeat, ac.currentTime + 0.1); return; }
  const interval = 60 / (58 + dread * 92);
  while (nextBeat < ac.currentTime + 0.2) {
    const v = 0.12 + dread * 0.45;
    for (const [off, k] of [[0, 1], [0.17, 0.65]]) {
      const t = nextBeat + off, o = ac.createOscillator(), g = ac.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.16);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * k, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0008, t + 0.2);
      o.connect(g); g.connect(heartGain); o.start(t); o.stop(t + 0.25);
    }
    nextBeat += interval;
  }
}

export const audio = {
  enabled: false,
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) { ensure(); if (ac && ac.state === "suspended") ac.resume(); if (ac) { nextNote = Math.max(nextNote, ac.currentTime + 0.1); nextBeat = Math.max(nextBeat, ac.currentTime + 0.3); } ambOn = true; }
    else if (ac) ac.suspend();
    return this.enabled;
  },
  onEvent(ev) {
    if (!this.enabled || !ac) return;
    switch (ev.type) {
      case "hit": tone(520, 0.12, { vol: 0.12, slide: 1.6 }); tone(330, 0.15, { type: "triangle", vol: 0.1, slide: 0.6, delay: 0.03 }); break; // honk
      case "ding": tone(1320, 0.6, { type: "sine", vol: 0.2 }); break;
      case "hurt": noise(0.25, { vol: 0.35, freq: 300 }); tone(160, 0.3, { type: "sawtooth", vol: 0.15, slide: 0.5 }); break;
      case "grab": tone(880, 0.25, { type: "triangle", vol: 0.08, slide: 0.5 }); tone(1180, 0.18, { type: "triangle", vol: 0.05, slide: 0.6, delay: 0.12 }); break; // giggle
      case "swing": noise(0.08, { vol: 0.12, freq: 2500, q: 2 }); break;
      case "throw": noise(0.12, { vol: 0.1, freq: 1800, q: 3 }); break;
      case "burst": noise(0.4, { vol: 0.4, freq: 900, q: 0.5 }); for (let i = 0; i < 6; i++) noise(0.03, { vol: 0.15, freq: 3000, delay: 0.05 + i * 0.04 }); break;
      case "pickup": tone(660, 0.08, { type: "triangle", vol: 0.12 }); tone(990, 0.12, { type: "triangle", vol: 0.12, delay: 0.07 }); break;
      case "break": noise(0.15, { vol: 0.2, freq: 600 }); tone(200, 0.2, { type: "triangle", vol: 0.08, slide: 0.5 }); break;
      case "spawn": tone(98, 0.8, { type: "sawtooth", vol: 0.12, slide: 0.8 }); tone(147, 0.8, { type: "sawtooth", vol: 0.08, slide: 0.8 }); noise(0.5, { vol: 0.12, freq: 500, q: 0.8, sweep: 0.4 }); break;
      case "cookie": tone(300, 0.5, { type: "sine", vol: 0.15, slide: 0.4 }); break;
      case "splash": noise(0.4, { vol: 0.25, freq: 700, q: 0.7 }); break;
      case "mirror": tone(1500, 0.4, { type: "sine", vol: 0.08, slide: 0.7 }); tone(1510, 0.4, { type: "sine", vol: 0.08, slide: 0.69 }); break;
      case "marked": tone(220, 0.6, { type: "triangle", vol: 0.12, slide: 1.5 }); tone(233, 0.6, { type: "triangle", vol: 0.08, slide: 1.5 }); break;
      case "dash": noise(0.1, { vol: 0.1, freq: 900, q: 1.5 }); break;
      case "exit": [523, 659, 784].forEach((f, i) => tone(f, 0.3, { type: "triangle", vol: 0.12, delay: i * 0.1 })); break;
      case "caught": [392, 370, 349, 330, 311].forEach((f, i) => tone(f, 0.4, { vol: 0.08, delay: i * 0.22 })); break;
      // Arthur's camera: a rising flash-capacitor whine, then the shutter
      case "flashCharge": tone(900, Math.max(0.3, ev.dur || 1), { type: "sine", vol: 0.05, slide: 3.2, attack: 0.2 }); break;
      case "flash": noise(0.05, { vol: 0.3, freq: 3500, q: 2 }); noise(0.04, { vol: 0.25, freq: 2500, q: 2, delay: 0.07 }); tone(120, 0.3, { type: "sine", vol: 0.15, slide: 0.5 }); break;
      case "flashCancel": tone(700, 0.25, { type: "sine", vol: 0.06, slide: 0.3 }); break;
      // the Barker
      case "barkerWindup": tone(80, Math.max(0.3, ev.dur || 0.6), { type: "sawtooth", vol: 0.09, slide: 1.8, attack: 0.1 }); break;
      case "barkerLunge": noise(0.25, { vol: 0.3, freq: 400, q: 0.8, sweep: 3 }); break;
      case "barkerCall": [0, 0.28, 0.5, 0.7].forEach((d, i) => { tone([196, 247, 185, 147][i], 0.26, { type: "sawtooth", vol: 0.12, slide: 0.92, delay: d }); tone([198, 250, 187, 148][i], 0.26, { vol: 0.06, slide: 0.9, delay: d }); }); break;
      case "breaker": noise(0.12, { vol: 0.35, freq: 250, q: 1 }); tone(60, 0.9, { type: "sawtooth", vol: 0.06, attack: 0.1 }); tone(1800, 0.2, { type: "square", vol: 0.04, delay: 0.05, slide: 0.5 }); break;
      case "gateOpen": noise(1.4, { vol: 0.2, freq: 300, q: 4, sweep: 0.5 }); [440, 523, 659, 880].forEach((f, i) => tone(f, 0.5, { type: "triangle", vol: 0.1, delay: 0.6 + i * 0.12 })); break;
      // Jack-in-the-box: music-box notes that speed up, then the spring
      case "jackCrank": { const d = Math.max(0.4, ev.dur || 1), n = 8; let t = 0; for (let i = 0; i < n; i++) { tone([1047, 1175, 1319, 1175, 1047, 1319, 1568, 1397][i], 0.15, { type: "sine", vol: 0.06, delay: t }); t += (d / n) * (1.3 - i / n * 0.6); } break; }
      case "jackSpring": tone(180, 0.45, { type: "triangle", vol: 0.18, slide: 4 }); tone(260, 0.4, { type: "square", vol: 0.05, slide: 3, delay: 0.02 }); break;
      case "chalk": noise(0.18 + Math.random() * 0.1, { vol: 0.05, freq: 5200, q: 6, sweep: 0.8 }); break;
      case "silenceEnter": tone(3800, 0.4, { type: "sine", vol: 0.03, slide: 0.5 }); break;
      case "uiMove": tone(1240, 0.03, { type: "triangle", vol: 0.04 }); break;
      case "uiClick": tone(740, 0.05, { type: "triangle", vol: 0.08 }); tone(1110, 0.05, { type: "triangle", vol: 0.05, delay: 0.04 }); break;
      case "uiBack": tone(520, 0.06, { type: "triangle", vol: 0.06, slide: 0.8 }); break;
    }
  },
  frame(game, dt) {
    if (!this.enabled || !ac || !ambOn) return;
    const now = ac.currentTime;
    silent = !!(game && game.silence);
    dread = game ? game.dread || 0 : 0;
    sanityLoss = game && game.run ? Math.max(0, 1 - game.run.sanity / 100) : 0;
    // crickets: the bugs sing until they don't
    cricketGain.gain.setTargetAtTime(silent || !game ? 0 : 0.12 * (1 - dread * 0.6), now, silent ? 0.03 : 0.4);
    cricketTimer -= dt;
    if (cricketTimer <= 0 && game && !silent) {
      cricketTimer = 0.25 + Math.random() * 0.5;
      const f = 4200 + Math.random() * 600;
      for (let i = 0; i < 3; i++) noise(0.025, { vol: 0.25, freq: f, q: 18, dest: cricketGain, delay: i * 0.05 });
    }
    // calliope: distant in menus, muffled to almost nothing in silence
    callGain.gain.setTargetAtTime(silent ? 0.12 : game ? 0.55 : 0.75, now, silent ? 0.05 : 0.6);
    callFilter.frequency.setTargetAtTime(silent ? 260 : game ? 1500 - dread * 700 : 1900, now, 0.3);
    wobble.frequency.setTargetAtTime(0.3 + dread * 1.2, now, 0.5);
    wobble.amt.gain.setTargetAtTime(10 + dread * 40 + sanityLoss * 30, now, 0.5);
    scheduleCalliope();
    windGain.gain.setTargetAtTime(game ? 0.05 + dread * 0.05 : 0.035, now, 0.8);
    droneGain.gain.setTargetAtTime(dread * 0.07, now, 0.4);
    drone[2].frequency.setTargetAtTime(55 * (1.06 + dread * 0.05), now, 0.5);
    if (game) scheduleHeart(); else nextBeat = now + 0.3;
  },
  stopAmbience() {
    if (!ac) return;
    const now = ac.currentTime;
    for (const g of [cricketGain, droneGain, windGain]) g.gain.setTargetAtTime(0, now, 0.1);
    callGain.gain.setTargetAtTime(0.4, now, 0.4); // the waltz plays on without you
    dread = 0;
  },
};
