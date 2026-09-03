/**
 * 2026 Retro 8-Bit Gamified Portfolio - Sara Dhoundiyal
 * Interactive Audio Synthesizer, 3DS Controller, 3D Cover-Flow & Easter Eggs
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. 8-BIT WEB AUDIO API SYNTHESIZER (No external audio files needed!)
  // ==========================================================================
  let audioCtx = null;
  let sfxEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    // Hide audio notice banner on first user interaction
    const audioNotice = document.getElementById('audioNotice');
    if (audioNotice) {
      audioNotice.classList.add('hidden');
    }
  }

  // Play short 8-bit square wave blip
  function playBleep(freq = 440, duration = 0.08, type = 'square') {
    if (!sfxEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio synthesis error:', e);
    }
  }

  // Play classic Super Mario-style two-tone coin sound
  function playCoin() {
    if (!sfxEnabled || !audioCtx) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.setValueAtTime(0.15, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn(e);
    }
  }

  // Play ascending power-up chime
  function playPowerUp() {
    if (!sfxEnabled || !audioCtx) return;
    try {
      const notes = [330, 392, 523.25, 587.33, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          if (!audioCtx) return;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.14, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.12);
        }, idx * 60);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  // Generic sound dispatcher
  function triggerSound(type) {
    initAudio();
    if (type === 'coin') playCoin();
    else if (type === 'powerup') playPowerUp();
    else if (type === 'bleep') playBleep(520, 0.07);
    else playBleep(440, 0.05);
  }

  // Listen for user clicks on all .sound-trigger elements
  document.addEventListener('click', function (e) {
    initAudio();
    const trigger = e.target.closest('.sound-trigger');
    if (trigger) {
      const soundType = trigger.dataset.sound || 'bleep';
      triggerSound(soundType);
    }
  });

  // ==========================================================================
  // 2. HUD CONTROLS: SFX & CRT TOGGLES
  // ==========================================================================
  const sfxToggleBtn = document.getElementById('sfxToggleBtn');
  const sfxStatus = document.getElementById('sfxStatus');
  const sfxIcon = document.getElementById('sfxIcon');

  if (sfxToggleBtn) {
    sfxToggleBtn.addEventListener('click', () => {
      sfxEnabled = !sfxEnabled;
      sfxStatus.textContent = sfxEnabled ? 'ON' : 'OFF';
      sfxIcon.textContent = sfxEnabled ? '🔊' : '🔇';
      if (sfxEnabled) {
        initAudio();
        playCoin();
      }
    });
  }

  const crtToggleBtn = document.getElementById('crtToggleBtn');
  const crtStatus = document.getElementById('crtStatus');

  if (crtToggleBtn) {
    crtToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('crt-enabled');
      const isCrt = document.body.classList.contains('crt-enabled');
      crtStatus.textContent = isCrt ? 'ON' : 'OFF';
      triggerSound('bleep');
    });
  }

  // ==========================================================================
  // 3. NINTENDO 3DS INTERACTIVE SCREEN CONTROLLER
  // ==========================================================================
  const screenViews = {
    viewAvatar: document.getElementById('viewAvatar'),
    viewStats: document.getElementById('viewStats'),
    viewQuests: document.getElementById('viewQuests'),
    viewTrophies: document.getElementById('viewTrophies')
  };
  const touchTabBtns = document.querySelectorAll('.touch-tab-btn');
  const dsTopScreen = document.getElementById('dsTopScreen');
  let currentScreenId = 'viewAvatar';
  let isScreenPowerOn = true;

  function set3DSScreen(targetId) {
    if (!isScreenPowerOn) {
      isScreenPowerOn = true;
      if (dsTopScreen) dsTopScreen.style.opacity = '1';
    }

    if (!screenViews[targetId]) return;

    // Update screen views
    Object.keys(screenViews).forEach((id) => {
      if (screenViews[id]) {
        screenViews[id].classList.toggle('active', id === targetId);
      }
    });

    // Update bottom touch menu buttons
    touchTabBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.screen === targetId);
    });

    currentScreenId = targetId;
  }

  // Touch Tab clicks
  touchTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.screen;
      set3DSScreen(target);
    });
  });

  // D-Pad and ABXY buttons
  const consoleButtons = document.querySelectorAll('.d-btn, .abxy-btn');
  consoleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (target) {
        set3DSScreen(target);
      }
    });
  });

  // 3DS Home Button
  const homeBtn = document.getElementById('homeBtn');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      set3DSScreen('viewAvatar');
    });
  }

  // 3DS Power Button: Screen Toggle with CRT flicker
  const powerConsoleBtn = document.getElementById('powerConsoleBtn');
  if (powerConsoleBtn) {
    powerConsoleBtn.addEventListener('click', () => {
      isScreenPowerOn = !isScreenPowerOn;
      if (dsTopScreen) {
        dsTopScreen.style.transition = 'opacity 0.2s';
        dsTopScreen.style.opacity = isScreenPowerOn ? '1' : '0.1';
      }
      triggerSound('powerup');
    });
  }

  // Circle Pad interactive drag/tilt visual
  const circlePad = document.getElementById('circlePad');
  if (circlePad) {
    const inner = circlePad.querySelector('.circle-pad-inner');
    circlePad.addEventListener('mousemove', (e) => {
      const rect = circlePad.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      const maxDist = 8;
      const dist = Math.min(Math.sqrt(x * x + y * y), maxDist);
      const angle = Math.atan2(y, x);
      const moveX = Math.cos(angle) * dist;
      const moveY = Math.sin(angle) * dist;
      if (inner) {
        inner.style.transform = `translate(${moveX}px, ${moveY}px)`;
      }
    });

    circlePad.addEventListener('mouseleave', () => {
      if (inner) inner.style.transform = 'translate(0px, 0px)';
    });
  }

  // ==========================================================================
  // 4. 3D COVER-FLOW PROJECT SLIDER (Reference 2 `gustavobatista.dev`)
  // ==========================================================================
  const cartridges = Array.from(document.querySelectorAll('.cartridge-card'));
  const prevSlideBtn = document.getElementById('prevSlideBtn');
  const nextSlideBtn = document.getElementById('nextSlideBtn');
  const trackerDots = document.querySelectorAll('.tracker-dot');
  let currentCartridgeIdx = 0;
  const totalCartridges = cartridges.length;

  function updateCoverFlow(index) {
    currentCartridgeIdx = (index + totalCartridges) % totalCartridges;

    cartridges.forEach((card, i) => {
      // Clear previous position classes
      card.className = 'cartridge-card';

      // Calculate relative circular offset
      let diff = (i - currentCartridgeIdx) % totalCartridges;
      if (diff > totalCartridges / 2) diff -= totalCartridges;
      if (diff < -totalCartridges / 2) diff += totalCartridges;

      if (diff === 0) {
        card.classList.add('active');
      } else if (diff === 1) {
        card.classList.add('next-1');
      } else if (diff === 2) {
        card.classList.add('next-2');
      } else if (diff === -1) {
        card.classList.add('prev-1');
      } else if (diff === -2) {
        card.classList.add('prev-2');
      } else {
        card.classList.add('hidden-card');
      }
    });

    // Update indicator dots
    trackerDots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentCartridgeIdx);
    });
  }

  // Controls
  if (nextSlideBtn) {
    nextSlideBtn.addEventListener('click', () => {
      updateCoverFlow(currentCartridgeIdx + 1);
    });
  }

  if (prevSlideBtn) {
    prevSlideBtn.addEventListener('click', () => {
      updateCoverFlow(currentCartridgeIdx - 1);
    });
  }

  // Dot clicks
  trackerDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.index, 10);
      updateCoverFlow(idx);
    });
  });

  // Clicking any cartridge directly brings it to center
  cartridges.forEach((card, idx) => {
    card.addEventListener('click', (e) => {
      // Prevent centering if user clicked a link inside the card
      if (e.target.closest('a') || e.target.closest('button')) return;
      if (idx !== currentCartridgeIdx) {
        triggerSound('bleep');
        updateCoverFlow(idx);
      }
    });
  });

  // Keyboard Navigation: Left & Right arrow keys
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      updateCoverFlow(currentCartridgeIdx + 1);
      triggerSound('bleep');
    } else if (e.key === 'ArrowLeft') {
      updateCoverFlow(currentCartridgeIdx - 1);
      triggerSound('bleep');
    }
  });

  // Touch Swipe for Mobile Cover-Flow
  const coverflowViewport = document.getElementById('coverflowViewport');
  if (coverflowViewport) {
    let startX = 0;
    coverflowViewport.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    coverflowViewport.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;
      if (Math.abs(diffX) > 40) {
        if (diffX > 0) {
          updateCoverFlow(currentCartridgeIdx + 1);
        } else {
          updateCoverFlow(currentCartridgeIdx - 1);
        }
        triggerSound('bleep');
      }
    }, { passive: true });
  }

  // Initialize coverflow
  updateCoverFlow(0);

  // ==========================================================================
  // 5. PROJECT DOSSIER MODALS
  // ==========================================================================
  const modalData = {
    modalRouteIQ: {
      title: 'RouteIQ • Mission Dossier',
      content: `
        <h3 style="font-family: var(--font-pixel); font-size: 1rem; color: #d60058; margin-bottom: 8px;">RouteIQ - AI Transit Companion</h3>
        <p style="font-size: 1.2rem; margin-bottom: 12px;"><strong>Mission:</strong> Solve daily commuter friction across the Delhi-NCR transit grid using real-time GTFS feeds and AI.</p>
        <div style="background: rgba(255,255,255,0.7); border: 2px solid #000; padding: 10px; margin-bottom: 12px;">
          <p>• <strong>Live Bus Tracking:</strong> Interactive Leaflet map visualizing real-time positions of DTC transit buses.</p>
          <p>• <strong>Dynamic Replanning:</strong> Automatically computes alternate routes during delays.</p>
          <p>• <strong>Cost Comparison:</strong> Side-by-side fare analytics vs. Uber, Ola, and Rapido.</p>
          <p>• <strong>Meet Friends & Midpoint:</strong> Calculates optimal meetup spots based on travel times.</p>
        </div>
        <p style="font-family: var(--font-pixel); font-size: 0.7rem; color: #222;">TECH: React • Leaflet Maps • OpenStreetMap • GTFS Transit Data • REST APIs</p>
      `
    },
    modalETPulse: {
      title: 'ET Pulse • Mission Dossier',
      content: `
        <h3 style="font-family: var(--font-pixel); font-size: 1rem; color: #d60058; margin-bottom: 8px;">ET Pulse - Financial Intelligence</h3>
        <p style="font-size: 1.2rem; margin-bottom: 12px;"><strong>Mission:</strong> Democratize market analysis through AI-curated news summaries and multilingual access.</p>
        <div style="background: rgba(255,255,255,0.7); border: 2px solid #000; padding: 10px; margin-bottom: 12px;">
          <p>• <strong>Sector Heatmaps:</strong> Live visual sentiment and performance analysis across stock sectors.</p>
          <p>• <strong>Explore with AI:</strong> Integrated conversational financial assistant.</p>
          <p>• <strong>Multilingual Accessibility:</strong> Seamless localized UI support in Hindi, Tamil, Telugu, Bengali, and Marathi.</p>
        </div>
        <p style="font-family: var(--font-pixel); font-size: 0.7rem; color: #222;">TECH: React • Vite • Tailwind CSS • Financial APIs • i18n Localization</p>
      `
    },
    modalMindOasis: {
      title: 'MindOasis • Mission Dossier',
      content: `
        <h3 style="font-family: var(--font-pixel); font-size: 1rem; color: #d60058; margin-bottom: 8px;">MindOasis - Mental Wellness</h3>
        <p style="font-size: 1.2rem; margin-bottom: 12px;"><strong>Mission:</strong> Foster emotional resilience through thoughtful, calming micro-interactions and AI mood analysis.</p>
        <div style="background: rgba(255,255,255,0.7); border: 2px solid #000; padding: 10px; margin-bottom: 12px;">
          <p>• <strong>Mood Tracking:</strong> Visual mood diaries with historical trends.</p>
          <p>• <strong>Private Journaling:</strong> End-to-end client-side privacy for personal reflections.</p>
          <p>• <strong>AI-Assisted Guidance:</strong> Empathic NLP conversational prompts for stress relief.</p>
        </div>
        <p style="font-family: var(--font-pixel); font-size: 0.7rem; color: #222;">TECH: React • Tailwind CSS • NLP Sentiment Analysis • Web Storage</p>
      `
    },
    modalArthSahay: {
      title: 'ArthSahay • Mission Dossier',
      content: `
        <h3 style="font-family: var(--font-pixel); font-size: 1rem; color: #d60058; margin-bottom: 8px;">ArthSahay - AI Loan Companion</h3>
        <p style="font-size: 1.2rem; margin-bottom: 12px;"><strong>Mission:</strong> Bridge financial literacy gaps by transforming complicated loan terms into natural conversations.</p>
        <div style="background: rgba(255,255,255,0.7); border: 2px solid #000; padding: 10px; margin-bottom: 12px;">
          <p>• <strong>Conversational UI:</strong> Guided step-by-step interview to determine loan eligibility.</p>
          <p>• <strong>Transparent Explanations:</strong> Breaks down interest rates, hidden terms, and repayment paths.</p>
          <p>• <strong>Informed Decisions:</strong> Empowers first-time borrowers with plain-language risk evaluations.</p>
        </div>
        <p style="font-family: var(--font-pixel); font-size: 0.7rem; color: #222;">TECH: Python • NLP • React • Financial Decision Engine</p>
      `
    }
  };

  const projectModal = document.getElementById('projectModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');

  function openModal(modalKey) {
    const data = modalData[modalKey];
    if (!data || !projectModal) return;
    modalTitle.textContent = data.title;
    modalBody.innerHTML = data.content;
    projectModal.classList.add('active');
  }

  function closeModal() {
    if (projectModal) projectModal.classList.remove('active');
  }

  document.querySelectorAll('.modal-trigger').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.modal;
      openModal(key);
    });
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // ==========================================================================
  // 6. PLATFORMER MYSTERY BLOCKS & COIN COUNTER
  // ==========================================================================
  let coinScore = 0;
  const coinCounter = document.getElementById('coinCounter');

  function triggerMysteryBlock(block) {
    coinScore += 100;
    if (coinCounter) {
      coinCounter.textContent = coinScore.toString().padStart(2, '0');
    }

    // Spawn floating coin particle
    const rect = block.getBoundingClientRect();
    const particle = document.createElement('div');
    particle.textContent = '+100 🪙';
    particle.style.position = 'fixed';
    particle.style.left = `${rect.left + 5}px`;
    particle.style.top = `${rect.top - 10}px`;
    particle.style.color = '#ffd000';
    particle.style.fontFamily = 'var(--font-pixel)';
    particle.style.fontSize = '0.75rem';
    particle.style.zIndex = '99999';
    particle.style.pointerEvents = 'none';
    particle.style.transition = 'all 0.8s cubic-bezier(0.18, 0.89, 0.32, 1.28)';
    document.body.appendChild(particle);

    setTimeout(() => {
      particle.style.transform = 'translateY(-45px) scale(1.2)';
      particle.style.opacity = '0';
    }, 20);

    setTimeout(() => {
      particle.remove();
    }, 900);
  }

  const qBlock1 = document.getElementById('qBlock1');
  const qBlock2 = document.getElementById('qBlock2');
  if (qBlock1) qBlock1.addEventListener('click', () => triggerMysteryBlock(qBlock1));
  if (qBlock2) qBlock2.addEventListener('click', () => triggerMysteryBlock(qBlock2));

  // Warp pipe easter egg
  const warpPipe = document.getElementById('warpPipe');
  if (warpPipe) {
    warpPipe.addEventListener('click', () => {
      triggerSound('powerup');
      showToast('🌀 SECRET WARP: TELEPORTING TO MISSIONS!');
      const target = document.getElementById('missionsSection');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // ==========================================================================
  // 7. TOAST NOTIFICATIONS & COPY TO CLIPBOARD
  // ==========================================================================
  const pixelToast = document.getElementById('pixelToast');
  const toastMsg = document.getElementById('toastMsg');
  let toastTimer = null;

  function showToast(message) {
    if (!pixelToast) return;
    toastMsg.textContent = message;
    pixelToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      pixelToast.classList.remove('show');
    }, 3200);
  }

  const copyEmailBtn = document.getElementById('copyEmailBtn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      const email = 'saradhoundiyal296@gmail.com';
      navigator.clipboard.writeText(email).then(() => {
        showToast('⭐ EMAIL COPIED TO CLIPBOARD!');
      }).catch(() => {
        showToast('📧 saradhoundiyal296@gmail.com');
      });
    });
  }

  // Claim Boost button
  const powerUpBtn = document.getElementById('powerUpBtn');
  if (powerUpBtn) {
    powerUpBtn.addEventListener('click', () => {
      showToast('⚡ +500 XP BOOST GRANTED TO PLAYER 01!');
    });
  }

  // Contact Form Submission
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('senderName').value;
      const subject = document.getElementById('senderSubject').value;
      const message = document.getElementById('senderMessage').value;

      showToast('⚡ TRANSMISSION DISPATCHED TO SARA!');
      triggerSound('powerup');

      // Open user's default mail client pre-filled
      const mailtoUrl = `mailto:saradhoundiyal296@gmail.com?subject=${encodeURIComponent('[Portfolio Quest] ' + subject)}&body=${encodeURIComponent('From: ' + name + '\n\n' + message)}`;
      window.open(mailtoUrl, '_blank');
      contactForm.reset();
    });
  }

  // ==========================================================================
  // 8. ARCADE DEVELOPER CHARACTER SELECT (Reference 2)
  // ==========================================================================
  const specData = {
    aiml: {
      title: 'AI/ML ENGINEER & RESEARCHER',
      js: 8,
      py: 10,
      react: 8,
      creativity: 10,
      coffee: 8
    },
    fullstack: {
      title: 'FULL-STACK CRAFTSWOMAN (REACT & NODE)',
      js: 10,
      py: 8,
      react: 10,
      creativity: 9,
      coffee: 7
    },
    transit: {
      title: 'SMART MOBILITY LEAD (ROUTEIQ)',
      js: 9,
      py: 8,
      react: 9,
      creativity: 10,
      coffee: 8
    },
    fintech: {
      title: 'FINTECH INTELLIGENCE (ET PULSE)',
      js: 8,
      py: 9,
      react: 9,
      creativity: 9,
      coffee: 8
    },
    uiux: {
      title: 'UI/UX & MOTION DESIGNER',
      js: 8,
      py: 7,
      react: 9,
      creativity: 10,
      coffee: 6
    },
    hackathon: {
      title: 'IIIT & IISC HACKATHON GLADIATOR',
      js: 9,
      py: 9,
      react: 10,
      creativity: 10,
      coffee: 10
    }
  };

  const devSpecCards = document.querySelectorAll('.dev-spec-card');
  const devSpecTitle = document.getElementById('devSpecTitle');
  const statJsVal = document.getElementById('statJsVal');
  const statPyVal = document.getElementById('statPyVal');
  const statReactVal = document.getElementById('statReactVal');
  const statCreativityVal = document.getElementById('statCreativityVal');
  const statCoffeeVal = document.getElementById('statCoffeeVal');

  function updateSegmentedBar(barId, activeCount) {
    const bar = document.getElementById(barId);
    if (!bar) return;
    const segments = bar.querySelectorAll('.seg');
    segments.forEach((seg, i) => {
      seg.classList.toggle('active', i < activeCount);
    });
  }

  function setDeveloperSpec(specKey) {
    const data = specData[specKey];
    if (!data) return;

    // Update active card
    devSpecCards.forEach((card) => {
      card.classList.toggle('active', card.dataset.spec === specKey);
    });

    // Update title
    if (devSpecTitle) devSpecTitle.textContent = data.title;

    // Update numeric values
    if (statJsVal) statJsVal.textContent = `${data.js}/10`;
    if (statPyVal) statPyVal.textContent = `${data.py}/10`;
    if (statReactVal) statReactVal.textContent = `${data.react}/10`;
    if (statCreativityVal) statCreativityVal.textContent = `${data.creativity}/10`;
    if (statCoffeeVal) statCoffeeVal.textContent = `${data.coffee}/10`;

    // Update LED bar segments
    updateSegmentedBar('statJsBar', data.js);
    updateSegmentedBar('statPyBar', data.py);
    updateSegmentedBar('statReactBar', data.react);
    updateSegmentedBar('statCreativityBar', data.creativity);
    updateSegmentedBar('statCoffeeBar', data.coffee);

    // Sync with 3DS Console
    if (typeof set3DSScreen === 'function') {
      set3DSScreen('viewStats');
    }
  }

  devSpecCards.forEach((card) => {
    card.addEventListener('click', () => {
      const specKey = card.dataset.spec;
      setDeveloperSpec(specKey);
    });
  });

  // Secret Cave Easter Egg in World Map
  const secretCaveBtn = document.getElementById('secretCaveBtn');
  if (secretCaveBtn) {
    secretCaveBtn.addEventListener('click', () => {
      coinScore += 200;
      if (coinCounter) {
        coinCounter.textContent = coinScore.toString().padStart(2, '0');
      }
      showToast('🗝️ SECRET BOSS CAVE DISCOVERED: +200 COINS AWARDED!');
    });
  }

  // ==========================================================================
  // 9. VIVID VANTA.JS ATMOSPHERIC ENGINE (Birds, Halo, Fog, Clouds)
  // ==========================================================================
  const vantaAtmosphereCanvas = document.getElementById('vantaAtmosphereCanvas') || document.getElementById('vantaBirdsCanvas');
  let boids = [];
  let birdSparkles = [];
  let birdsAnimId = null;
  let mousePos = { x: -1000, y: -1000 };
  let atmTick = 0;

  if (vantaAtmosphereCanvas) {
    const ctx = vantaAtmosphereCanvas.getContext('2d');

    function resizeAtmosphereCanvas() {
      const hero = document.getElementById('heroSection');
      if (!hero) return;
      vantaAtmosphereCanvas.width = hero.clientWidth;
      vantaAtmosphereCanvas.height = hero.clientHeight;
    }
    resizeAtmosphereCanvas();
    window.addEventListener('resize', resizeAtmosphereCanvas);

    // Track mouse over hero for interactive steering
    const heroSec = document.getElementById('heroSection');
    if (heroSec) {
      heroSec.addEventListener('mousemove', (e) => {
        const rect = heroSec.getBoundingClientRect();
        mousePos.x = e.clientX - rect.left;
        mousePos.y = e.clientY - rect.top;
      });
      heroSec.addEventListener('mouseleave', () => {
        mousePos.x = -1000;
        mousePos.y = -1000;
      });
    }

    // Initialize 36 vibrant flocking birds across 3 depth layers
    const numBirds = 36;
    const birdColors = ['#00f0ff', '#ff00aa', '#ffd000', '#00ff88', '#ffffff', '#b388ff'];
    for (let i = 0; i < numBirds; i++) {
      const layer = i < 12 ? 1 : (i < 24 ? 2 : 3); // 1 = background, 2 = mid, 3 = foreground
      boids.push({
        x: Math.random() * (vantaAtmosphereCanvas.width || 900),
        y: 30 + Math.random() * 220,
        vx: (1.2 + Math.random() * 2.2) * (layer * 0.45),
        vy: (Math.random() - 0.5) * 0.9,
        layer: layer,
        size: layer === 3 ? 5 : (layer === 2 ? 3.5 : 2.5),
        wingPhase: Math.random() * Math.PI * 2,
        wingSpeed: 0.18 + Math.random() * 0.1,
        color: birdColors[i % birdColors.length],
        glideTime: 0
      });
    }

    function drawVividBird(ctx, b) {
      const isGliding = b.glideTime > 0;
      const flap = !isGliding && Math.sin(b.wingPhase) > 0;
      const x = Math.round(b.x);
      const y = Math.round(b.y);
      const s = Math.round(b.size);

      ctx.save();
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = b.layer === 3 ? 8 : 4;

      // Beak / Head
      ctx.fillRect(x + s * 2, y, s, s);
      // Body
      ctx.fillRect(x, y - Math.floor(s * 0.2), s * 2, s);
      // Tail
      ctx.fillStyle = b.layer === 3 ? '#ffffff' : b.color;
      ctx.fillRect(x - s, y, s, Math.max(1, Math.floor(s * 0.7)));

      ctx.fillStyle = b.color;
      if (isGliding) {
        // Flat gliding wings
        ctx.fillRect(x - s, y - Math.floor(s * 0.5), s * 3, Math.max(1, Math.floor(s * 0.6)));
      } else if (flap) {
        // Wings UP stroke
        ctx.fillRect(x - s, y - s * 1.6, s, s * 1.5);
        ctx.fillRect(x, y - s * 1.2, s, s);
        ctx.fillRect(x + s, y - s * 0.6, s, s);
      } else {
        // Wings DOWN stroke
        ctx.fillRect(x - s, y + s * 0.4, s, s * 1.4);
        ctx.fillRect(x, y + s * 0.8, s, s);
      }

      ctx.restore();
    }

    function animateAtmosphere() {
      if (!vantaAtmosphereCanvas) return;
      atmTick++;
      ctx.clearRect(0, 0, vantaAtmosphereCanvas.width, vantaAtmosphereCanvas.height);

      const w = vantaAtmosphereCanvas.width;
      const h = vantaAtmosphereCanvas.height;

      // Update & Draw Bird Stardust Sparkles
      for (let i = birdSparkles.length - 1; i >= 0; i--) {
        const p = birdSparkles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        if (p.life <= 0) birdSparkles.splice(i, 1);
      }

      // Update & Draw Flocking Birds
      boids.forEach((b) => {
        b.wingPhase += b.wingSpeed;

        // Occasional gliding pause
        if (b.glideTime > 0) {
          b.glideTime--;
        } else if (Math.random() < 0.008) {
          b.glideTime = 25 + Math.floor(Math.random() * 35);
        }

        // Mouse attraction/swerving
        const dx = mousePos.x - b.x;
        const dy = mousePos.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 160 && dist > 15) {
          b.vx += (dx / dist) * 0.1;
          b.vy += (dy / dist) * 0.08;
        }

        // Natural sine-wave swooping
        b.vy += Math.sin((atmTick + b.x) * 0.02) * 0.04;

        // Vertical bounds
        if (b.y < 25) b.vy += 0.06;
        if (b.y > 280) b.vy -= 0.06;

        // Speed constraints based on depth layer
        const maxSpd = 2.2 + b.layer * 0.9;
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (speed > maxSpd) {
          b.vx = (b.vx / speed) * maxSpd;
          b.vy = (b.vy / speed) * maxSpd;
        }
        if (b.vx < 1.0) b.vx += 0.06;

        b.x += b.vx;
        b.y += b.vy;

        // Leave tiny stardust sparkles behind foreground & mid birds
        if (b.layer >= 2 && atmTick % 7 === 0 && Math.random() < 0.45) {
          birdSparkles.push({
            x: b.x - 4,
            y: b.y + (Math.random() - 0.5) * 4,
            vx: -0.8,
            vy: (Math.random() - 0.5) * 0.4,
            size: b.layer === 3 ? 2 : 1,
            color: b.color,
            life: 18
          });
        }

        // Screen wrap
        if (b.x > w + 25) {
          b.x = -25;
          b.y = 25 + Math.random() * 220;
          b.vx = (1.2 + Math.random() * 2.2) * (b.layer * 0.45);
        }

        drawVividBird(ctx, b);
      });

      birdsAnimId = requestAnimationFrame(animateAtmosphere);
    }
    animateAtmosphere();
  }

  // Vanta Atmosphere FX Toggle Buttons
  const toggleBirdsBtn = document.getElementById('toggleBirdsBtn');
  if (toggleBirdsBtn) {
    toggleBirdsBtn.addEventListener('click', () => {
      document.body.classList.toggle('vanta-birds-off');
      const isOff = document.body.classList.contains('vanta-birds-off');
      toggleBirdsBtn.classList.toggle('active', !isOff);
      toggleBirdsBtn.textContent = isOff ? '🕊️ BIRDS: OFF' : '🕊️ BIRDS: ON';
    });
  }

  const toggleFogBtn = document.getElementById('toggleFogBtn');
  if (toggleFogBtn) {
    toggleFogBtn.addEventListener('click', () => {
      document.body.classList.toggle('vanta-fog-off');
      const isOff = document.body.classList.contains('vanta-fog-off');
      toggleFogBtn.classList.toggle('active', !isOff);
      toggleFogBtn.textContent = isOff ? '🌫️ FOG: OFF' : '🌫️ FOG: ON';
    });
  }

  const toggleHaloBtn = document.getElementById('toggleHaloBtn');
  if (toggleHaloBtn) {
    toggleHaloBtn.addEventListener('click', () => {
      document.body.classList.toggle('vanta-halo-off');
      const isOff = document.body.classList.contains('vanta-halo-off');
      toggleHaloBtn.classList.toggle('active', !isOff);
      toggleHaloBtn.textContent = isOff ? '💫 HALO: OFF' : '💫 HALO: ON';
    });
  }

  // ==========================================================================
  // 10. PLAYABLE MINI-GAME ENGINE: SARA CHASING MEOW!
  // ==========================================================================
  const arcadeGameModal = document.getElementById('arcadeGameModal');
  const startMiniGameBtn = document.getElementById('startMiniGameBtn');
  const gameCloseBtn = document.getElementById('gameCloseBtn');
  const gameExitBtn = document.getElementById('gameExitBtn');
  const gameModalBackdrop = document.getElementById('gameModalBackdrop');

  const runnerCanvas = document.getElementById('runnerCanvas');
  const runnerStartBtn = document.getElementById('runnerStartBtn');
  const runnerRestartBtn = document.getElementById('runnerRestartBtn');
  const runnerContinueBtn = document.getElementById('runnerContinueBtn');
  const mobileJumpBtn = document.getElementById('mobileJumpBtn');

  const gameStartOverlay = document.getElementById('gameStartOverlay');
  const gameOverOverlay = document.getElementById('gameOverOverlay');

  const runnerScoreEl = document.getElementById('runnerScore');
  const runnerHighScoreEl = document.getElementById('runnerHighScore');
  const runnerCoinsEl = document.getElementById('runnerCoins');
  const finalScoreVal = document.getElementById('finalScoreVal');
  const finalCoinsVal = document.getElementById('finalCoinsVal');

  let gameCtx = null;
  let gameLoopId = null;
  let gameRunning = false;
  let gameScore = 0;
  let gameCoinsCount = 0;
  let gameHighScore = parseInt(localStorage.getItem('saraRunnerHighScore') || '0', 10);
  if (runnerHighScoreEl) runnerHighScoreEl.textContent = gameHighScore.toString().padStart(4, '0');

  // Game Constants & Entities
  const GROUND_Y = 215;
  let gameSpeed = 4.2;
  let tick = 0;

  const player = {
    x: 70,
    y: GROUND_Y - 36,
    w: 26,
    h: 36,
    vy: 0,
    gravity: 0.65,
    jumpStrength: -11.5,
    jumpsLeft: 2,
    isGrounded: true,
    runFrame: 0
  };

  const cat = {
    x: 210,
    y: GROUND_Y - 24,
    w: 24,
    h: 22,
    runFrame: 0
  };

  let obstacles = [];
  let coins = [];
  let gameParticles = [];

  function openMiniGame() {
    if (!arcadeGameModal) return;
    initAudio();
    arcadeGameModal.classList.add('active');
    gameStartOverlay.classList.remove('hidden');
    gameOverOverlay.classList.add('hidden');
    resetMiniGame();
    drawInitialGameScene();
  }

  function closeMiniGame() {
    if (!arcadeGameModal) return;
    arcadeGameModal.classList.remove('active');
    gameRunning = false;
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
  }

  if (startMiniGameBtn) startMiniGameBtn.addEventListener('click', openMiniGame);
  if (gameCloseBtn) gameCloseBtn.addEventListener('click', closeMiniGame);
  if (gameExitBtn) gameExitBtn.addEventListener('click', closeMiniGame);
  if (gameModalBackdrop) gameModalBackdrop.addEventListener('click', closeMiniGame);

  if (runnerContinueBtn) {
    runnerContinueBtn.addEventListener('click', () => {
      closeMiniGame();
      const target = document.getElementById('level01');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  }

  function resetMiniGame() {
    gameScore = 0;
    gameCoinsCount = 0;
    gameSpeed = 4.2;
    tick = 0;
    player.y = GROUND_Y - player.h;
    player.vy = 0;
    player.jumpsLeft = 2;
    player.isGrounded = true;
    obstacles = [];
    coins = [];
    gameParticles = [];
    if (runnerScoreEl) runnerScoreEl.textContent = '0000';
    if (runnerCoinsEl) runnerCoinsEl.textContent = '00 🪙';
  }

  function doJump() {
    if (!gameRunning) return;
    if (player.jumpsLeft > 0) {
      player.vy = player.jumpStrength;
      player.jumpsLeft--;
      player.isGrounded = false;
      triggerSound('bleep');

      // Jump dust particle
      for (let i = 0; i < 4; i++) {
        gameParticles.push({
          x: player.x + 8 + (Math.random() - 0.5) * 10,
          y: GROUND_Y,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 2,
          life: 18,
          color: '#ff80bf'
        });
      }
    }
  }

  // Jump triggers: Spacebar, Up Arrow, Click on canvas, Mobile jump button
  window.addEventListener('keydown', (e) => {
    if (arcadeGameModal && arcadeGameModal.classList.contains('active')) {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!gameRunning && !gameStartOverlay.classList.contains('hidden')) {
          startGameLoop();
        } else if (gameRunning) {
          doJump();
        }
      }
    }
  });

  if (runnerCanvas) {
    runnerCanvas.addEventListener('mousedown', () => {
      if (gameRunning) doJump();
    });
    runnerCanvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (gameRunning) doJump();
    }, { passive: false });
  }

  if (mobileJumpBtn) mobileJumpBtn.addEventListener('click', doJump);

  if (runnerStartBtn) {
    runnerStartBtn.addEventListener('click', startGameLoop);
  }
  if (runnerRestartBtn) {
    runnerRestartBtn.addEventListener('click', () => {
      gameOverOverlay.classList.add('hidden');
      startGameLoop();
    });
  }

  function startGameLoop() {
    initAudio();
    resetMiniGame();
    gameRunning = true;
    gameStartOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    triggerSound('powerup');
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    runGameTick();
  }

  function runGameTick() {
    if (!gameRunning) return;
    updateGame();
    renderGame();
    gameLoopId = requestAnimationFrame(runGameTick);
  }

  function updateGame() {
    tick++;
    gameScore += 1;
    if (runnerScoreEl) runnerScoreEl.textContent = gameScore.toString().padStart(4, '0');

    // Gradual speed up
    if (tick % 400 === 0 && gameSpeed < 8.5) {
      gameSpeed += 0.35;
    }

    // Player physics
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y >= GROUND_Y - player.h) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      player.isGrounded = true;
      player.jumpsLeft = 2;
    }

    // Run animation frames
    if (tick % 6 === 0) {
      player.runFrame = (player.runFrame + 1) % 4;
      cat.runFrame = (cat.runFrame + 1) % 4;
    }

    // Cat lead position with cute bob
    cat.x = player.x + 140 + Math.sin(tick * 0.08) * 15;

    // Cat happy particles
    if (tick % 24 === 0) {
      gameParticles.push({
        x: cat.x + 12,
        y: cat.y - 4,
        vx: -1,
        vy: -1.2,
        life: 25,
        color: '#ff80bf',
        isHeart: true
      });
    }

    // Spawn obstacles (slimes & blocks)
    if (tick % 110 === 0 || (tick % 190 === 0 && Math.random() > 0.4)) {
      const isSlime = Math.random() > 0.4;
      obstacles.push({
        x: runnerCanvas.width + 30,
        y: isSlime ? (GROUND_Y - 18) : (GROUND_Y - 28),
        w: isSlime ? 22 : 24,
        h: isSlime ? 18 : 28,
        isSlime: isSlime,
        color: isSlime ? '#00ff88' : '#ff2a85'
      });
    }

    // Spawn coins
    if (tick % 90 === 0 && Math.random() > 0.3) {
      coins.push({
        x: runnerCanvas.width + 20,
        y: GROUND_Y - 45 - Math.random() * 30,
        r: 7,
        collected: false
      });
    }

    // Update obstacles & check player collision
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= gameSpeed;

      // AABB collision box with slight margin
      const pBox = { x: player.x + 4, y: player.y + 2, w: player.w - 8, h: player.h - 4 };
      if (
        pBox.x < obs.x + obs.w &&
        pBox.x + pBox.w > obs.x &&
        pBox.y < obs.y + obs.h &&
        pBox.y + pBox.h > obs.y
      ) {
        gameOver();
        return;
      }

      if (obs.x < -40) obstacles.splice(i, 1);
    }

    // Update coins & collect
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.x -= gameSpeed;

      if (!c.collected && Math.hypot((player.x + 13) - c.x, (player.y + 18) - c.y) < 24) {
        c.collected = true;
        gameCoinsCount += 1;
        gameScore += 50;
        triggerSound('coin');
        if (runnerCoinsEl) runnerCoinsEl.textContent = `${gameCoinsCount.toString().padStart(2, '0')} 🪙`;

        // Coin sparkle particle
        for (let p = 0; p < 6; p++) {
          gameParticles.push({
            x: c.x,
            y: c.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 18,
            color: '#ffd000'
          });
        }
        coins.splice(i, 1);
      } else if (c.x < -20) {
        coins.splice(i, 1);
      }
    }

    // Update particles
    for (let i = gameParticles.length - 1; i >= 0; i--) {
      const p = gameParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) gameParticles.splice(i, 1);
    }
  }

  function gameOver() {
    gameRunning = false;
    triggerSound('bleep');

    if (gameScore > gameHighScore) {
      gameHighScore = gameScore;
      localStorage.setItem('saraRunnerHighScore', gameHighScore.toString());
      if (runnerHighScoreEl) runnerHighScoreEl.textContent = gameHighScore.toString().padStart(4, '0');
    }

    if (finalScoreVal) finalScoreVal.textContent = gameScore;
    if (finalCoinsVal) finalCoinsVal.textContent = gameCoinsCount;

    setTimeout(() => {
      gameOverOverlay.classList.remove('hidden');
    }, 250);
  }

  function renderGame() {
    if (!runnerCanvas) return;
    if (!gameCtx) gameCtx = runnerCanvas.getContext('2d');
    const ctx = gameCtx;
    const w = runnerCanvas.width;
    const h = runnerCanvas.height;

    // Background: Retro Space Sky
    ctx.fillStyle = '#0e0924';
    ctx.fillRect(0, 0, w, h);

    // Starfield parallax
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 30; i++) {
      const starX = (i * 47 - (tick * 0.4)) % w;
      const starY = (i * 29) % (GROUND_Y - 20);
      ctx.fillRect((starX + w) % w, starY, 2, 2);
    }

    // Parallax silhouette hills
    ctx.fillStyle = '#1c133f';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= w; x += 40) {
      const hillY = GROUND_Y - 35 - Math.sin((x + tick * 0.8) * 0.015) * 20;
      ctx.lineTo(x, hillY);
    }
    ctx.lineTo(w, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    // Checkerboard platform ground
    ctx.fillStyle = '#00aa55';
    ctx.fillRect(0, GROUND_Y, w, h - GROUND_Y);
    ctx.fillStyle = '#00ff88';
    for (let x = -((tick * gameSpeed) % 40); x < w + 40; x += 20) {
      ctx.fillRect(x, GROUND_Y, 10, 8);
    }
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(w, GROUND_Y);
    ctx.stroke();

    // Draw Obstacles (Slimes or Bricks)
    obstacles.forEach((obs) => {
      if (obs.isSlime) {
        // Cute green slime
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(obs.x + 2, obs.y + 4, obs.w - 4, obs.h - 4);
        ctx.fillRect(obs.x + 4, obs.y, obs.w - 8, obs.h);
        ctx.fillStyle = '#000';
        ctx.fillRect(obs.x + 5, obs.y + 5, 3, 3);
        ctx.fillRect(obs.x + obs.w - 8, obs.y + 5, 3, 3);
      } else {
        // Retro Question / Brick block
        ctx.fillStyle = '#ff2a85';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        ctx.fillStyle = '#fff';
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText('▲', obs.x + 6, obs.y + 18);
      }
    });

    // Draw Coins
    coins.forEach((c) => {
      ctx.fillStyle = '#ffd000';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b38f00';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fillRect(c.x - 2, c.y - 3, 4, 6);
    });

    // Draw Sara (Player)
    drawSaraSprite(ctx, player.x, player.y, player.w, player.h, player.runFrame, player.isGrounded);

    // Draw Meow (Cat)
    drawMeowSprite(ctx, cat.x, cat.y, cat.w, cat.h, cat.runFrame);

    // Draw Particles
    gameParticles.forEach((p) => {
      ctx.fillStyle = p.color;
      if (p.isHeart) {
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.fillRect(p.x + 4, p.y, 4, 4);
        ctx.fillRect(p.x + 2, p.y + 4, 4, 4);
      } else {
        ctx.fillRect(p.x, p.y, 3, 3);
      }
    });
  }

  // Draw 8-Bit Pixel Sara Character
  function drawSaraSprite(ctx, x, y, w, h, frame, isGrounded) {
    // Hair (Brown)
    ctx.fillStyle = '#6e4428';
    ctx.fillRect(x + 4, y, 18, 14);
    ctx.fillRect(x + 2, y + 6, 22, 14);

    // Face (Peach skin tone)
    ctx.fillStyle = '#ffd1b3';
    ctx.fillRect(x + 6, y + 6, 14, 10);

    // Eyes & Smile
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 13, y + 9, 3, 3);
    ctx.fillRect(x + 18, y + 9, 3, 3);

    // Red Bindi
    ctx.fillStyle = '#d60036';
    ctx.fillRect(x + 16, y + 7, 2, 2);

    // Pink Ribbon Hair Clips
    ctx.fillStyle = '#ff80bf';
    ctx.fillRect(x + 2, y + 4, 4, 4);
    ctx.fillRect(x + 20, y + 4, 4, 4);

    // School Sailor Top (Blue & White)
    ctx.fillStyle = '#2c4d9e';
    ctx.fillRect(x + 6, y + 16, 14, 10);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 9, y + 16, 8, 4);

    // Skirt (Green)
    ctx.fillStyle = '#00aa55';
    ctx.fillRect(x + 5, y + 26, 16, 5);

    // Legs / Running animation
    ctx.fillStyle = '#ffd1b3';
    if (!isGrounded) {
      // In air jump pose
      ctx.fillRect(x + 6, y + 31, 4, 5);
      ctx.fillRect(x + 14, y + 31, 4, 3);
    } else if (frame % 2 === 0) {
      ctx.fillRect(x + 7, y + 31, 4, 5);
      ctx.fillRect(x + 15, y + 31, 4, 4);
    } else {
      ctx.fillRect(x + 5, y + 31, 4, 4);
      ctx.fillRect(x + 13, y + 31, 4, 5);
    }
  }

  // Draw 8-Bit Pixel Meow (Cat)
  function drawMeowSprite(ctx, x, y, w, h, frame) {
    // Body (White)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 4, y + 6, 14, 10);

    // Head
    ctx.fillRect(x + 12, y + 2, 10, 10);

    // Pink Ears
    ctx.fillStyle = '#ff80bf';
    ctx.fillRect(x + 14, y - 2, 3, 4);
    ctx.fillRect(x + 19, y - 2, 3, 4);

    // Blue Eye
    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(x + 18, y + 5, 2, 2);

    // Red Collar with Bell
    ctx.fillStyle = '#ff2a85';
    ctx.fillRect(x + 11, y + 10, 4, 2);
    ctx.fillStyle = '#ffd000';
    ctx.fillRect(x + 12, y + 12, 2, 2);

    // Tail (Wagging)
    ctx.fillStyle = '#ffffff';
    const tailY = frame % 2 === 0 ? y + 2 : y + 6;
    ctx.fillRect(x + 1, tailY, 4, 3);

    // Paws (Animated run)
    ctx.fillStyle = '#ffffff';
    if (frame % 2 === 0) {
      ctx.fillRect(x + 6, y + 16, 3, 4);
      ctx.fillRect(x + 13, y + 16, 3, 3);
    } else {
      ctx.fillRect(x + 4, y + 16, 3, 3);
      ctx.fillRect(x + 15, y + 16, 3, 4);
    }
  }

  function drawInitialGameScene() {
    if (!runnerCanvas) return;
    if (!gameCtx) gameCtx = runnerCanvas.getContext('2d');
    renderGame();
  }

  // ==========================================================================
  // 11. SECRET KONAMI CODE (Easter Egg)
  // ==========================================================================
  const konamiSequence = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];
  let konamiIndex = 0;

  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === konamiSequence[konamiIndex].toLowerCase()) {
      konamiIndex++;
      if (konamiIndex === konamiSequence.length) {
        konamiIndex = 0;
        triggerSound('powerup');
        showToast('🎮 GOD MODE UNLOCKED: SARA DHOUNDIYAL HIRED! ⭐');
        document.body.style.animation = 'starsTwinkle 0.2s 6';
      }
    } else {
      konamiIndex = 0;
    }
  });

  // ==========================================================================
  // 17. CREATIVE 8-BIT RETRO CURSOR SPARKLE & CLICK BURST ENGINE
  // ==========================================================================
  function initCreativeCursor() {
    let lastX = 0, lastY = 0;
    let throttle = 0;
    const colors = ['#00f0ff', '#ff007f', '#ffdd00', '#00ff88', '#b57cff'];

    window.addEventListener('mousemove', (e) => {
      throttle++;
      if (throttle % 2 !== 0) return; // Lightweight 30-60fps throttle

      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      if (dist < 10) return;
      lastX = e.clientX;
      lastY = e.clientY;

      const p = document.createElement('div');
      p.className = 'cursor-sparkle';
      const size = Math.random() * 5 + 4;
      const color = colors[Math.floor(Math.random() * colors.length)];
      p.style.left = `${e.clientX}px`;
      p.style.top = `${e.clientY}px`;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.backgroundColor = color;
      p.style.boxShadow = `0 0 6px ${color}`;
      document.body.appendChild(p);

      setTimeout(() => {
        p.remove();
      }, 550);
    });

    window.addEventListener('click', (e) => {
      for (let i = 0; i < 7; i++) {
        const p = document.createElement('div');
        p.className = 'cursor-click-burst';
        const angle = (i * (360 / 7)) * (Math.PI / 180);
        const dist = Math.random() * 26 + 16;
        const color = colors[i % colors.length];

        p.style.left = `${e.clientX}px`;
        p.style.top = `${e.clientY}px`;
        p.style.backgroundColor = color;
        p.style.boxShadow = `0 0 8px ${color}`;
        p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
        p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
        document.body.appendChild(p);

        setTimeout(() => {
          p.remove();
        }, 450);
      }
    });
  }
  initCreativeCursor();

})();
