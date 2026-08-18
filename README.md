# WordWiz: Arcane Lexicon 🧙‍♂️📖

A lightweight, turn-based fantasy word battler RPG inspired by *Bookworm Adventures* (PopCap, 2006).

Play as **Alistair the WordWiz**, casting incantations from a 4x4 rune board to defeat monsters across three perilous realms and secure the legendary *Panacea Incantation* for your family.

![WordWiz Banner](https://img.shields.io/badge/WordWiz-v1.0.0-gold)
![Vite](https://img.shields.io/badge/Vite-5.4-purple)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-yellow)
![Dictionary](https://img.shields.io/badge/Scrabble-83.6k_words-blue)
![Vercel Ready](https://img.shields.io/badge/Vercel-Deployable-black)

---

## 🎮 Gameplay Features

- **4x4 Rune Board**: Form valid English words from Scrabble-weighted letter tiles.
- **Elemental Gem Runes**:
  - 💎 **Ruby (Fire)**: +50% spell damage & inflicts Burning over time.
  - 🔷 **Sapphire (Frost)**: Freezes the enemy, skipping their next attack.
  - 💚 **Emerald (Life)**: Restores +15 HP on word completion.
  - 🔮 **Amethyst (Arcane)**: +10 flat damage & cleanses curses.
  - 🌟 **Gold Tile**: 2x multiplier on letter points.
- **3 Progressive Boss Encounters**:
  - **Stage 1**: *Gnarlfoot the Briar Goblin* (Forest Scout)
  - **Stage 2**: *Morvath the Shadow Lich* (Curses rune tiles)
  - **Stage 3**: *Ignis the Pyre Wyrm* (Final Boss, breathes fire & scorches board)
- **Zero-Lag Offline Dictionary**: 83,600+ official tournament words bundled locally ($O(1)$ lookup, 0ms latency, zero API rate limits).
- **Procedural Web Audio**: Zero-asset retro fantasy sound effects synthesized directly in browser.
- **Tactical Items**: Health Potions, Scramble Winds, and Arcane Insight (anagram solver hints).

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## ☁️ Deployment (Vercel)

The repository includes a ready-to-use `vercel.json`. Push to GitHub and import into Vercel for instant 1-click deployment.
