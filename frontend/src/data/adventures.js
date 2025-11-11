export const adventures = {
  forest: {
    id: "forest",
    name: "Erdő",
    paths: [
      {
        id: "forest_path_1",
        name: "Sűrű ösvény",
        enemies: [
          { id: "wolf", name: "Farkas", hp: 20, dmgMin: 3, dmgMax: 6, xp: 8, gold: 5 },
          { id: "boar", name: "Vaddisznó", hp: 25, dmgMin: 4, dmgMax: 7, xp: 12, gold: 8 }
        ],
        loot: [
          { id: "potion_small", name: "Gyógyital (kicsi)", type: "consumable", heal: 10 },
          { id: "wood_sword", name: "Fa kard", type: "weapon", bonus: { str: 2 } }
        ],
        durationSec: 60
      },
      {
        id: "forest_path_2",
        name: "Tisztás",
        enemies: [
          { id: "goblin", name: "Goblin", hp: 15, dmgMin: 2, dmgMax: 5, xp: 6, gold: 6 }
        ],
        loot: [
          { id: "small_gold", name: "Kis aranykupac", type: "gold", gold: 15 }
        ],
        durationSec: 45
      }
    ]
  },

  cave: {
    id: "cave",
    name: "Bánya",
    paths: [
      {
        id: "cave_path_1",
        name: "Sötét alagút",
        enemies: [
          { id: "skeleton", name: "Csontváz", hp: 22, dmgMin: 4, dmgMax: 7, xp: 10, gold: 7 },
          { id: "zombie", name: "Zombi", hp: 30, dmgMin: 5, dmgMax: 8, xp: 14, gold: 10 }
        ],
        loot: [{ id: "rusty_sword", name: "Rozsdás kard", type: "weapon", bonus: { str: 1 } }],
        durationSec: 90
      }
    ]
  }
};