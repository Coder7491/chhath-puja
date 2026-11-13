/**
 * Chhath Mahaparv - Interactive Experience Engine
 * Engineered with Devotion by Farji Engineer
 */

// Global State
const state = {
  soundEnabled: true,
  themeMode: 'sandhya', // 'sandhya' (sunset) or 'usha' (sunrise)
  arghyaCount: parseInt(localStorage.getItem('farji_chhath_arghya_count') || '108', 10),
  activeQuizIndex: 0,
  quizScore: 0,
  userAnswers: [],
  diyas: [],
  petals: []
};

// -----------------------------------------------------------------------------
// 1. Web Audio Synthesizer (No external broken audio assets required!)
// -----------------------------------------------------------------------------
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.initialized = false;
  }

  init() {
    if (!this.initialized) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.initialized = true;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Pure Temple Bell (Resonant multi-harmonic brass bell)
  playTempleBell() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [587.33, 880, 1174.66, 1760, 2349.32]; // D5, A5, D6, A6, D7
    const decays = [3.5, 2.8, 2.2, 1.6, 1.2];
    const gains = [0.4, 0.25, 0.18, 0.1, 0.05];

    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      // subtle vibrato
      osc.frequency.exponentialRampToValueAtTime(freq * 0.998, now + decays[i]);

      gain.gain.setValueAtTime(gains[i], now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[i]);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + decays[i]);
    });
  }

  // Holy Shankh (Conch shell deep sacred resonance)
  playShankh() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    // Frequency sweep typical of conch blow
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(293.66, now + 0.6); // Up to D4
    osc.frequency.linearRampToValueAtTime(329.63, now + 1.6); // Up to E4
    osc.frequency.exponentialRampToValueAtTime(220, now + 2.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.linearRampToValueAtTime(800, now + 1.2);
    filter.frequency.exponentialRampToValueAtTime(350, now + 2.8);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.5);
    gain.gain.linearRampToValueAtTime(0.35, now + 2.0);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 2.9);
  }

  // Holy Water / Arghya Pouring Sound
  playWaterStream() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.Q.setValueAtTime(3, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    noise.stop(this.ctx.currentTime + 1.5);
  }

  // Quiz correct chime (Melodic triad)
  playCorrect() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.55);
    });
  }

  // Quiz wrong gentle cue
  playWrong() {
    if (!state.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.3);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.38);
  }
}

const audio = new SoundEngine();

// -----------------------------------------------------------------------------
// 2. River & Floating Diyas Canvas Engine
// -----------------------------------------------------------------------------
function initRiverCanvas() {
  const canvas = document.getElementById('riverCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 220;
  }
  window.addEventListener('resize', resize);
  resize();

  // Seed initial floating diyas
  state.diyas = [
    { x: canvas.width * 0.15, yOffset: 60, speed: 0.35, scale: 0.85, flamePhase: 0, text: "अक्षत & दीप" },
    { x: canvas.width * 0.35, yOffset: 85, speed: 0.28, scale: 1.1, flamePhase: 1.2, text: "छठी मइया" },
    { x: canvas.width * 0.60, yOffset: 70, speed: 0.32, scale: 0.95, flamePhase: 2.5, text: "जय छठी मइया" },
    { x: canvas.width * 0.82, yOffset: 95, speed: 0.22, scale: 1.2, flamePhase: 3.7, text: "शुभ पर्व" }
  ];

  let waveOffset = 0;

  function drawDiya(d, waterY) {
    const y = waterY + Math.sin(waveOffset * 2 + d.flamePhase) * 4;
    const s = d.scale;

    ctx.save();
    ctx.translate(d.x, y);

    // Diya reflection in holy water
    const gradientReflect = ctx.createRadialGradient(0, 15 * s, 2, 0, 15 * s, 35 * s);
    gradientReflect.addColorStop(0, 'rgba(255, 179, 0, 0.45)');
    gradientReflect.addColorStop(0.6, 'rgba(255, 87, 34, 0.2)');
    gradientReflect.addColorStop(1, 'rgba(255, 87, 34, 0)');
    ctx.fillStyle = gradientReflect;
    ctx.beginPath();
    ctx.ellipse(0, 16 * s, 30 * s, 8 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Earthen Diya Clay Body
    ctx.beginPath();
    ctx.fillStyle = '#8b4513';
    ctx.ellipse(0, 0, 22 * s, 10 * s, 0, 0, Math.PI);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#d2691e';
    ctx.stroke();

    // Inner oil reservoir
    ctx.beginPath();
    ctx.fillStyle = '#b8860b';
    ctx.ellipse(0, -1 * s, 18 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flame Flicker
    const flicker = Math.sin(Date.now() * 0.008 + d.flamePhase) * 2;
    const flameH = (22 + flicker) * s;

    // Outer warm flame glow
    const flameGlow = ctx.createRadialGradient(0, -8 * s, 2, 0, -8 * s, 24 * s);
    flameGlow.addColorStop(0, 'rgba(255, 235, 59, 0.9)');
    flameGlow.addColorStop(0.4, 'rgba(255, 152, 0, 0.6)');
    flameGlow.addColorStop(1, 'rgba(244, 67, 54, 0)');
    ctx.fillStyle = flameGlow;
    ctx.beginPath();
    ctx.arc(0, -8 * s, 25 * s, 0, Math.PI * 2);
    ctx.fill();

    // Flame core
    ctx.beginPath();
    ctx.moveTo(-5 * s, -2 * s);
    ctx.quadraticCurveTo(-7 * s, -12 * s, 0, -flameH);
    ctx.quadraticCurveTo(7 * s, -12 * s, 5 * s, -2 * s);
    ctx.closePath();
    const coreGrad = ctx.createLinearGradient(0, -2 * s, 0, -flameH);
    coreGrad.addColorStop(0, '#ff3d00');
    coreGrad.addColorStop(0.4, '#ff9100');
    coreGrad.addColorStop(0.85, '#ffea00');
    coreGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = coreGrad;
    ctx.fill();

    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    waveOffset += 0.025;

    // Draw Multi-layered Ganges River Waves
    const isSandhya = state.themeMode === 'sandhya';
    const waveLayers = [
      {
        y: 65,
        freq: 0.008,
        amp: 10,
        color: isSandhya ? 'rgba(30, 20, 50, 0.6)' : 'rgba(12, 38, 70, 0.6)'
      },
      {
        y: 95,
        freq: 0.012,
        amp: 12,
        color: isSandhya ? 'rgba(74, 20, 40, 0.7)' : 'rgba(16, 52, 92, 0.7)'
      },
      {
        y: 135,
        freq: 0.015,
        amp: 15,
        color: isSandhya ? 'rgba(40, 10, 30, 0.88)' : 'rgba(10, 30, 60, 0.9)'
      }
    ];

    waveLayers.forEach((layer, idx) => {
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      ctx.lineTo(0, layer.y);

      for (let x = 0; x <= canvas.width; x += 10) {
        const y = layer.y + Math.sin(x * layer.freq + waveOffset * (idx + 1)) * layer.amp;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fillStyle = layer.color;
      ctx.fill();

      // Shimmer reflection line on wave crest
      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += 15) {
        const y = layer.y + Math.sin(x * layer.freq + waveOffset * (idx + 1)) * layer.amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = isSandhya ? 'rgba(255, 179, 0, 0.35)' : 'rgba(253, 224, 71, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Sun Reflection on Water Column
    const sunCenterX = canvas.width * 0.5;
    const sunReflection = ctx.createLinearGradient(sunCenterX - 80, 50, sunCenterX + 80, canvas.height);
    sunReflection.addColorStop(0, isSandhya ? 'rgba(255, 111, 0, 0.45)' : 'rgba(255, 235, 59, 0.5)');
    sunReflection.addColorStop(0.5, isSandhya ? 'rgba(249, 115, 22, 0.25)' : 'rgba(254, 240, 138, 0.3)');
    sunReflection.addColorStop(1, 'rgba(255, 111, 0, 0)');
    ctx.fillStyle = sunReflection;
    ctx.fillRect(sunCenterX - 90, 50, 180, canvas.height - 50);

    // Update and draw floating diyas
    state.diyas.forEach(d => {
      d.x += d.speed;
      if (d.x > canvas.width + 50) {
        d.x = -50;
      }
      const waterY = d.yOffset + Math.sin(d.x * 0.01 + waveOffset) * 8;
      drawDiya(d, waterY);
    });

    requestAnimationFrame(render);
  }

  render();

  // Allow users to click and float their own Diya
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    audio.playTempleBell();
    state.diyas.push({
      x: clickX,
      yOffset: Math.max(70, Math.min(clickY, 160)),
      speed: 0.2 + Math.random() * 0.2,
      scale: 0.9 + Math.random() * 0.3,
      flamePhase: Math.random() * Math.PI,
      text: "भक्ति दीप"
    });

    showToast("✨ आपके नाम का पावन दीप गंगा जी में प्रवाहित हो गया!");
  });
}

// -----------------------------------------------------------------------------
// 3. Falling Petals & Holy Sparkles Canvas
// -----------------------------------------------------------------------------
function initPetalsCanvas() {
  const canvas = document.getElementById('petalsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const petalCount = 38;
  const colors = ['#f59e0b', '#fbbf24', '#f97316', '#ea580c', '#fde047'];

  for (let i = 0; i < petalCount; i++) {
    state.petals.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 4 + Math.random() * 7,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: -0.5 + Math.random() * 1.2,
      vy: 1 + Math.random() * 2,
      angle: Math.random() * 360,
      vAngle: -1.5 + Math.random() * 3,
      tumble: Math.random() * Math.PI,
      vTumble: 0.02 + Math.random() * 0.04
    });
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    state.petals.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.vAngle;
      p.tumble += p.vTumble;

      if (p.y > canvas.height + 20) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
      }
      if (p.x > canvas.width + 20) p.x = -20;
      if (p.x < -20) p.x = canvas.width + 20;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.angle * Math.PI) / 180);
      const scaleY = Math.cos(p.tumble);
      ctx.scale(1, scaleY);

      // Draw Genda Phool Petal
      ctx.beginPath();
      ctx.ellipse(0, 0, p.radius, p.radius * 1.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fill();

      // Petal center ridge
      ctx.beginPath();
      ctx.moveTo(0, -p.radius * 1.4);
      ctx.lineTo(0, p.radius * 1.4);
      ctx.strokeStyle = 'rgba(180, 83, 9, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    });

    requestAnimationFrame(render);
  }

  render();
}

// -----------------------------------------------------------------------------
// 4. Interactive Arghya Simulator
// -----------------------------------------------------------------------------
function triggerArghya() {
  audio.playShankh();
  audio.playWaterStream();
  setTimeout(() => audio.playTempleBell(), 600);

  state.arghyaCount += 1;
  localStorage.setItem('farji_chhath_arghya_count', state.arghyaCount);

  // Update UI counter
  const counterEl = document.getElementById('arghyaCounter');
  if (counterEl) {
    counterEl.innerText = state.arghyaCount.toLocaleString('en-IN');
    counterEl.classList.add('scale-125', 'text-yellow-300');
    setTimeout(() => counterEl.classList.remove('scale-125', 'text-yellow-300'), 600);
  }

  // Animate the Kalash & Stream
  const kalash = document.getElementById('brassKalash');
  const stream = document.getElementById('arghyaStream');
  const sunCore = document.querySelector('.sun-core');

  if (kalash) {
    kalash.classList.add('rotate-[-35deg]', 'translate-y-2');
    setTimeout(() => kalash.classList.remove('rotate-[-35deg]', 'translate-y-2'), 1800);
  }

  if (stream) {
    stream.style.height = '140px';
    stream.style.opacity = '1';
    setTimeout(() => {
      stream.style.height = '0px';
      stream.style.opacity = '0';
    }, 1600);
  }

  if (sunCore) {
    sunCore.style.transform = 'scale(1.25)';
    sunCore.style.boxShadow = '0 0 80px #fff, 0 0 150px #ffb300, 0 0 220px #ff6f00';
    setTimeout(() => {
      sunCore.style.transform = '';
      sunCore.style.boxShadow = '';
    }, 1800);
  }

  // Add floating diya right in front of ghat
  const canvas = document.getElementById('riverCanvas');
  if (canvas) {
    state.diyas.push({
      x: canvas.width * 0.48,
      yOffset: 65,
      speed: 0.15,
      scale: 1.15,
      flamePhase: Math.random() * Math.PI,
      text: "अर्घ्य समर्पण"
    });
  }

  // Blessings notification
  const blessings = [
    "ॐ सूर्याय नमः! भगवान सूर्य आपको आरोग्य, तेज और यशस्वी जीवन प्रदान करें!",
    "छठी मइया आपके घर-परिवार में सुख, शांति, समृद्धि और अखंड आनंद भर दें!",
    "अर्घ्य स्वीकार हुआ! सूर्य देव की असीम ऊर्जा से आपका संपूर्ण जीवन आलोकित हो!",
    "Farji Engineer Alert: Blessings compiled with 0 errors and infinite good karma!"
  ];
  const msg = blessings[Math.floor(Math.random() * blessings.length)];
  showToast(msg);
}

// -----------------------------------------------------------------------------
// 5. Farji Engineer's Thekua & Prasad Calculator
// -----------------------------------------------------------------------------
function calculateThekua() {
  const relatives = parseInt(document.getElementById('inputRelatives').value || '10', 10);
  const hostelFriends = parseInt(document.getElementById('inputHostel').value || '8', 10);
  const officeColleagues = parseInt(document.getElementById('inputOffice').value || '12', 10);
  const cravingLevel = parseFloat(document.getElementById('selectCraving').value || '1.5');

  // Algorithm by Farji Engineer
  // Relatives get 4 each, hostel friends inhale 8 each, colleagues get 3 each
  const baseCount = (relatives * 4) + (hostelFriends * 8) + (officeColleagues * 3) + 20; // +20 buffer for personal midnight cravings
  const totalThekuas = Math.round(baseCount * cravingLevel);

  // Each Thekua avg weight ~ 35g
  // Ratio: 50% Wheat flour (Atta), 30% Desi Ghee (kneading + frying), 25% Jaggery/Gur, spices 5%
  const totalWeightKg = (totalThekuas * 0.038);
  const attaKg = (totalWeightKg * 0.52).toFixed(1);
  const gheeKg = (totalWeightKg * 0.32).toFixed(1);
  const gurKg = (totalWeightKg * 0.28).toFixed(1);
  const boxes = Math.ceil(totalThekuas / 25);

  document.getElementById('resultThekuaCount').innerText = `${totalThekuas} पीस`;
  document.getElementById('resultAtta').innerText = `${attaKg} kg`;
  document.getElementById('resultGhee').innerText = `${gheeKg} kg (शुद्ध देसी घी)`;
  document.getElementById('resultGur').innerText = `${gurKg} kg (देसी गुड़)`;
  document.getElementById('resultBoxes').innerText = `${boxes} डिब्बे (Air-tight Dabba)`;

  // Fun Farji Engineer tips
  const tips = [
    "Engineering Warning: Hostel doston ke saamne dabba mat kholna, 90 seconds mein heap overflow ho jayega!",
    "Ghee Optimization: Sancha par halka ghee lagane se Thekua release time 40% optimize ho jata hai.",
    "Data Packet Protocol: Train mein bag par 'Fragile: Holy Thekua' ka sticker lagayein, TC bhi prasad maang lega!",
    "Hostel Jugaad: 1 box almirah ke secret shelf me chhupa kar rakhein for emergency 2 AM cravings."
  ];
  document.getElementById('resultEngineeringTip').innerText = tips[Math.floor(Math.random() * tips.length)];

  const resDiv = document.getElementById('thekuaResults');
  if (resDiv) {
    resDiv.classList.remove('hidden');
    resDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  audio.playCorrect();
}

// -----------------------------------------------------------------------------
// 6. Chhath Mahaparv Quiz Engine (10 Deep Cultural Questions + Farji Wit)
// -----------------------------------------------------------------------------
const quizQuestions = [
  {
    q: "छठ महापर्व की वह कौन सी अद्भुत और अद्वितीय विशेषता है जो इसे दुनिया के अन्य सभी त्योहारों से अलग बनाती है?",
    options: [
      "इसमें सबसे पहले डूबते हुए सूर्य (Sandhya Arghya) को अर्घ्य दिया जाता है",
      "इसमें किसी पुरोहित या पंडित की मध्यस्थता की आवश्यकता नहीं होती",
      "यह पूर्णतः प्रकृति, स्वच्छता और समानता का महापर्व है",
      "उपर्युक्त सभी (All of the above)"
    ],
    correct: 3,
    explanation: "छठ पर्व की सबसे महान विशेषता यह है कि यह डूबते सूर्य (अस्तगामी) को भी पहले नमन करता है, प्रकृति की सादगी पर आधारित है और इसमें समाज के सभी वर्ग बिना किसी भेद या पुरोहित के स्वयं आराधना करते हैं।"
  },
  {
    q: "छठ महापर्व के दूसरे दिन 'खरना' (Kharna) पर मुख्य रूप से कौन सा पवित्र प्रसाद शुद्ध मिट्टी के चूल्हे पर बनता है?",
    options: [
      "गुड़ की खीर (रसियाव) और घी चुपड़ी रोटी",
      "सूजी का हलवा और पूरी",
      "चने का दाल और कद्दू भात",
      "बेसन के लड्डू और मालपुआ"
    ],
    correct: 0,
    explanation: "खरना की शाम व्रती आम की लकड़ी और मिट्टी के चूल्हे पर गुड़ की बनी शुद्ध खीर (रसियाव) व दोहरी रोटी बनाकर सूर्यदेव को भोग लगाते हैं, जिसके बाद उनका 36 घंटे का निर्जला व्रत शुरू होता है।"
  },
  {
    q: "छठ के महाप्रसाद 'ठेकुआ' (Thekua) पर पारंपरिक डिजाइन और छाप उकेरने वाले लकड़ी के पारंपरिक सांचे को क्या कहा जाता है?",
    options: [
      "सांचा (Sancha / Thekua Thappa)",
      "चक्रव्यूह बोर्ड",
      "प्रसाद कटर 3000",
      "लकड़ी का बेलन"
    ],
    correct: 0,
    explanation: "शीशम या सागवान की लकड़ी पर कारीगरी से उकेरे गए 'सांचे' (Sancha) पर लोई दबाकर पारंपरिक पत्ती, पुष्प और ज्यामितीय डिजाइन बनाई जाती है।"
  },
  {
    q: "महाभारत कालीन किस सूर्यपुत्र दानवीर ने अंग देश (वर्तमान मुंगेर/भागलपुर, बिहार) में जल में खड़े होकर सूर्य अर्घ्य देने की परंपरा स्थापित की थी?",
    options: [
      "दानवीर कर्ण (Suryaputra Karna)",
      "गांडीवधारी अर्जुन",
      "भीष्म पितामह",
      "युधिष्ठिर"
    ],
    correct: 0,
    explanation: "अंगराज कर्ण प्रतिदिन घंटों गंगाजल में खड़े होकर भगवान भास्कर को अर्घ्य अर्पित करते थे और तत्पश्चात याचकों को दान देते थे। यह स्थल आज भी मुंगेर के कर्णचौरा पर प्रसिद्ध है।"
  },
  {
    q: "छठ व्रत में व्रती महिलाएं नाक से लेकर मांग के शिखर तक जो गाढ़ा पीला/नारंगी सिंदूर लगाती हैं, वह किस बात का प्रतीक है?",
    options: [
      "पति की दीर्घायु, अखंड सौभाग्य और सूर्य के तेज का प्रतीक",
      "फैशन और पारंपरिक मेक-अप",
      "केवल फोटो खिंचवाने का फिल्टर",
      "नदी के ठंडे जल से बचने की तकनीक"
    ],
    correct: 0,
    explanation: "यह नारंगी सिंदूर सूर्य की प्रथम किरणों और अखंड सौभाग्य का प्रतीक है। मान्यता है कि नाक से मांग तक लंबा सिंदूर लगाने से परिवार में यश, आरोग्य और पति की लंबी आयु होती है।"
  },
  {
    q: "छठ महापर्व में 'नहाय-खाय' (Nahay-Khay) के दिन किस विशेष सात्विक सब्जी को खाने की सदियों पुरानी परंपरा है?",
    options: [
      "कद्दू / लौकी (Lauki-Bhat with Chana Dal)",
      "पनीर बटर मसाला",
      "आलू गोभी रोस्ट",
      "भिंडी मसाला"
    ],
    correct: 0,
    explanation: "कद्दू (लौकी) अत्यंत सुपाच्य, शीतल और जल तत्व से परिपूर्ण होता है। सेंधा नमक और पीतल के पात्र में बने कद्दू-भात से शरीर शुद्ध होकर आगामी कठोर उपवास के लिए तैयार होता है।"
  },
  {
    q: "छठ महापर्व के दौरान व्रती कितने समय का अनवरत 'निर्जला' (बिना जल-अन्न के) कठोर तपस्या व्रत रखते हैं?",
    options: [
      "लगभग 36 घंटे (Kharna शाम से Usha Arghya तक)",
      "12 घंटे",
      "24 घंटे",
      "48 घंटे"
    ],
    correct: 0,
    explanation: "खरना का प्रसाद ग्रहण करने के उपरांत से लेकर चौथे दिन सुबह उषा अर्घ्य और पारण तक लगभग 36 घंटे व्रती एक बूंद जल भी ग्रहण नहीं करते, जो उनकी असीम श्रद्धा और आत्मबल का प्रमाण है।"
  },
  {
    q: "छठ घाट पर सूप और दउरा (Bamboo Basket) रखने के लिए गन्ने के 5 या 7 पौधों से जो पवित्र छत्र बनाया जाता है, उसे क्या कहते हैं?",
    options: [
      "कोसी / कोसी भराई (Kosi Mandap)",
      "बांस का टेंट",
      "गन्ना कैनोपी",
      "सूर्य छाता"
    ],
    correct: 0,
    explanation: "मन्नत पूरी होने पर गन्ने के हरे पौधों को बांधकर सुंदर मंडप बनाया जाता है, जिसके नीचे मिट्टी के 24 या 36 दीपों से 'कोसी' भरी जाती है। रात भर जागकर छठी मइया के गीत गाए जाते हैं।"
  },
  {
    q: "किस अमर लोकगायिका (पद्म भूषण) की मखमली आवाज के बिना हर बिहारी और पूर्वांचली के लिए छठ का उत्सव अधूरा माना जाता है?",
    options: [
      "शारदा सिन्हा (Sharda Sinha - बिहार कोकिला)",
      "लता मंगेशकर",
      "अनुराधा पौडवाल",
      "श्रेया घोषाल"
    ],
    correct: 0,
    explanation: "स्व. शारदा सिन्हा जी (बिहार कोकिला) के गीत 'केलवा के पात पर', 'कांच ही बांस के बहंगिया' छठ महापर्व की आत्मा हैं। उनकी दिव्य आवाज हर घाट और घर को भक्तिमय बना देती है।"
  },
  {
    q: "Farji Engineer Special: अगर एक सूप में 21 ठेकुआ, 5 फल और 1 नारियल रखा है, तो दउरा ले जाते समय सिर पर कितना बैलेंस एंगल होना चाहिए?",
    options: [
      "0° Tilt (Absolute Devotion & Perfect Center of Gravity)",
      "45° Angular Velocity",
      "PID Controller failure",
      "Random Walk Algorithm"
    ],
    correct: 0,
    explanation: "Farji Engineer says: जब सिर पर छठी मइया का दउरा हो, तो गुरुत्वाकर्षण भी नतमस्तक हो जाता है! 0° टिल्ट और 100% भक्ति से दउरा सीधे घाट पहुंचता है बिना एक भी फल हिले!"
  }
];

function initQuiz() {
  state.activeQuizIndex = 0;
  state.quizScore = 0;
  state.userAnswers = [];
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const container = document.getElementById('quizContainer');
  const resultBox = document.getElementById('quizResults');
  if (!container) return;

  resultBox.classList.add('hidden');
  container.classList.remove('hidden');

  const q = quizQuestions[state.activeQuizIndex];
  const progressPercent = ((state.activeQuizIndex + 1) / quizQuestions.length) * 100;

  let html = `
    <div class="mb-6">
      <div class="flex justify-between items-center text-sm mb-2 text-amber-200">
        <span class="font-bold flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-amber-500/30 flex items-center justify-center text-amber-400 font-code text-xs">
            ${state.activeQuizIndex + 1}
          </span>
          Question ${state.activeQuizIndex + 1} of ${quizQuestions.length}
        </span>
        <span class="font-code text-xs text-amber-400/80">Score: ${state.quizScore} pts</span>
      </div>
      <div class="w-full bg-amber-950/50 rounded-full h-2.5 overflow-hidden border border-amber-500/20">
        <div class="bg-gradient-to-r from-amber-500 to-orange-500 h-2.5 rounded-full transition-all duration-500" style="width: ${progressPercent}%"></div>
      </div>
    </div>

    <h3 class="text-xl md:text-2xl font-bold text-amber-100 mb-6 leading-relaxed">
      ${q.q}
    </h3>

    <div class="space-y-3 mb-6" id="quizOptions">
      ${q.options.map((opt, i) => `
        <button onclick="handleQuizAnswer(${i})" class="w-full text-left p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 hover:bg-amber-900/40 hover:border-amber-400 transition-all duration-200 flex items-start gap-3 group">
          <span class="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-sm shrink-0 group-hover:bg-amber-500 group-hover:text-amber-950 transition-colors">
            ${String.fromCharCode(65 + i)}
          </span>
          <span class="text-stone-200 text-base leading-relaxed group-hover:text-white">${opt}</span>
        </button>
      `).join('')}
    </div>

    <div id="quizFeedback" class="hidden p-4 rounded-xl mb-4 border text-sm"></div>

    <div id="quizNextBtnContainer" class="hidden text-right">
      <button onclick="nextQuizQuestion()" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 ml-auto">
        Next Question →
      </button>
    </div>
  `;

  container.innerHTML = html;
}

function handleQuizAnswer(selectedIndex) {
  const q = quizQuestions[state.activeQuizIndex];
  const optionButtons = document.querySelectorAll('#quizOptions button');
  optionButtons.forEach(btn => btn.disabled = true);

  const feedback = document.getElementById('quizFeedback');
  const nextContainer = document.getElementById('quizNextBtnContainer');
  const isCorrect = selectedIndex === q.correct;

  if (isCorrect) {
    state.quizScore += 1;
    audio.playCorrect();
    optionButtons[selectedIndex].classList.remove('bg-amber-950/20', 'border-amber-500/30');
    optionButtons[selectedIndex].classList.add('bg-emerald-950/50', 'border-emerald-400', 'text-emerald-200');

    feedback.className = 'p-4 rounded-xl mb-4 border border-emerald-500/40 bg-emerald-950/40 text-emerald-100 flex items-start gap-3';
    feedback.innerHTML = `
      <span class="text-2xl shrink-0">✅</span>
      <div>
        <div class="font-bold text-emerald-300 mb-1">अति उत्तम! बिलकुल सही जवाब!</div>
        <div class="text-emerald-100/90 text-sm">${q.explanation}</div>
      </div>
    `;
  } else {
    audio.playWrong();
    optionButtons[selectedIndex].classList.remove('bg-amber-950/20', 'border-amber-500/30');
    optionButtons[selectedIndex].classList.add('bg-rose-950/50', 'border-rose-500', 'text-rose-200');

    optionButtons[q.correct].classList.remove('bg-amber-950/20', 'border-amber-500/30');
    optionButtons[q.correct].classList.add('bg-emerald-950/50', 'border-emerald-400', 'text-emerald-200');

    feedback.className = 'p-4 rounded-xl mb-4 border border-amber-500/40 bg-amber-950/40 text-amber-100 flex items-start gap-3';
    feedback.innerHTML = `
      <span class="text-2xl shrink-0">💡</span>
      <div>
        <div class="font-bold text-amber-300 mb-1">सही उत्तर था: विकल्प ${String.fromCharCode(65 + q.correct)}</div>
        <div class="text-stone-300 text-sm">${q.explanation}</div>
      </div>
    `;
  }

  feedback.classList.remove('hidden');
  nextContainer.classList.remove('hidden');
}

function nextQuizQuestion() {
  state.activeQuizIndex += 1;
  if (state.activeQuizIndex < quizQuestions.length) {
    renderQuizQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  const container = document.getElementById('quizContainer');
  const resultBox = document.getElementById('quizResults');
  container.classList.add('hidden');
  resultBox.classList.remove('hidden');

  const score = state.quizScore;
  const total = quizQuestions.length;
  let title = "";
  let badgeColor = "";
  let message = "";

  if (score === 10) {
    title = "🏆 Param Chhath Engineer & Daura Commander";
    badgeColor = "from-amber-400 to-yellow-500 text-stone-950";
    message = "अद्भूत! आपका छठ ज्ञान 100% शुद्ध देसी घी के ठेकुआ जैसा खरा है! छठी मइया की असीम कृपा आप पर बनी रहे।";
    triggerConfetti();
  } else if (score >= 8) {
    title = "🌟 Senior Thekua Architect";
    badgeColor = "from-amber-500 to-orange-500 text-stone-950";
    message = "शानदार! आपने छठ परंपरा और वैज्ञानिक महत्व को गहराई से समझा है!";
    triggerConfetti();
  } else if (score >= 6) {
    title = "🎖️ Certified Ghat Volunteer";
    badgeColor = "from-orange-500 to-rose-500 text-white";
    message = "बहुत अच्छा प्रयास! आप छठ पर्व की मूल भावना और श्रद्धा से भलीभांति परिचित हैं।";
  } else {
    title = "🎒 Junior Prasad Intern";
    badgeColor = "from-amber-700 to-amber-900 text-amber-100";
    message = "कोई बात नहीं! शारदा सिन्हा जी के गीत सुनें और ठेकुआ खाते हुए ज्ञान में वृद्धि करें!";
  }

  document.getElementById('finalScoreText').innerText = `${score} / ${total}`;
  document.getElementById('finalBadge').className = `inline-block px-4 py-1.5 rounded-full font-bold text-sm bg-gradient-to-r ${badgeColor} shadow-md`;
  document.getElementById('finalBadge').innerText = title;
  document.getElementById('finalMessage').innerText = message;
}

// -----------------------------------------------------------------------------
// 7. Confetti Celebration
// -----------------------------------------------------------------------------
function triggerConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const confettiPieces = [];
  const colors = ['#f59e0b', '#fbbf24', '#f97316', '#ef4444', '#10b981', '#3b82f6', '#ec4899'];

  for (let i = 0; i < 140; i++) {
    confettiPieces.push({
      x: canvas.width / 2,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 16,
      vy: -8 - Math.random() * 12,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 15,
      gravity: 0.35
    });
  }

  let frames = 0;
  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confettiPieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.vRotation;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      ctx.restore();
    });

    frames++;
    if (frames < 220) {
      requestAnimationFrame(update);
    } else {
      canvas.remove();
    }
  }
  update();
}

// -----------------------------------------------------------------------------
// 8. Certificate Generator Modal
// -----------------------------------------------------------------------------
function openCertificateModal() {
  const modal = document.getElementById('certModal');
  if (modal) modal.classList.remove('hidden');
  updateCertificatePreview();
}

function closeCertificateModal() {
  const modal = document.getElementById('certModal');
  if (modal) modal.classList.add('hidden');
}

function updateCertificatePreview() {
  const nameInput = document.getElementById('certUserName');
  const name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : "परम छठ भक्त";
  
  const score = state.quizScore;
  let title = "Certified Thekua Engineer";
  if (score === 10) title = "Param Chhath Mahaparv Acharya";
  else if (score >= 8) title = "Senior Thekua Architect";
  else if (score >= 6) title = "Certified Ghat Volunteer";

  const certNameEl = document.getElementById('renderedCertName');
  const certTitleEl = document.getElementById('renderedCertTitle');
  const certDateEl = document.getElementById('renderedCertDate');

  if (certNameEl) certNameEl.innerText = name;
  if (certTitleEl) certTitleEl.innerText = title;
  if (certDateEl) {
    const today = new Date().toLocaleDateString('hi-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    certDateEl.innerText = `प्रमाणित दिनांक: ${today}`;
  }
}

function printCertificate() {
  const printContent = document.getElementById('printableCertificateArea');
  if (!printContent) return;

  const originalContents = document.body.innerHTML;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Chhath Mahaparv Certificate - Farji Engineer</title>
        <link href="https://cdn.tailwindcss.com" rel="stylesheet">
        <link href="styles.css" rel="stylesheet">
        <style>
          body { background: white; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
          .certificate-frame { width: 850px; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
        <script>window.onload = function() { window.print(); window.close(); }<\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// -----------------------------------------------------------------------------
// 9. Soop Samagri Detail Modal
// -----------------------------------------------------------------------------
const soopData = {
  thekua: {
    title: "ठेकुआ (Thekua) - The Sacred Crown Jewel",
    subtitle: "गेहूं का आटा, शुद्ध देसी घी, गुड़ व सौंफ का दिव्य संगम",
    desc: "ठेकुआ छठ महापर्व का सबसे पावन और मुख्य महाप्रसाद है। इसे केवल नए गेहूं के आटे, देसी घी और गुड़ अथवा चीनी में गूंथकर लकड़ी के पारंपरिक सांचे पर उकेरा जाता है और घी में धीमी आंच पर तला जाता है। इसकी पवित्रता इतनी कठोर होती है कि इसे बनाते समय कोई भी व्यक्ति बिना शुद्ध स्नान के इसे स्पर्श नहीं कर सकता।",
    specs: [
      { label: "Engineering Grade", val: "100% Zero-Defect Pure Ghee Payload" },
      { label: "Shelf Life", val: "30+ Days (Naturally Preserved)" },
      { label: "Cultural Factor", val: "The pride and emotion of Bihar & Purvanchal" },
      { label: "Farji Spec", val: "Tensile Strength: Perfect crunch without breaking!" }
    ]
  },
  sugarcane: {
    title: "ईख / गन्ना (Sugarcane with Roots & Leaves)",
    subtitle: "समृद्धि और प्रकृति की मिठास का प्रतीक",
    desc: "हरे पत्तों वाला साबुत गन्ना सूर्यदेव और प्रकृति की उपज का आभार व्यक्त करने के लिए सूप में रखा जाता है। इसके 5 या 7 पौधों को एक साथ बांधकर छठ घाट पर कोसी का दिव्य मंडप बनाया जाता है, जिसके नीचे रात भर दीपक जलाकर आराधना की जाती है।",
    specs: [
      { label: "Significance", val: "कृषि और प्रकृति के प्रति अटूट कृतज्ञता" },
      { label: "Structure", val: "Acts as Sacred Canopy (Kosi Mandap) at Ghat" },
      { label: "Nutrient", val: "Natural electrolyte & high energy source" }
    ]
  },
  coconut: {
    title: "श्रीफल / नारियल (Sacred Coconut)",
    subtitle: "अहंकार विसर्जन और पूर्ण समर्पण का प्रतीक",
    desc: "नारियल का बाहरी कठोर आवरण व्यक्ति के कठोर अहंकार का प्रतीक है और भीतर का निर्मल जल व श्वेत गिरी आत्मा की पावनता का। जल में खड़े होकर सूर्यदेव को श्रीफल अर्पित करना स्वयं को ईश्वर के चरणों में समर्पित करने का द्योतक है।",
    specs: [
      { label: "Spiritual Level", val: "Highest Divine Offering (Shreephal)" },
      { label: "Purity Index", val: "Untouched inside water reservoir" }
    ]
  },
  pomelo: {
    title: "डाभ / गागर नींबू (Pomelo Citrus)",
    subtitle: "आयुर्वेद और मौसमी स्वास्थ्य का वरदान",
    desc: "छठ के सूप में बड़ा गागर नींबू अनिवार्य रूप से रखा जाता है। बदलते मौसम और शीत ऋतु के आगमन पर यह विटामिन सी, एंटीऑक्सीडेंट और रोग प्रतिरोधक क्षमता का असीम स्रोत होता है।",
    specs: [
      { label: "Ayurvedic Property", val: "Immunity Booster & Pitta Pacifier" },
      { label: "Seasonality", val: "Winter Solstice Harvest Offering" }
    ]
  },
  kasar: {
    title: "कसार (Kasar / Rice Laddu)",
    subtitle: "कुटे हुए नए चावल के आटे और गुड़ के पावन लड्डू",
    desc: "नए धान के चावल को सुखाकर, ओखली में कूटकर, उसमें गुड़ का पाक और सौंफ मिलाकर कसार के छोटे-छोटे दिव्य लड्डू बनाए जाते हैं। यह नई फसल के प्रथम भोग का प्रतीक है।",
    specs: [
      { label: "Composition", val: "Freshly harvested rice flour + Desi Gur" },
      { label: "Digestibility", val: "Instant energy after 36-hr fast" }
    ]
  },
  haldi: {
    title: "कच्ची हल्दी व अदरक का पौधा (Green Turmeric & Ginger)",
    subtitle: "आरोग्य, दीर्घायु और प्राकृतिक औषधि का अर्पण",
    desc: "छठ केवल एक धार्मिक अनुष्ठान नहीं बल्कि संपूर्ण स्वास्थ्य विज्ञान है। हरे पत्तों सहित कच्ची हल्दी और अदरक को सूप में अर्पित किया जाता है, जो शरीर के संपूर्ण विषैले तत्वों को दूर कर नई ऊर्जा का संचार करते हैं।",
    specs: [
      { label: "Healing Power", val: "Anti-inflammatory, Curcumin loaded" },
      { label: "Symbolism", val: "शुभता और रोगमुक्त जीवन का आशीर्वाद" }
    ]
  }
};

function openSoopModal(key) {
  const data = soopData[key];
  if (!data) return;

  const modal = document.getElementById('soopModal');
  const title = document.getElementById('soopModalTitle');
  const subtitle = document.getElementById('soopModalSubtitle');
  const desc = document.getElementById('soopModalDesc');
  const specs = document.getElementById('soopModalSpecs');

  if (title) title.innerText = data.title;
  if (subtitle) subtitle.innerText = data.subtitle;
  if (desc) desc.innerText = data.desc;

  if (specs) {
    specs.innerHTML = data.specs.map(s => `
      <div class="bg-amber-950/40 p-3 rounded-xl border border-amber-500/20">
        <div class="text-xs text-amber-400 font-semibold uppercase tracking-wider">${s.label}</div>
        <div class="text-stone-200 font-medium text-sm mt-0.5">${s.val}</div>
      </div>
    `).join('');
  }

  audio.playTempleBell();
  if (modal) modal.classList.remove('hidden');
}

function closeSoopModal() {
  const modal = document.getElementById('soopModal');
  if (modal) modal.classList.add('hidden');
}

// -----------------------------------------------------------------------------
// 10. Theme Mode (Sandhya Arghya Sunset vs Usha Arghya Sunrise)
// -----------------------------------------------------------------------------
function toggleThemeMode() {
  state.themeMode = state.themeMode === 'sandhya' ? 'usha' : 'sandhya';
  const isSandhya = state.themeMode === 'sandhya';

  const btn = document.getElementById('themeToggleBtn');
  const heroBadge = document.getElementById('heroThemeBadge');

  if (isSandhya) {
    if (btn) btn.innerHTML = `🌅 Sandhya Mode (अस्तगामी सूर्य)`;
    if (heroBadge) heroBadge.innerHTML = `✨ संध्या अर्घ्य - डूबते सूर्य को नमन`;
    document.body.style.backgroundImage = `
      radial-gradient(circle at 50% 0%, rgba(255, 111, 0, 0.22), transparent 60%),
      radial-gradient(circle at 100% 50%, rgba(183, 28, 28, 0.15), transparent 50%),
      radial-gradient(circle at 0% 80%, rgba(255, 179, 0, 0.1), transparent 40%)
    `;
    showToast("🌅 संध्या अर्घ्य मोड सक्रिय: अस्ताचलगामी सूर्य को अर्घ्य!");
  } else {
    if (btn) btn.innerHTML = `🌄 Usha Mode (उदित सूर्य)`;
    if (heroBadge) heroBadge.innerHTML = `✨ उषा अर्घ्य - उदयगामी सूर्य का स्वागत`;
    document.body.style.backgroundImage = `
      radial-gradient(circle at 50% 0%, rgba(253, 224, 71, 0.25), transparent 60%),
      radial-gradient(circle at 100% 50%, rgba(251, 146, 60, 0.18), transparent 50%),
      radial-gradient(circle at 0% 80%, rgba(56, 189, 248, 0.12), transparent 40%)
    `;
    showToast("🌄 उषा अर्घ्य मोड सक्रिय: उदयगामी सूर्य का पावन स्वागत!");
  }

  audio.playTempleBell();
}

// Sound toggle
function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  const btn = document.getElementById('soundToggleBtn');
  if (btn) {
    btn.innerHTML = state.soundEnabled 
      ? `🔔 <span class="hidden sm:inline">Sound: ON</span>` 
      : `🔕 <span class="hidden sm:inline">Sound: OFF</span>`;
  }
  if (state.soundEnabled) audio.playTempleBell();
}

// Toast helper
function showToast(msg) {
  let toast = document.getElementById('farjiToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'farjiToast';
    toast.className = 'fixed bottom-6 right-6 z-50 glass-panel-glow px-5 py-3.5 rounded-2xl text-amber-200 text-sm font-medium shadow-2xl flex items-center gap-3 transform translate-y-20 opacity-0 transition-all duration-300 border border-amber-400/40';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span class="text-xl">🪔</span> <span>${msg}</span>`;
  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 4000);
}

// Share feature
function shareWebsite() {
  if (navigator.share) {
    navigator.share({
      title: "छठ महापर्व | Engineered with Devotion by Farji Engineer",
      text: "छठ महापर्व की पावन शुभकामनाएं! वर्चुअल घाट पर अर्घ्य दें, ठेकुआ कैलकुलेटर चलाएं और छठ क्विज खेलें!",
      url: window.location.href
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href);
    showToast("🔗 लिंक कॉपी हो गया! दोस्तों व परिवार के साथ साझा करें।");
  }
}

// -----------------------------------------------------------------------------
// 11. Initializer
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initRiverCanvas();
  initPetalsCanvas();
  initQuiz();
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  // Set initial counter
  const counterEl = document.getElementById('arghyaCounter');
  if (counterEl) {
    counterEl.innerText = state.arghyaCount.toLocaleString('en-IN');
  }

  // Pre-load audio context on first user click anywhere
  const unlockAudio = () => {
    audio.init();
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
  };
  document.addEventListener('click', unlockAudio);
  document.addEventListener('keydown', unlockAudio);
});
