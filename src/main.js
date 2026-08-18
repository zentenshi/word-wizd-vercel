import './style.css';
import { Board } from './game/board.js';
import { CombatEngine } from './game/combat.js';
import { UIRenderer } from './ui/renderer.js';
import { soundManager } from './audio/soundManager.js';
import { STAGES, EPILOGUE_STORY } from './data/stages.js';
import { evaluateSpell } from './data/dictionary.js';

class WordWizGame {
  constructor() {
    this.board = new Board(4);
    this.combat = new CombatEngine(this.board);
    this.ui = new UIRenderer(this.board, this.combat);
  }

  start() {
    this.combat.startStage(0);
    this.ui.init();
    this.bindEvents();

    // Show Story Prologue on first load
    this.showPrologue();
  }

  bindEvents() {
    // 1. Board Tile Clicks (delegation)
    document.addEventListener('click', (e) => {
      const tileEl = e.target.closest('.board-tile');
      if (tileEl && !this.combat.isProcessingTurn) {
        const boardIdx = parseInt(tileEl.dataset.boardIndex, 10);
        this.handleTileClick(boardIdx);
        return;
      }

      // 2. Word Rack Tile Clicks (remove from word)
      const rackTile = e.target.closest('.rack-tile');
      if (rackTile && !this.combat.isProcessingTurn) {
        const wordIdx = parseInt(rackTile.dataset.wordIdx, 10);
        this.handleRackTileClick(wordIdx);
        return;
      }
    });

    // 3. Action Buttons
    const btnAttack = document.getElementById('btnAttack');
    if (btnAttack) {
      btnAttack.addEventListener('click', () => this.handleCastSpell());
    }

    const btnPotion = document.getElementById('btnPotion');
    if (btnPotion) {
      btnPotion.addEventListener('click', () => this.handlePotion());
    }

    const btnScramble = document.getElementById('btnScramble');
    if (btnScramble) {
      btnScramble.addEventListener('click', () => this.handleScramble());
    }

    const btnHint = document.getElementById('btnHint');
    if (btnHint) {
      btnHint.addEventListener('click', () => this.handleHint());
    }

    const btnClear = document.getElementById('btnClear');
    if (btnClear) {
      btnClear.addEventListener('click', () => this.handleClear());
    }

    // 4. Header Buttons
    const btnMusic = document.getElementById('btnMusic');
    if (btnMusic) {
      btnMusic.addEventListener('click', () => {
        const playing = soundManager.toggleMusic();
        btnMusic.textContent = playing ? '🎵 Music' : '🔇 Music';
      });
    }

    const btnSound = document.getElementById('btnSound');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const active = soundManager.toggleSFX();
        btnSound.textContent = active ? '🔊 SFX' : '🔇 SFX';
      });
    }

    const btnLore = document.getElementById('btnLore');
    if (btnLore) {
      btnLore.addEventListener('click', () => this.showLoreModal());
    }

    const btnHelp = document.getElementById('btnHelp');
    if (btnHelp) {
      btnHelp.addEventListener('click', () => this.showHelpModal());
    }

    // Auto-start BGM on first user interaction anywhere
    const startAudioOnGesture = () => {
      soundManager.startBGM();
      window.removeEventListener('click', startAudioOnGesture);
      window.removeEventListener('keydown', startAudioOnGesture);
    };
    window.addEventListener('click', startAudioOnGesture, { once: true });
    window.addEventListener('keydown', startAudioOnGesture, { once: true });

    // 5. Keyboard Navigation & Typing
    window.addEventListener('keydown', (e) => {
      // Don't capture when modal is open
      const modal = document.getElementById('modalBackdrop');
      if (modal && !modal.classList.contains('hidden')) {
        if (e.key === 'Escape' || e.key === 'Enter') {
          this.ui.hideModal();
        }
        return;
      }

      if (this.combat.isProcessingTurn) return;

      const key = e.key.toUpperCase();

      // Typing letters A-Z
      if (/^[A-Z]$/.test(key)) {
        this.handleLetterTyping(key);
      } else if (e.key === 'Backspace') {
        const selected = this.board.getSelectedTiles();
        if (selected.length > 0) {
          this.handleRackTileClick(selected.length - 1);
        }
      } else if (e.key === 'Enter') {
        const selected = this.board.getSelectedTiles();
        const spell = evaluateSpell(selected);
        if (spell.valid) {
          this.handleCastSpell();
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        this.handleScramble();
      } else if (key === 'P') {
        this.handlePotion();
      } else if (key === 'H') {
        this.handleHint();
      } else if (e.key === 'Escape') {
        this.handleClear();
      }
    });
  }

  handleTileClick(boardIdx) {
    const tile = this.board.tiles[boardIdx];
    if (!tile) return;

    if (tile.selected) {
      // Deselect
      this.board.deselectTileByIndex(boardIdx);
      soundManager.playTileDeselect();
    } else {
      // Select
      this.board.selectTile(boardIdx);
      const selCount = this.board.selectedIndices.length;
      soundManager.playTileClick(selCount);
      
      const spell = evaluateSpell(this.board.getSelectedTiles());
      if (spell.valid) {
        soundManager.playValidWord();
      }
    }

    this.ui.updateWordRack();
    this.ui.updateBoard();
  }

  handleRackTileClick(wordIdx) {
    this.board.deselectAtWordPosition(wordIdx);
    soundManager.playTileDeselect();
    this.ui.updateWordRack();
    this.ui.updateBoard();
  }

  handleLetterTyping(char) {
    // Find first unselected tile matching letter
    const index = this.board.tiles.findIndex(t => t.letter === char && !t.selected);
    if (index !== -1) {
      this.handleTileClick(index);
    }
  }

  async handleCastSpell() {
    if (this.combat.isProcessingTurn) return;

    const selected = this.board.getSelectedTiles();
    const spell = evaluateSpell(selected);
    if (!spell.valid) return;

    soundManager.playCastSpell(spell.effects[0] || 'normal');

    await this.combat.executePlayerAttack(async (eventType, data) => {
      if (eventType === 'player_attack') {
        // Projectile + Damage on enemy
        this.ui.triggerSpellProjectile(data.spellEval);
        
        await new Promise(r => setTimeout(r, 220));

        const enemyAvatar = document.getElementById('enemyAvatar');
        this.ui.showFloatingText(`-${data.damage}`, enemyAvatar, 'damage');
        this.ui.triggerScreenShake(300);

        if (data.healAmount > 0) {
          const heroAvatar = document.getElementById('heroAvatar');
          this.ui.showFloatingText(`+${data.healAmount} HP`, heroAvatar, 'heal');
          soundManager.playHeal();
        }

        if (data.cursePenalty > 0) {
          const heroAvatar = document.getElementById('heroAvatar');
          this.ui.showFloatingText(`-${data.cursePenalty} HP`, heroAvatar, 'recoil');
        }

        this.ui.updateUnits();
        this.ui.updateWordRack();
        this.ui.updateBoard();
        this.ui.setTicker(`Alistair casts "${data.spellEval.word}" for ${data.damage} damage!`);
      } 
      else if (eventType === 'enemy_burn') {
        const enemyAvatar = document.getElementById('enemyAvatar');
        this.ui.showFloatingText(`-${data.burnDmg} Burn`, enemyAvatar, 'damage');
        this.ui.updateUnits();
      }
      else if (eventType === 'enemy_frozen_skip') {
        this.ui.setTicker('❄️ The enemy is frozen in ice and loses their turn!');
        this.ui.updateUnits();
      }
      else if (eventType === 'enemy_attack') {
        soundManager.playEnemyAttack();
        const heroAvatar = document.getElementById('heroAvatar');
        this.ui.showFloatingText(`-${data.monsterDamage}`, heroAvatar, 'damage');
        this.ui.triggerScreenShake(350);
        this.ui.updateUnits();
        this.ui.updateBoard();
        this.ui.setTicker(`Enemy attacks with ${data.attackName} dealing ${data.monsterDamage} damage!`);
      }
      else if (eventType === 'enemy_defeated') {
        soundManager.playVictory();
        await new Promise(r => setTimeout(r, 600));
        this.handleStageVictory(data.isFinalStage, data.stageIndex);
      }
      else if (eventType === 'player_defeated') {
        soundManager.playGameOver();
        await new Promise(r => setTimeout(r, 600));
        this.handleGameOver();
      }
    });

    this.ui.updateAll();
  }

  handlePotion() {
    const res = this.combat.usePotion();
    if (res.success) {
      soundManager.playPotion();
      const heroAvatar = document.getElementById('heroAvatar');
      this.ui.showFloatingText(`+${res.healAmount} HP`, heroAvatar, 'heal');
      this.ui.updateUnits();
      this.ui.updateButtons();
      this.ui.setTicker(`Quaffed potion: Restored +${res.healAmount} HP.`);
    }
  }

  handleScramble() {
    const res = this.combat.useScramble();
    if (res.success) {
      soundManager.playScramble();
      this.ui.updateAll();
      this.ui.setTicker('Mystic winds reshuffled the runes!');
    }
  }

  handleHint() {
    const res = this.combat.useHint();
    if (res.success) {
      soundManager.playValidWord();
      this.ui.updateButtons();
      this.ui.setTicker(`💡 Arcane Insight suggests: "${res.word}"!`);
      this.ui.showModal(
        'Arcane Insight',
        `<p>Your spellbook reveals a potent anagram hidden in the current runes:</p>
         <div style="text-align:center; font-size:1.6rem; color:#ffd700; margin:1rem 0; font-weight:800; letter-spacing:2px;">
           "${res.word}"
         </div>
         <p style="color:#81c784; text-align:center;">Form this incantation to strike with high power!</p>`,
        [{ label: 'I Understand', primary: true }]
      );
    } else {
      this.ui.setTicker(res.reason);
    }
  }

  handleClear() {
    this.board.clearSelection();
    soundManager.playTileDeselect();
    this.ui.updateWordRack();
    this.ui.updateBoard();
  }

  handleStageVictory(isFinalStage, stageIndex) {
    if (isFinalStage) {
      // Grand Epilogue
      this.ui.showModal(
        EPILOGUE_STORY.title,
        `
        <div style="text-align:center; font-size:2.5rem; margin-bottom:0.8rem;">✨🏆✨</div>
        <p>${EPILOGUE_STORY.body}</p>
        <div style="background:rgba(255,215,0,0.15); border:1px solid #ffd700; padding:0.8rem; border-radius:12px; margin-top:1rem; text-align:center;">
          <strong style="color:#ffd700;">Quest Completed!</strong><br/>
          You conquered all 3 realms with the power of language!
        </div>
        `,
        [
          {
            label: 'Play Again',
            primary: true,
            onClick: () => {
              this.combat.startStage(0);
              this.ui.updateAll();
            }
          }
        ]
      );
    } else {
      const currentStage = STAGES[stageIndex];
      const nextStage = STAGES[stageIndex + 1];

      this.ui.showModal(
        'Realm Cleared!',
        `
        <p><strong>${currentStage.enemy.name}</strong> has been vanquished!</p>
        <p>${currentStage.victoryDialogue}</p>
        <div style="background:rgba(0,230,118,0.15); border:1px solid #00e676; padding:0.8rem; border-radius:12px; margin:1rem 0;">
          <h4 style="color:#69f0ae; margin-bottom:0.3rem;">Rewards Restocked:</h4>
          <div>🧪 Potions refilled (x2) | 🌀 Scrambles refilled (x2) | 💡 Hints refilled (x2)</div>
        </div>
        <p>Prepare to venture into <strong>${nextStage.name}</strong>!</p>
        `,
        [
          {
            label: `Enter ${nextStage.name} ➔`,
            primary: true,
            onClick: () => {
              this.combat.startStage(stageIndex + 1);
              this.ui.updateAll();
              this.ui.setTicker(`Entered ${nextStage.name}!`);
            }
          }
        ]
      );
    }
  }

  handleGameOver() {
    this.ui.showModal(
      'Defeat in the Shadows',
      `
      <div style="text-align:center; font-size:2.2rem; margin-bottom:0.8rem;">💀</div>
      <p>Alistair was overwhelmed by the dark forces. But the thought of his sick wife and son rekindles the arcane spark in his heart...</p>
      <p style="color:#ff8a80; text-align:center;">Do not give up, WordWiz!</p>
      `,
      [
        {
          label: 'Retry Stage',
          primary: true,
          onClick: () => {
            this.combat.startStage(this.combat.stageIndex);
            this.ui.updateAll();
          }
        },
        {
          label: 'Restart Quest',
          primary: false,
          onClick: () => {
            this.combat.startStage(0);
            this.ui.updateAll();
          }
        }
      ]
    );
  }

  showPrologue() {
    this.ui.showModal(
      'The Quest of WordWiz',
      `
      <p>In the quiet village of Eldoria, dark magic has struck the family of <strong>Alistair the Archmage</strong>. His beloved wife and young son have fallen into a deep, life-threatening magical slumber.</p>
      <p>Ancient texts speak of the <em>Panacea Incantation</em> — a supreme spell capable of curing any illness. It lies locked at the summit of the Infernal Spire, guarded by deadly creatures.</p>
      <p>Armed with his arcane spellbook, Alistair sets forth to conquer the beasts using the ancient power of words!</p>
      <div style="background:rgba(212,175,55,0.12); border:1px solid #d4af37; padding:0.6rem; border-radius:10px; margin-top:0.8rem; font-size:0.85rem;">
        <strong>How to Battle:</strong> Click letters in the 4x4 grid (or type on keyboard) to form valid words. Longer words cast massive damage and activate elemental runes!
      </div>
      `,
      [{ label: 'Begin the Journey ✦', primary: true }]
    );
  }

  showLoreModal() {
    const stage = this.combat.getCurrentStage();
    this.ui.showModal(
      stage.name,
      `
      <p>${stage.introStory}</p>
      <p style="font-style:italic; color:#ffd700; margin-top:0.8rem;">
        "${stage.enemy.dialogue}"
      </p>
      <p style="margin-top:0.8rem; font-size:0.85rem; color:#81c784;">
        <strong>Objective:</strong> Spell valid English incantations from the 16 rune tiles to defeat ${stage.enemy.name} and advance.
      </p>
      `,
      [{ label: 'Return to Battle', primary: true }]
    );
  }

  showHelpModal() {
    this.ui.showModal(
      'Spellcaster Grimoire Guide',
      `
      <div style="font-size:0.9rem;">
        <h4 style="color:#ffd700; margin-bottom:0.4rem;">✦ Word Scoring & Damage</h4>
        <p>Damage scales with word length + Scrabble letter point values:</p>
        <ul style="margin: 0.4rem 0 0.8rem 1.2rem;">
          <li><strong>2-3 Letters:</strong> Minor Spells (6 - 12 DMG)</li>
          <li><strong>4-5 Letters:</strong> Great Incantations (22 - 38 DMG)</li>
          <li><strong>6-8+ Letters:</strong> Cataclysmic Arcana (58 - 115+ DMG!)</li>
        </ul>

        <h4 style="color:#ffd700; margin-bottom:0.4rem;">✦ Elemental Gem Runes</h4>
        <ul style="margin: 0.4rem 0 0.8rem 1.2rem;">
          <li><strong style="color:#ff1744;">💎 Ruby (Fire):</strong> +50% total damage & applies Burning over time!</li>
          <li><strong style="color:#00e5ff;">🔷 Sapphire (Frost):</strong> Freezes the enemy, forcing them to skip their next attack!</li>
          <li><strong style="color:#00e676;">💚 Emerald (Life):</strong> Instantly heals Alistair for +15 HP!</li>
          <li><strong style="color:#d500f9;">🔮 Amethyst (Arcane):</strong> +10 flat damage & cleanses all curses from the board!</li>
          <li><strong style="color:#ffc400;">🌟 Gold Tile:</strong> 2x multiplier on letter point value!</li>
        </ul>

        <h4 style="color:#ffd700; margin-bottom:0.4rem;">✦ Controls & Shortcuts</h4>
        <p>• Type <strong>A-Z</strong> on keyboard to pick tiles</p>
        <p>• <strong>Backspace</strong> to remove last letter | <strong>Enter</strong> to cast</p>
        <p>• <strong>P</strong> for Potion | <strong>Space</strong> for Scramble | <strong>H</strong> for Hint</p>
      </div>
      `,
      [{ label: 'Close Grimoire', primary: true }]
    );
  }
}

// Boot game when DOM is ready
function initGame() {
  const game = new WordWizGame();
  game.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
