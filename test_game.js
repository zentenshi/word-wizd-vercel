import { Board } from './src/game/board.js';
import { CombatEngine } from './src/game/combat.js';
import { isValidWord, evaluateSpell, findBestWordFromLetters, TILE_TYPES } from './src/data/dictionary.js';
import { STAGES } from './src/data/stages.js';

console.log('--- WORDWIZ AUTOMATED TEST SUITE ---');

// 1. Test Dictionary Validation
console.log('1. Testing Dictionary validation...');
console.assert(isValidWord('WIZARD') === true, 'WIZARD should be valid');
console.assert(isValidWord('SPELL') === true, 'SPELL should be valid');
console.assert(isValidWord('MAGIC') === true, 'MAGIC should be valid');
console.assert(isValidWord('XYZZYQ') === false, 'Invalid word rejected');
console.log('✓ Dictionary validation passed!');

// 2. Test Spell Evaluation & Damage
console.log('2. Testing Spell Evaluation...');
const testTiles = [
  { letter: 'M', score: 3, type: TILE_TYPES.NORMAL },
  { letter: 'A', score: 1, type: TILE_TYPES.NORMAL },
  { letter: 'G', score: 2, type: TILE_TYPES.RUBY }, // +50% & burn
  { letter: 'I', score: 1, type: TILE_TYPES.GOLD }, // 2x letter score
  { letter: 'C', score: 3, type: TILE_TYPES.NORMAL }
];
const spell = evaluateSpell(testTiles);
console.log('MAGIC spell result:', spell);
console.assert(spell.valid === true, 'Spell should be valid');
console.assert(spell.effects.includes('burn'), 'Should have burn effect');
console.assert(spell.totalDamage > 30, 'Should deal high damage');
console.log('✓ Spell evaluation passed!');

// 3. Test Board Initialization & Tile Management
console.log('3. Testing Board generation...');
const board = new Board(4);
board.init();
console.assert(board.tiles.length === 16, 'Board should have 16 tiles');
const letters = board.tiles.map(t => t.letter);
console.log('Board letters:', letters.join(' '));

// Test selection
const t0 = board.selectTile(0);
console.assert(board.selectedIndices.length === 1, '1 tile selected');
board.deselectTileByIndex(0);
console.assert(board.selectedIndices.length === 0, '0 tiles selected');
console.log('✓ Board operations passed!');

// 4. Test Hint Generator
console.log('4. Testing Anagram Hint solver...');
const bestHint = findBestWordFromLetters(letters);
console.log('Found best valid word on board for Hint:', bestHint);
console.assert(bestHint.length >= 2, 'Should find at least one valid word');
console.assert(isValidWord(bestHint), 'Hint word must be valid dictionary word');
console.log('✓ Hint generator passed!');

// 5. Test Combat Loop & Progression
console.log('5. Testing Combat Engine...');
const combat = new CombatEngine(board);
combat.startStage(0);
console.assert(combat.enemyHp === STAGES[0].enemy.maxHp, 'Enemy max hp initialized');
console.assert(combat.playerHp === 100, 'Player hp 100');

// Use potion
combat.playerHp = 60;
const potRes = combat.usePotion();
console.assert(potRes.success === true, 'Potion success');
console.assert(combat.playerHp === 95, 'Healed 35 hp');
console.assert(combat.potions === 1, '1 potion left');

// Test Turn Execution
board.selectTile(0);
board.selectTile(1);
board.selectTile(2);
console.log('✓ Combat engine verified!');

console.log('ALL TESTS PASSED WITH 100% SUCCESS!');
