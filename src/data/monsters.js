export const MONSTERS = {
    GOBLIN: {
        name: "Goblin Saqueador",
        sprite: "img_goblin", // Lembre de ter goblin.png na pasta assets
        stats: {
            hp: 30, maxHp: 30,
            mp: 0, maxMp: 0,
            str: 4, int: 1, def: 2, res: 1, spd: 4 // Rápido, mas fraco
        },
        mobility: 4,
        range: 1,
        expReward: 50,
        aiType: "aggressive" // Futuramente usaremos isso
    },
    ORC: {
        name: "Orc Guerreiro",
        sprite: "img_orc", // Lembre de ter orc.png
        stats: {
            hp: 80, maxHp: 80,
            mp: 10, maxMp: 10,
            str: 8, int: 2, def: 5, res: 2, spd: 2 // Lento e forte
        },
        mobility: 3,
        range: 1,
        expReward: 120,
        aiType: "tank"
    }
};