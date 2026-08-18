import { STAGES } from '../data/stages.js';
import { evaluateSpell, findBestWordFromLetters } from '../data/dictionary.js';

export class CombatEngine {
  constructor(board) {
    this.board = board;
    this.stageIndex = 0;
    this.playerMaxHp = 100;
    this.playerHp = 100;
    this.potions = 2;
    this.scrambles = 2;
    this.hints = 2;

    this.enemy = null;
    this.enemyHp = 0;
    this.enemyMaxHp = 0;
    this.enemyFrozen = false;
    this.enemyBurnTurns = 0;

    this.isProcessingTurn = false;
    this.combatLog = [];
  }

  startStage(index = 0) {
    this.stageIndex = Math.min(index, STAGES.length - 1);
    const stage = STAGES[this.stageIndex];
    this.enemy = { ...stage.enemy };
    this.enemyMaxHp = stage.enemy.maxHp;
    this.enemyHp = stage.enemy.maxHp;
    this.enemyFrozen = false;
    this.enemyBurnTurns = 0;
    this.potions = 2;
    this.scrambles = 2;
    this.hints = 2;

    this.board.init();
    this.combatLog = [`Encounter started: ${this.enemy.name} appears!`];
  }

  getCurrentStage() {
    return STAGES[this.stageIndex];
  }

  usePotion() {
    if (this.potions <= 0 || this.playerHp >= this.playerMaxHp || this.isProcessingTurn) {
      return { success: false, reason: 'Cannot use potion' };
    }
    this.potions--;
    const healAmount = Math.min(35, this.playerMaxHp - this.playerHp);
    this.playerHp += healAmount;
    this.combatLog.push(`Alistair quaffs a Vitality Potion (+${healAmount} HP).`);
    return { success: true, healAmount, playerHp: this.playerHp, potions: this.potions };
  }

  useScramble() {
    if (this.scrambles <= 0 || this.isProcessingTurn) {
      return { success: false, reason: 'No scrambles remaining' };
    }
    this.scrambles--;
    this.board.shuffle();
    this.combatLog.push('Alistair channels mystic wind to scramble the runes!');
    return { success: true, scrambles: this.scrambles };
  }

  useHint() {
    if (this.hints <= 0) {
      return { success: false, reason: 'No hints left' };
    }
    const letters = this.board.tiles.map(t => t.letter);
    const bestWord = findBestWordFromLetters(letters);
    if (!bestWord) {
      return { success: false, reason: 'No valid words found, try Scramble!' };
    }
    this.hints--;
    this.combatLog.push(`Arcane Insight reveals a powerful word: "${bestWord}"!`);
    return { success: true, word: bestWord, hints: this.hints };
  }

  /**
   * Execute player attack spell
   */
  async executePlayerAttack(onEvent) {
    if (this.isProcessingTurn) return;
    const selected = this.board.getSelectedTiles();
    const spellEval = evaluateSpell(selected);

    if (!spellEval.valid) {
      return { error: 'Invalid word' };
    }

    this.isProcessingTurn = true;

    // 1. Calculate and apply player spell effects
    let damage = spellEval.totalDamage;
    let healAmount = 0;
    let cleansed = false;

    // Check amethyst cleanse
    if (spellEval.effects.includes('arcane')) {
      this.board.cleanseAllStatuses();
      cleansed = true;
    }

    // Check emerald heal
    if (spellEval.effects.includes('heal')) {
      healAmount = Math.min(15, this.playerMaxHp - this.playerHp);
      this.playerHp += healAmount;
    }

    // Check ruby burn
    if (spellEval.effects.includes('burn')) {
      this.enemyBurnTurns = 2;
    }

    // Check sapphire freeze
    if (spellEval.effects.includes('freeze')) {
      this.enemyFrozen = true;
    }

    // Check cursed tiles penalty (unless cleansed)
    let cursePenalty = 0;
    if (!cleansed) {
      const cursedCount = selected.filter(t => t.status === 'cursed').length;
      if (cursedCount > 0) {
        cursePenalty = cursedCount * 5;
        this.playerHp = Math.max(1, this.playerHp - cursePenalty);
      }
    }

    // Apply damage to enemy
    this.enemyHp = Math.max(0, this.enemyHp - damage);

    this.combatLog.push(
      `Alistair casts "${spellEval.word}" dealing ${damage} damage!` +
      (healAmount > 0 ? ` (Healed +${healAmount} HP)` : '') +
      (cursePenalty > 0 ? ` (Curse recoil: -${cursePenalty} HP)` : '')
    );

    // Trigger UI animation for player attack
    if (onEvent) {
      await onEvent('player_attack', {
        spellEval,
        damage,
        healAmount,
        cursePenalty,
        enemyHp: this.enemyHp,
        playerHp: this.playerHp,
        enemyMaxHp: this.enemyMaxHp,
        playerMaxHp: this.playerMaxHp
      });
    }

    // Replace used tiles
    this.board.replaceSelectedTiles();

    // Check if monster defeated
    if (this.enemyHp <= 0) {
      this.isProcessingTurn = false;
      const isFinalStage = this.stageIndex >= STAGES.length - 1;
      this.combatLog.push(`${this.enemy.name} has been vanquished!`);

      if (onEvent) {
        await onEvent('enemy_defeated', {
          isFinalStage,
          stageIndex: this.stageIndex
        });
      }

      return { outcome: isFinalStage ? 'game_won' : 'stage_won' };
    }

    // 2. Monster Turn
    await new Promise(r => setTimeout(r, 600));

    let monsterDamage = 0;
    let monsterAction = 'attack';
    let monsterSkipped = false;

    // Handle Burn damage on enemy
    if (this.enemyBurnTurns > 0) {
      const burnDmg = 8;
      this.enemyHp = Math.max(0, this.enemyHp - burnDmg);
      this.enemyBurnTurns--;
      this.combatLog.push(`${this.enemy.name} suffers ${burnDmg} burn damage!`);
      if (onEvent) {
        await onEvent('enemy_burn', { burnDmg, enemyHp: this.enemyHp });
      }

      if (this.enemyHp <= 0) {
        this.isProcessingTurn = false;
        const isFinalStage = this.stageIndex >= STAGES.length - 1;
        if (onEvent) {
          await onEvent('enemy_defeated', { isFinalStage, stageIndex: this.stageIndex });
        }
        return { outcome: isFinalStage ? 'game_won' : 'stage_won' };
      }
    }

    // Handle Frozen enemy
    if (this.enemyFrozen) {
      this.enemyFrozen = false;
      monsterSkipped = true;
      this.combatLog.push(`${this.enemy.name} is frozen solid and skips their turn!`);
      if (onEvent) {
        await onEvent('enemy_frozen_skip', {});
      }
    } else {
      // Enemy attacks player
      const rawAtk = Math.floor(
        Math.random() * (this.enemy.attackMax - this.enemy.attackMin + 1)
      ) + this.enemy.attackMin;
      monsterDamage = rawAtk;
      this.playerHp = Math.max(0, this.playerHp - monsterDamage);

      // Enemy special abilities
      if (this.enemy.specialAbility === 'curse_tile' && Math.random() < 0.6) {
        const cursed = this.board.curseRandomTiles(2);
        monsterAction = 'curse';
        this.combatLog.push(`${this.enemy.name} strikes for ${monsterDamage} DMG and curses ${cursed.length} rune tiles!`);
      } else if (this.enemy.specialAbility === 'burn_tile' && Math.random() < 0.6) {
        const burned = this.board.burnRandomTiles(2);
        monsterAction = 'burn';
        this.combatLog.push(`${this.enemy.name} breathes fire for ${monsterDamage} DMG and scorches ${burned.length} tiles!`);
      } else {
        this.combatLog.push(`${this.enemy.name} uses ${this.enemy.attackName} dealing ${monsterDamage} damage!`);
      }

      if (onEvent) {
        await onEvent('enemy_attack', {
          monsterDamage,
          monsterAction,
          attackName: this.enemy.attackName,
          playerHp: this.playerHp,
          playerMaxHp: this.playerMaxHp
        });
      }
    }

    this.isProcessingTurn = false;

    // Check player defeat
    if (this.playerHp <= 0) {
      this.combatLog.push('Alistair has succumbed in battle...');
      if (onEvent) {
        await onEvent('player_defeated', {});
      }
      return { outcome: 'game_over' };
    }

    return { outcome: 'turn_complete' };
  }
}
