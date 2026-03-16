let _ctx = null;

function ac() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

// Sharp metallic ping — my shot hits
export function playHit() {
  try {
    const a = ac(), t = a.currentTime;
    const osc = a.createOscillator(), g = a.createGain();
    osc.connect(g); g.connect(a.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.14);
    g.gain.setValueAtTime(0.38, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.start(t); osc.stop(t + 0.18);
  } catch {}
}

// Water splash — my shot misses
export function playMiss() {
  try {
    const a = ac(), t = a.currentTime;
    const len = Math.floor(a.sampleRate * 0.22);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.8);
    const src = a.createBufferSource(); src.buffer = buf;
    const filt = a.createBiquadFilter();
    filt.type = 'bandpass'; filt.frequency.value = 380; filt.Q.value = 0.7;
    const g = a.createGain(); g.gain.setValueAtTime(0.2, t);
    src.connect(filt); filt.connect(g); g.connect(a.destination);
    src.start(t);
  } catch {}
}

// Deep explosion — ship sunk
export function playSunk() {
  try {
    const a = ac(), t = a.currentTime;
    // Noise burst
    const len = Math.floor(a.sampleRate * 0.5);
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 0.55);
    const src = a.createBufferSource(); src.buffer = buf;
    const filt = a.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 180;
    const g = a.createGain(); g.gain.setValueAtTime(0.55, t);
    src.connect(filt); filt.connect(g); g.connect(a.destination);
    src.start(t);
    // Low rumble oscillator
    const osc = a.createOscillator(), og = a.createGain();
    osc.connect(og); og.connect(a.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(75, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.5);
    og.gain.setValueAtTime(0.45, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.start(t); osc.stop(t + 0.5);
  } catch {}
}

// Alert thud — opponent hits me
export function playIncoming() {
  try {
    const a = ac(), t = a.currentTime;
    const osc = a.createOscillator(), g = a.createGain();
    osc.connect(g); g.connect(a.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.setValueAtTime(190, t + 0.05);
    osc.frequency.setValueAtTime(240, t + 0.1);
    g.gain.setValueAtTime(0.14, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.start(t); osc.stop(t + 0.2);
  } catch {}
}
