export const STAGES = [
  {
    id: 1,
    name: 'The Whispering Woods',
    background: 'forest',
    themeColor: '#2e7d32',
    enemy: {
      name: 'Gnarlfoot the Briar Goblin',
      title: 'Forest Scout',
      maxHp: 75,
      attackMin: 8,
      attackMax: 14,
      attackName: 'Thorn Dagger',
      spriteType: 'goblin',
      dialogue: 'Heh! You cannot pass with simple words, wizard! My briars bite deeper than your spells!'
    },
    introStory: 'Alistair sets foot into the eerie Whispering Woods. His spellbook glows faintly as the trees rustle with sinister malice. A jagged goblin leaps from the shadows!',
    victoryDialogue: 'Gnarlfoot collapses into the brambles. Alistair gathers an ancient map scrap pointing towards the deep subterranean crypts.'
  },
  {
    id: 2,
    name: 'The Crypt of the Forgotten',
    background: 'crypt',
    themeColor: '#6a1b9a',
    enemy: {
      name: 'Morvath the Shadow Lich',
      title: 'Guardian of Tombs',
      maxHp: 150,
      attackMin: 14,
      attackMax: 22,
      attackName: 'Soul Siphon',
      specialAbility: 'curse_tile',
      specialAbilityName: 'Curse Rune',
      spriteType: 'lich',
      dialogue: 'Foolish mortal... Words wither before the silence of the grave! Feel my necrotic curse upon your runes!'
    },
    introStory: 'Descending into the damp, glowing catacombs, Alistair faces the dread Necromancer Morvath. Spectral spirits swirl around the ancient sarcophagi.',
    victoryDialogue: 'The Lich dissolves into harmless purple ash. A glowing crystal key emerges, unlocking the ascent to the Infernal Spire!'
  },
  {
    id: 3,
    name: 'The Infernal Spire',
    background: 'volcano',
    themeColor: '#c62828',
    enemy: {
      name: 'Ignis the Pyre Wyrm',
      title: 'Ancient Fire Lord',
      maxHp: 250,
      attackMin: 22,
      attackMax: 34,
      attackName: 'Hellfire Breath',
      specialAbility: 'burn_tile',
      specialAbilityName: 'Magma Eruption',
      spriteType: 'dragon',
      dialogue: 'Mortal mage! None shall claim the Panacea Incantation from my molten throne! Turn to cinder!'
    },
    introStory: 'At the volcanic summit of the realm, rivers of magma surge beneath the burning skies. The mighty dragon Ignis descends in a roar of searing flame!',
    victoryDialogue: 'With a deafening shriek, the dragon falls into the embers. Amidst the altar, the sacred Panacea Incantation shines with pure golden luminescence!'
  }
];

export const EPILOGUE_STORY = {
  title: 'The Panacea Incantation Secured!',
  body: 'Alistair grasps the ancient golden scroll. Chanting the sacred words of vitality and renewal, a radiant aura envelops his hands. He hastens back to his home realm, reciting the supreme incantation over his ailing wife and son. Their fever breaks, color returns to their cheeks, and their smiles greet him once more. The WordWiz has triumphed through the invincible magic of language!'
};
