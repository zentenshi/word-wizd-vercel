import { soundManager } from '../audio/soundManager.js';
import { evaluateSpell } from '../data/dictionary.js';

export class UIRenderer {
  constructor(board, combatEngine) {
    this.board = board;
    this.combat = combatEngine;
    this.container = document.getElementById('app');
    this.particleCanvas = null;
    this.ctx = null;
    this.particles = [];
  }

  init() {
    this.renderStructure();
    this.initParticles();
    this.updateAll();
  }

  renderStructure() {
    this.container.innerHTML = `
      <!-- Particle Background Canvas -->
      <canvas id="particleCanvas" class="particle-canvas"></canvas>

      <!-- Main Game Container -->
      <div class="game-wrapper" id="gameWrapper">
        
        <!-- Top Navigation / Header -->
        <header class="game-header">
          <div class="header-left">
            <h1 class="logo-title">
              <span class="logo-rune">✦</span> WordWiz <span class="logo-subtitle">Arcane Lexicon</span>
            </h1>
          </div>
          <div class="header-center">
            <div class="stage-badge" id="stageBadge">Stage 1: The Whispering Woods</div>
          </div>
          <div class="header-right">
            <button id="btnMusic" class="icon-btn" title="Toggle Music (Ghibli Station)">🎵 Music</button>
            <button id="btnSound" class="icon-btn" title="Toggle Sound FX">🔊 SFX</button>
            <button id="btnLore" class="icon-btn" title="Story Lore">📜 Story</button>
            <button id="btnHelp" class="icon-btn" title="Spellbook Guide">📖 Guide</button>
          </div>
        </header>

        <!-- Battle Arena Stage -->
        <main class="battle-arena">
          
          <!-- Left: Hero Unit -->
          <div class="unit-card hero-card" id="heroCard">
            <div class="unit-header">
              <div class="unit-avatar-box hero-avatar-box" id="heroAvatar">
                <!-- Wizard SVG Avatar -->
                <svg viewBox="0 0 100 100" class="avatar-svg">
                  <!-- Wizard Robe -->
                  <path d="M30,90 L20,45 L50,30 L80,45 L70,90 Z" fill="#2c3e6b" stroke="#7986cb" stroke-width="2"/>
                  <!-- Cloak Trim -->
                  <path d="M45,45 L55,45 L52,90 L48,90 Z" fill="#d4af37"/>
                  <!-- Wizard Beard & Face -->
                  <circle cx="50" cy="38" r="14" fill="#ffdfba"/>
                  <path d="M40,42 Q50,75 60,42 Q50,55 40,42 Z" fill="#e0e0e0"/>
                  <!-- Eyes -->
                  <circle cx="45" cy="36" r="2" fill="#1a237e"/>
                  <circle cx="55" cy="36" r="2" fill="#1a237e"/>
                  <!-- Eyebrows -->
                  <path d="M42,32 Q46,30 48,33" stroke="#e0e0e0" stroke-width="2" fill="none"/>
                  <path d="M52,33 Q54,30 58,32" stroke="#e0e0e0" stroke-width="2" fill="none"/>
                  <!-- Pointy Wizard Hat -->
                  <ellipse cx="50" cy="28" rx="26" ry="6" fill="#1a237e" stroke="#3949ab" stroke-width="2"/>
                  <path d="M26,28 Q48,-5 58,15 L74,28 Z" fill="#283593"/>
                  <!-- Hat Rune Gem -->
                  <polygon points="50,18 54,23 50,28 46,23" fill="#00e5ff"/>
                  <!-- Wizard Staff -->
                  <line x1="82" y1="20" x2="82" y2="95" stroke="#8d6e63" stroke-width="4" stroke-linecap="round"/>
                  <circle cx="82" cy="18" r="7" fill="#7c4dff" class="staff-gem-pulse"/>
                </svg>
              </div>
              <div class="unit-info">
                <div class="unit-name-row">
                  <span class="unit-name">Alistair</span>
                  <span class="unit-tag hero-tag">WordWiz</span>
                </div>
                <div class="hp-bar-container">
                  <div class="hp-bar-fill hero-hp-fill" id="heroHpFill" style="width: 100%;"></div>
                  <span class="hp-text" id="heroHpText">100 / 100 HP</span>
                </div>
              </div>
            </div>
            <div class="hero-status-row" id="heroStatusRow">
              <span class="status-pill potion-pill" id="potionStatusPill">🧪 2 Potions</span>
              <span class="status-pill mana-pill">✦ Arcane Flow</span>
            </div>
          </div>

          <!-- Center: Floating Forming Word & Spell Launcher -->
          <div class="spell-casting-zone">
            
            <!-- Spell Damage Preview -->
            <div class="spell-preview-box" id="spellPreviewBox">
              <div class="spell-status-text" id="spellStatusText">Select runes to weave incantation</div>
              <div class="spell-damage-calc" id="spellDamageCalc" style="display: none;"></div>
            </div>

            <!-- Floating Active Word Tiles -->
            <div class="word-rack-container" id="wordRackContainer">
              <div class="word-rack-placeholder" id="rackPlaceholder">Click tiles below to spell...</div>
              <div class="word-rack-tiles" id="wordRackTiles"></div>
            </div>

            <!-- Cast / Attack Action Button -->
            <button id="btnAttack" class="btn-cast-spell" disabled>
              <span class="btn-cast-icon">⚡</span>
              <span class="btn-cast-label">Cast Incantation</span>
            </button>

            <!-- Combat Floating Numbers Layer -->
            <div class="floating-text-layer" id="floatingTextLayer"></div>
          </div>

          <!-- Right: Monster Unit -->
          <div class="unit-card enemy-card" id="enemyCard">
            <div class="unit-header">
              <div class="unit-info text-right">
                <div class="unit-name-row justify-end">
                  <span class="unit-tag enemy-tag" id="enemyTitle">Forest Scout</span>
                  <span class="unit-name" id="enemyName">Gnarlfoot</span>
                </div>
                <div class="hp-bar-container">
                  <div class="hp-bar-fill enemy-hp-fill" id="enemyHpFill" style="width: 100%;"></div>
                  <span class="hp-text" id="enemyHpText">75 / 75 HP</span>
                </div>
              </div>
              <div class="unit-avatar-box enemy-avatar-box" id="enemyAvatar">
                <!-- Dynamic Monster SVG -->
                <div id="enemySvgContainer" class="enemy-svg-wrap"></div>
              </div>
            </div>
            <div class="enemy-status-row" id="enemyStatusRow">
              <span class="enemy-intent-pill" id="enemyIntentPill">⚔️ Ready to strike</span>
            </div>
          </div>

        </main>

        <!-- Lower Section: 4x4 Grid & Action Toolbar -->
        <section class="lower-game-panel">
          
          <!-- Tactical Command Bar -->
          <div class="tactical-toolbar">
            <button id="btnPotion" class="action-btn potion-btn" title="Restore 35 Health (Key: P)">
              <span class="btn-icon">🧪</span>
              <span class="btn-text">Heal Potion</span>
              <span class="badge" id="potionBadge">2</span>
            </button>

            <button id="btnScramble" class="action-btn scramble-btn" title="Shuffle Board Tiles (Key: Space)">
              <span class="btn-icon">🌀</span>
              <span class="btn-text">Scramble</span>
              <span class="badge" id="scrambleBadge">2</span>
            </button>

            <button id="btnHint" class="action-btn hint-btn" title="Arcane Word Insight (Key: H)">
              <span class="btn-icon">💡</span>
              <span class="btn-text">Arcane Hint</span>
              <span class="badge" id="hintBadge">2</span>
            </button>

            <button id="btnClear" class="action-btn clear-btn" title="Clear Selected Word (Key: Backspace / Esc)">
              <span class="btn-icon">🧹</span>
              <span class="btn-text">Clear Rack</span>
            </button>
          </div>

          <!-- 4x4 Board Matrix -->
          <div class="board-container">
            <div class="board-grid" id="boardGrid"></div>
          </div>

          <!-- Bottom Combat Log Ticker -->
          <div class="combat-ticker" id="combatTicker">
            <span class="ticker-icon">📜</span>
            <span class="ticker-text" id="tickerText">Form powerful words from the runes to overwhelm the foe.</span>
          </div>

        </section>

      </div>

      <!-- Modals Container -->
      <div id="modalBackdrop" class="modal-backdrop hidden">
        <div class="modal-content parchment-theme" id="modalContent"></div>
      </div>
    `;

    this.particleCanvas = document.getElementById('particleCanvas');
    if (this.particleCanvas) {
      this.ctx = this.particleCanvas.getContext('2d');
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
    }
  }

  resizeCanvas() {
    if (!this.particleCanvas) return;
    this.particleCanvas.width = window.innerWidth;
    this.particleCanvas.height = window.innerHeight;
  }

  initParticles() {
    this.particles = [];
    const count = 35;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 2.5 + 1,
        speedX: (Math.random() - 0.5) * 0.6,
        speedY: -Math.random() * 0.8 - 0.2,
        alpha: Math.random() * 0.6 + 0.2,
        hue: 200 // default blueish
      });
    }
    this.animateParticles();
  }

  animateParticles() {
    if (!this.ctx || !this.particleCanvas) return;
    this.ctx.clearRect(0, 0, this.particleCanvas.width, this.particleCanvas.height);

    const stage = this.combat.getCurrentStage();
    let baseHue = 120; // green for forest
    if (stage.background === 'crypt') baseHue = 275; // purple
    if (stage.background === 'volcano') baseHue = 15; // fiery orange/red

    for (const p of this.particles) {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.y < 0) {
        p.y = this.particleCanvas.height;
        p.x = Math.random() * this.particleCanvas.width;
      }
      if (p.x < 0) p.x = this.particleCanvas.width;
      if (p.x > this.particleCanvas.width) p.x = 0;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `hsla(${baseHue}, 80%, 65%, ${p.alpha})`;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = `hsla(${baseHue}, 90%, 50%, 0.8)`;
      this.ctx.fill();
    }

    requestAnimationFrame(() => this.animateParticles());
  }

  renderMonsterSvg(spriteType) {
    if (spriteType === 'goblin') {
      return `
        <svg viewBox="0 0 100 100" class="avatar-svg monster-goblin">
          <!-- Goblin Body -->
          <ellipse cx="50" cy="65" rx="22" ry="24" fill="#33691e" stroke="#558b2f" stroke-width="2"/>
          <path d="M35,55 L25,85 L35,80 L45,85 Z" fill="#4e342e"/>
          <!-- Big Ears -->
          <polygon points="25,38 5,20 22,48" fill="#558b2f" stroke="#33691e" stroke-width="1.5"/>
          <polygon points="75,38 95,20 78,48" fill="#558b2f" stroke="#33691e" stroke-width="1.5"/>
          <!-- Goblin Head -->
          <ellipse cx="50" cy="42" rx="22" ry="18" fill="#558b2f"/>
          <!-- Nose -->
          <polygon points="50,38 45,50 55,50" fill="#689f38"/>
          <!-- Glowing Yellow Eyes -->
          <circle cx="40" cy="38" r="4.5" fill="#ffd600"/>
          <circle cx="60" cy="38" r="4.5" fill="#ffd600"/>
          <circle cx="40" cy="38" r="2" fill="#d50000"/>
          <circle cx="60" cy="38" r="2" fill="#d50000"/>
          <!-- Wicked Grin with sharp fangs -->
          <path d="M38,54 Q50,62 62,54" stroke="#212121" stroke-width="2" fill="none"/>
          <polygon points="43,54 45,58 47,54" fill="#fff"/>
          <polygon points="53,54 55,58 57,54" fill="#fff"/>
          <!-- Thorn Dagger -->
          <path d="M18,65 L10,40 L16,42 L22,65 Z" fill="#8d6e63" stroke="#4e342e"/>
        </svg>
      `;
    }

    if (spriteType === 'lich') {
      return `
        <svg viewBox="0 0 100 100" class="avatar-svg monster-lich">
          <!-- Shadow Cloak / Shroud -->
          <path d="M20,95 Q10,45 50,15 Q90,45 80,95 Q50,85 20,95 Z" fill="#311b92" stroke="#673ab7" stroke-width="2"/>
          <path d="M35,35 Q50,20 65,35 Q50,75 35,35 Z" fill="#12005e"/>
          <!-- Floating Skull -->
          <ellipse cx="50" cy="40" rx="16" ry="17" fill="#ede7f6" stroke="#b39ddb" stroke-width="1.5"/>
          <path d="M42,50 L42,56 L58,56 L58,50 Z" fill="#ede7f6"/>
          <!-- Glowing Purple Eyes -->
          <circle cx="44" cy="38" r="3.5" fill="#7c4dff" class="lich-eye-glow"/>
          <circle cx="56" cy="38" r="3.5" fill="#7c4dff" class="lich-eye-glow"/>
          <circle cx="44" cy="38" r="1.5" fill="#fff"/>
          <circle cx="56" cy="38" r="1.5" fill="#fff"/>
          <!-- Nose Cavity -->
          <polygon points="50,42 47,46 53,46" fill="#4a148c"/>
          <!-- Skeletal Teeth -->
          <line x1="45" y1="53" x2="45" y2="56" stroke="#4a148c" stroke-width="1.5"/>
          <line x1="50" y1="53" x2="50" y2="56" stroke="#4a148c" stroke-width="1.5"/>
          <line x1="55" y1="53" x2="55" y2="56" stroke="#4a148c" stroke-width="1.5"/>
          <!-- Crown of Bones -->
          <path d="M34,26 L42,16 L50,24 L58,16 L66,26 Z" fill="#d1c4e9" stroke="#7e57c2"/>
          <!-- Swirling Necrotic Orbs -->
          <circle cx="18" cy="45" r="5" fill="#b388ff" class="necrotic-orb-1"/>
          <circle cx="82" cy="48" r="6" fill="#b388ff" class="necrotic-orb-2"/>
        </svg>
      `;
    }

    // Dragon / Wyrm (Final Boss)
    return `
      <svg viewBox="0 0 100 100" class="avatar-svg monster-dragon">
        <!-- Dragon Horns & Spikes -->
        <path d="M28,25 Q15,5 10,12 Q20,28 32,32 Z" fill="#d50000" stroke="#ff8a80"/>
        <path d="M72,25 Q85,5 90,12 Q80,28 68,32 Z" fill="#d50000" stroke="#ff8a80"/>
        <!-- Main Dragon Head -->
        <path d="M28,30 L50,15 L72,30 L65,75 L50,85 L35,75 Z" fill="#b71c1c" stroke="#ff5252" stroke-width="2"/>
        <!-- Scaled Brow -->
        <polygon points="35,32 50,25 65,32 50,38" fill="#d32f2f"/>
        <!-- Searing Magma Eyes -->
        <polygon points="34,42 44,40 40,46" fill="#ffeb3b" class="dragon-eye-glow"/>
        <polygon points="66,42 56,40 60,46" fill="#ffeb3b" class="dragon-eye-glow"/>
        <!-- Molten Snout & Fangs -->
        <path d="M42,62 L50,56 L58,62 L55,75 L45,75 Z" fill="#7f0000"/>
        <polygon points="44,65 47,72 49,65" fill="#fff"/>
        <polygon points="51,65 53,72 56,65" fill="#fff"/>
        <!-- Smoke & Fire breath vents -->
        <circle cx="46" cy="58" r="1.5" fill="#ff9100"/>
        <circle cx="54" cy="58" r="1.5" fill="#ff9100"/>
        <!-- Flaming Crest -->
        <path d="M46,12 Q50,0 54,12" stroke="#ffab00" stroke-width="3" fill="none" class="flame-crest"/>
      </svg>
    `;
  }

  updateAll() {
    this.updateHeader();
    this.updateUnits();
    this.updateWordRack();
    this.updateBoard();
    this.updateButtons();
  }

  updateHeader() {
    const stage = this.combat.getCurrentStage();
    const badge = document.getElementById('stageBadge');
    if (badge) {
      badge.textContent = `Stage ${stage.id} / 3: ${stage.name}`;
    }

    // Set background theme class
    const wrapper = document.getElementById('gameWrapper');
    if (wrapper) {
      wrapper.className = `game-wrapper theme-${stage.background}`;
    }
  }

  updateUnits() {
    // Hero HP
    const heroHpFill = document.getElementById('heroHpFill');
    const heroHpText = document.getElementById('heroHpText');
    const heroPercent = Math.max(0, (this.combat.playerHp / this.combat.playerMaxHp) * 100);
    if (heroHpFill) heroHpFill.style.width = `${heroPercent}%`;
    if (heroHpText) heroHpText.textContent = `${this.combat.playerHp} / ${this.combat.playerMaxHp} HP`;

    // Potion badge
    const potionStatusPill = document.getElementById('potionStatusPill');
    if (potionStatusPill) {
      potionStatusPill.textContent = `🧪 ${this.combat.potions} Potion${this.combat.potions !== 1 ? 's' : ''}`;
    }

    // Enemy Info & HP
    const enemy = this.combat.enemy;
    const enemyName = document.getElementById('enemyName');
    const enemyTitle = document.getElementById('enemyTitle');
    const enemyHpFill = document.getElementById('enemyHpFill');
    const enemyHpText = document.getElementById('enemyHpText');
    const enemySvgContainer = document.getElementById('enemySvgContainer');
    const enemyIntentPill = document.getElementById('enemyIntentPill');

    if (enemyName) enemyName.textContent = enemy.name.split(' ')[0];
    if (enemyTitle) enemyTitle.textContent = enemy.title;

    const enemyPercent = Math.max(0, (this.combat.enemyHp / this.combat.enemyMaxHp) * 100);
    if (enemyHpFill) enemyHpFill.style.width = `${enemyPercent}%`;
    if (enemyHpText) enemyHpText.textContent = `${this.combat.enemyHp} / ${this.combat.enemyMaxHp} HP`;

    if (enemySvgContainer) {
      enemySvgContainer.innerHTML = this.renderMonsterSvg(enemy.spriteType);
    }

    // Enemy Status effects
    if (enemyIntentPill) {
      if (this.combat.enemyFrozen) {
        enemyIntentPill.className = 'enemy-intent-pill status-frozen';
        enemyIntentPill.textContent = '❄️ FROZEN (Skip turn)';
      } else if (this.combat.enemyBurnTurns > 0) {
        enemyIntentPill.className = 'enemy-intent-pill status-burning';
        enemyIntentPill.textContent = `🔥 BURNING (${this.combat.enemyBurnTurns} turns)`;
      } else {
        enemyIntentPill.className = 'enemy-intent-pill';
        enemyIntentPill.textContent = `⚔️ ${enemy.attackName}`;
      }
    }
  }

  updateWordRack() {
    const selected = this.board.getSelectedTiles();
    const rackTiles = document.getElementById('wordRackTiles');
    const placeholder = document.getElementById('rackPlaceholder');
    const spellStatus = document.getElementById('spellStatusText');
    const spellDamageCalc = document.getElementById('spellDamageCalc');
    const btnAttack = document.getElementById('btnAttack');

    if (!rackTiles) return;

    if (selected.length === 0) {
      rackTiles.innerHTML = '';
      if (placeholder) placeholder.style.display = 'block';
      if (spellStatus) spellStatus.textContent = 'Click runes below to weave an incantation';
      if (spellDamageCalc) spellDamageCalc.style.display = 'none';
      if (btnAttack) btnAttack.disabled = true;
      return;
    }

    if (placeholder) placeholder.style.display = 'none';

    // Render floating selected tiles
    rackTiles.innerHTML = selected.map((t, idx) => `
      <div class="rack-tile tile-${t.type} status-${t.status}" data-word-idx="${idx}" title="Click or Backspace to remove">
        <span class="tile-letter">${t.letter}</span>
        <span class="tile-score">${t.score}</span>
        ${t.type !== 'normal' ? `<span class="gem-indicator gem-${t.type}"></span>` : ''}
        ${t.status === 'cursed' ? `<span class="curse-icon">☠️</span>` : ''}
        ${t.status === 'burned' ? `<span class="burn-icon">🔥</span>` : ''}
      </div>
    `).join('');

    // Evaluate spell
    const spellEval = evaluateSpell(selected);
    if (spellEval.valid) {
      let effectPills = '';
      if (spellEval.effects.includes('burn')) effectPills += `<span class="effect-pill pill-burn">🔥 +50% & Burn</span>`;
      if (spellEval.effects.includes('freeze')) effectPills += `<span class="effect-pill pill-freeze">❄️ Freeze Enemy</span>`;
      if (spellEval.effects.includes('heal')) effectPills += `<span class="effect-pill pill-heal">💚 Heal +15 HP</span>`;
      if (spellEval.effects.includes('arcane')) effectPills += `<span class="effect-pill pill-arcane">🔮 Cleanse Curses</span>`;

      if (spellStatus) {
        spellStatus.innerHTML = `<span class="valid-word-title">✨ "${spellEval.word}" (${spellEval.length} letters)</span>`;
      }
      if (spellDamageCalc) {
        spellDamageCalc.style.display = 'flex';
        spellDamageCalc.innerHTML = `
          <div class="dmg-preview-badge">💥 ${spellEval.totalDamage} Damage</div>
          <div class="effects-badge-row">${effectPills}</div>
        `;
      }
      if (btnAttack) {
        btnAttack.disabled = this.combat.isProcessingTurn;
        btnAttack.classList.add('ready-to-cast');
      }
    } else {
      if (spellStatus) {
        spellStatus.innerHTML = `<span class="invalid-word-title">"${spellEval.word}" (Unknown Incantation)</span>`;
      }
      if (spellDamageCalc) spellDamageCalc.style.display = 'none';
      if (btnAttack) {
        btnAttack.disabled = true;
        btnAttack.classList.remove('ready-to-cast');
      }
    }
  }

  updateBoard() {
    const grid = document.getElementById('boardGrid');
    if (!grid) return;

    grid.innerHTML = this.board.tiles.map((tile, idx) => `
      <div class="board-tile tile-${tile.type} status-${tile.status} ${tile.selected ? 'tile-selected' : ''}" 
           data-board-index="${idx}"
           id="tile-${idx}">
        <div class="tile-inner">
          <span class="tile-letter">${tile.letter}</span>
          <span class="tile-score">${tile.score}</span>
          ${tile.type !== 'normal' ? `<span class="gem-badge gem-${tile.type}"></span>` : ''}
          ${tile.status === 'cursed' ? `<span class="status-overlay curse-smoke" title="Cursed: Recoils 5 HP if used">☠️</span>` : ''}
          ${tile.status === 'burned' ? `<span class="status-overlay burn-ember" title="Scorched: Burns tiles">🔥</span>` : ''}
        </div>
      </div>
    `).join('');
  }

  updateButtons() {
    const potionBadge = document.getElementById('potionBadge');
    const scrambleBadge = document.getElementById('scrambleBadge');
    const hintBadge = document.getElementById('hintBadge');
    const btnPotion = document.getElementById('btnPotion');
    const btnScramble = document.getElementById('btnScramble');
    const btnHint = document.getElementById('btnHint');

    if (potionBadge) potionBadge.textContent = this.combat.potions;
    if (scrambleBadge) scrambleBadge.textContent = this.combat.scrambles;
    if (hintBadge) hintBadge.textContent = this.combat.hints;

    if (btnPotion) btnPotion.disabled = this.combat.potions <= 0 || this.combat.playerHp >= this.combat.playerMaxHp;
    if (btnScramble) btnScramble.disabled = this.combat.scrambles <= 0;
    if (btnHint) btnHint.disabled = this.combat.hints <= 0;
  }

  setTicker(message) {
    const ticker = document.getElementById('tickerText');
    if (ticker) {
      ticker.textContent = message;
      ticker.classList.remove('ticker-flash');
      void ticker.offsetWidth; // trigger reflow
      ticker.classList.add('ticker-flash');
    }
  }

  showFloatingText(text, targetElement, type = 'damage') {
    const layer = document.getElementById('floatingTextLayer');
    if (!layer || !targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    const layerRect = layer.getBoundingClientRect();

    const el = document.createElement('div');
    el.className = `floating-number float-${type}`;
    el.textContent = text;

    const x = rect.left + rect.width / 2 - layerRect.left;
    const y = rect.top + rect.height / 3 - layerRect.top;

    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    layer.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1200);
  }

  triggerScreenShake(duration = 400) {
    const wrapper = document.getElementById('gameWrapper');
    if (!wrapper) return;
    wrapper.classList.add('screen-shake');
    setTimeout(() => {
      wrapper.classList.remove('screen-shake');
    }, duration);
  }

  triggerSpellProjectile(spellEval) {
    const heroAvatar = document.getElementById('heroAvatar');
    const enemyAvatar = document.getElementById('enemyAvatar');
    if (!heroAvatar || !enemyAvatar) return;

    const hRect = heroAvatar.getBoundingClientRect();
    const eRect = enemyAvatar.getBoundingClientRect();

    const projectile = document.createElement('div');
    projectile.className = `spell-projectile spell-fx-${spellEval.effects[0] || 'arcane'}`;
    projectile.style.left = `${hRect.right}px`;
    projectile.style.top = `${hRect.top + hRect.height / 2}px`;
    document.body.appendChild(projectile);

    setTimeout(() => {
      projectile.style.transform = `translate(${eRect.left - hRect.right}px, ${eRect.top - hRect.top}px) scale(1.6)`;
      projectile.style.opacity = '1';
    }, 20);

    setTimeout(() => {
      if (projectile.parentNode) projectile.parentNode.removeChild(projectile);
    }, 450);
  }

  showModal(title, bodyHtml, buttons = []) {
    const backdrop = document.getElementById('modalBackdrop');
    const content = document.getElementById('modalContent');
    if (!backdrop || !content) return;

    content.innerHTML = `
      <div class="modal-header">
        <h2 class="modal-title">✦ ${title} ✦</h2>
      </div>
      <div class="modal-body">
        ${bodyHtml}
      </div>
      <div class="modal-footer">
        ${buttons.map((b, i) => `
          <button class="action-btn ${b.primary ? 'primary-modal-btn' : 'secondary-modal-btn'}" id="modal-btn-${i}">
            ${b.label}
          </button>
        `).join('')}
      </div>
    `;

    buttons.forEach((b, i) => {
      const btn = document.getElementById(`modal-btn-${i}`);
      if (btn) {
        btn.onclick = () => {
          this.hideModal();
          if (b.onClick) b.onClick();
        };
      }
    });

    backdrop.classList.remove('hidden');
  }

  hideModal() {
    const backdrop = document.getElementById('modalBackdrop');
    if (backdrop) backdrop.classList.add('hidden');
  }
}
