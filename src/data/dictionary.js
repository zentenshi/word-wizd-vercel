import { VALID_WORDS_SET } from './dictionaryData.js';

export const LETTER_SCORES = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

// Weighted letter pool for realistic English word generation
export const LETTER_WEIGHTS = {
  E: 12, A: 9, I: 9, O: 8, N: 6, R: 6, T: 6, L: 5, S: 5, U: 5,
  D: 4, G: 3, B: 2, C: 3, M: 3, P: 3, F: 2, H: 3, V: 2, W: 2, Y: 2,
  K: 1, J: 1, X: 1, Q: 1, Z: 1
};

export const TILE_TYPES = {
  NORMAL: 'normal',
  RUBY: 'ruby',       // +50% fire damage & burns monster
  SAPPHIRE: 'sapphire', // Freezes monster (skips enemy turn)
  EMERALD: 'emerald',   // Heals player for 15 HP
  AMETHYST: 'amethyst', // +10 arcane damage + cleanses curses
  GOLD: 'gold'          // 2x letter score multiplier
};

export function isValidWord(word) {
  if (!word || word.length < 2) return false;
  return VALID_WORDS_SET.has(word.toUpperCase());
}

export function getLetterScore(letter) {
  return LETTER_SCORES[letter.toUpperCase()] || 1;
}

export function calculateBaseDamage(length) {
  if (length < 2) return 0;
  switch (length) {
    case 2: return 6;
    case 3: return 12;
    case 4: return 22;
    case 5: return 38;
    case 6: return 58;
    case 7: return 84;
    case 8: return 115;
    default: return 115 + (length - 8) * 35;
  }
}

/**
 * Calculates total damage and bonuses from word + tile gems
 * @param {Array<{letter: string, type: string}>} selectedTiles
 */
export function evaluateSpell(selectedTiles) {
  const word = selectedTiles.map(t => t.letter).join('').toUpperCase();
  const valid = isValidWord(word);
  if (!valid) {
    return {
      word,
      valid: false,
      totalDamage: 0,
      baseDamage: 0,
      letterPoints: 0,
      effects: [],
      breakdown: 'Invalid Word'
    };
  }

  let letterPointsTotal = 0;
  let multiplier = 1.0;
  let flatBonus = 0;
  const effects = [];

  for (const tile of selectedTiles) {
    let pts = getLetterScore(tile.letter);
    if (tile.type === TILE_TYPES.GOLD) {
      pts *= 2;
    }
    letterPointsTotal += pts;

    if (tile.type === TILE_TYPES.RUBY) {
      multiplier += 0.5;
      if (!effects.includes('burn')) effects.push('burn');
    } else if (tile.type === TILE_TYPES.SAPPHIRE) {
      if (!effects.includes('freeze')) effects.push('freeze');
    } else if (tile.type === TILE_TYPES.EMERALD) {
      if (!effects.includes('heal')) effects.push('heal');
    } else if (tile.type === TILE_TYPES.AMETHYST) {
      flatBonus += 10;
      if (!effects.includes('arcane')) effects.push('arcane');
    }
  }

  const baseDamage = calculateBaseDamage(word.length);
  const totalDamage = Math.round((baseDamage + letterPointsTotal + flatBonus) * multiplier);

  return {
    word,
    valid: true,
    length: word.length,
    baseDamage,
    letterPoints: letterPointsTotal,
    flatBonus,
    multiplier,
    totalDamage,
    effects,
    breakdown: `${word} (${word.length} letters, ${totalDamage} DMG)`
  };
}

/**
 * Find highest-scoring valid word possible from current board letters (for Hint)
 * @param {Array<string>} letters - array of 16 letters
 */
export function findBestWordFromLetters(letters) {
  const letterCounts = {};
  for (const l of letters) {
    const upper = l.toUpperCase();
    letterCounts[upper] = (letterCounts[upper] || 0) + 1;
  }

  let bestWord = '';
  let maxScore = -1;

  for (const candidate of VALID_WORDS_SET) {
    if (candidate.length < 3 || candidate.length > 8) continue;
    
    // Check if candidate can be formed
    const counts = { ...letterCounts };
    let possible = true;
    for (let i = 0; i < candidate.length; i++) {
      const char = candidate[i];
      if (!counts[char] || counts[char] <= 0) {
        possible = false;
        break;
      }
      counts[char]--;
    }

    if (possible) {
      const score = calculateBaseDamage(candidate.length);
      if (score > maxScore || (score === maxScore && candidate.length > bestWord.length)) {
        maxScore = score;
        bestWord = candidate;
      }
    }
  }

  return bestWord;
}
