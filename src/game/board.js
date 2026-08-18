import { LETTER_WEIGHTS, getLetterScore, TILE_TYPES } from '../data/dictionary.js';

const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const CONSONANTS = Object.keys(LETTER_WEIGHTS).filter(l => !VOWELS.includes(l));

export class Board {
  constructor(size = 4) {
    this.size = size;
    this.totalTiles = size * size; // 16
    this.tiles = [];
    this.selectedIndices = []; // array of board indices in selection order
    this.nextTileId = 1;
  }

  /**
   * Weighted random letter selection
   */
  getRandomLetter(isVowel = false) {
    const pool = isVowel ? VOWELS : Object.keys(LETTER_WEIGHTS);
    let totalWeight = 0;
    for (const l of pool) {
      totalWeight += LETTER_WEIGHTS[l] || 1;
    }
    let r = Math.random() * totalWeight;
    for (const l of pool) {
      const w = LETTER_WEIGHTS[l] || 1;
      if (r < w) return l;
      r -= w;
    }
    return pool[0];
  }

  /**
   * Determine special tile type
   */
  rollTileType() {
    const r = Math.random();
    if (r < 0.05) return TILE_TYPES.RUBY;       // 5% Ruby (+50% dmg, burn)
    if (r < 0.09) return TILE_TYPES.SAPPHIRE;   // 4% Sapphire (freeze enemy)
    if (r < 0.13) return TILE_TYPES.EMERALD;    // 4% Emerald (heal 15 HP)
    if (r < 0.17) return TILE_TYPES.AMETHYST;   // 4% Amethyst (+10 dmg, cleanse)
    if (r < 0.22) return TILE_TYPES.GOLD;       // 5% Gold (2x letter score)
    return TILE_TYPES.NORMAL;
  }

  createTile(forceVowel = false) {
    const letter = this.getRandomLetter(forceVowel);
    const type = this.rollTileType();
    const score = getLetterScore(letter);
    return {
      id: this.nextTileId++,
      letter,
      score,
      type,
      status: 'normal', // 'normal', 'cursed', 'burned'
      selected: false
    };
  }

  init() {
    this.tiles = [];
    this.selectedIndices = [];

    // Ensure at least 4 vowels in 16 tiles
    const vowelSlots = new Set();
    while (vowelSlots.size < 4) {
      vowelSlots.add(Math.floor(Math.random() * this.totalTiles));
    }

    for (let i = 0; i < this.totalTiles; i++) {
      const isVowel = vowelSlots.has(i);
      this.tiles.push(this.createTile(isVowel));
    }
    this.ensurePlayableBoard();
  }

  ensurePlayableBoard() {
    let vowelCount = this.tiles.filter(t => VOWELS.includes(t.letter)).length;
    if (vowelCount < 3) {
      for (let i = 0; i < this.tiles.length && vowelCount < 4; i++) {
        if (!VOWELS.includes(this.tiles[i].letter)) {
          this.tiles[i].letter = this.getRandomLetter(true);
          this.tiles[i].score = getLetterScore(this.tiles[i].letter);
          vowelCount++;
        }
      }
    }
  }

  selectTile(index) {
    if (index < 0 || index >= this.totalTiles) return null;
    const tile = this.tiles[index];
    if (!tile || tile.selected) return null;

    tile.selected = true;
    this.selectedIndices.push(index);
    return tile;
  }

  deselectTileByIndex(index) {
    const pos = this.selectedIndices.indexOf(index);
    if (pos === -1) return null;

    this.selectedIndices.splice(pos, 1);
    this.tiles[index].selected = false;
    return this.tiles[index];
  }

  deselectAtWordPosition(pos) {
    if (pos < 0 || pos >= this.selectedIndices.length) return null;
    const index = this.selectedIndices[pos];
    this.selectedIndices.splice(pos, 1);
    this.tiles[index].selected = false;
    return this.tiles[index];
  }

  clearSelection() {
    for (const idx of this.selectedIndices) {
      if (this.tiles[idx]) {
        this.tiles[idx].selected = false;
      }
    }
    this.selectedIndices = [];
  }

  getSelectedTiles() {
    return this.selectedIndices.map(idx => this.tiles[idx]).filter(Boolean);
  }

  /**
   * Replaces used tiles with fresh tiles, keeping non-used intact
   */
  replaceSelectedTiles() {
    const replaced = [];
    for (const idx of this.selectedIndices) {
      const newTile = this.createTile(false);
      this.tiles[idx] = newTile;
      replaced.push({ index: idx, tile: newTile });
    }
    this.selectedIndices = [];
    this.ensurePlayableBoard();
    return replaced;
  }

  shuffle() {
    this.clearSelection();
    // Re-roll all non-special tiles, or shuffle positions
    for (let i = 0; i < this.totalTiles; i++) {
      this.tiles[i] = this.createTile(false);
    }
    this.ensurePlayableBoard();
  }

  curseRandomTiles(count = 1) {
    const uncursed = [];
    this.tiles.forEach((t, i) => {
      if (t.status !== 'cursed') uncursed.push(i);
    });
    const cursedIndices = [];
    for (let k = 0; k < count && uncursed.length > 0; k++) {
      const randIdx = Math.floor(Math.random() * uncursed.length);
      const chosen = uncursed.splice(randIdx, 1)[0];
      this.tiles[chosen].status = 'cursed';
      cursedIndices.push(chosen);
    }
    return cursedIndices;
  }

  burnRandomTiles(count = 1) {
    const unburned = [];
    this.tiles.forEach((t, i) => {
      if (t.status !== 'burned') unburned.push(i);
    });
    const burnedIndices = [];
    for (let k = 0; k < count && unburned.length > 0; k++) {
      const randIdx = Math.floor(Math.random() * unburned.length);
      const chosen = unburned.splice(randIdx, 1)[0];
      this.tiles[chosen].status = 'burned';
      burnedIndices.push(chosen);
    }
    return burnedIndices;
  }

  cleanseAllStatuses() {
    for (const tile of this.tiles) {
      tile.status = 'normal';
    }
  }
}
