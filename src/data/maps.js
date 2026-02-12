export const MAPAS = [
    {
        id: 0, 
        nome: "Floresta Sombria", 
        tipo: "BATALHA",
        inimigos: [
            // Agora usamos apenas o ID que será buscado no monsters.js
            { id: 'goblin', x: 5, y: 2 },
            { id: 'goblin', x: 6, y: 1 } 
        ],
        npcs: [], 
        obstaculos: 3
    },
    {
        id: 1, 
        nome: "Vila de Descanso", 
        tipo: "PACIFICO",
        inimigos: [],
        npcs: [ 
            { nome: "Curandeiro", x: 4, y: 3, fala: "Vou curar suas feridas, viajante." } 
        ],
        obstaculos: 0
    },
    {
        id: 2, 
        nome: "Caverna do Chefe", 
        tipo: "BATALHA",
        inimigos: [
            // Substituí o "Ogro" pelo "Orc Guerreiro" que criamos no exemplo do bestiário,
            // ou você pode criar um 'ogro' no monsters.js depois.
            { id: 'orc_guerreiro', x: 4, y: 1 }, 
            { id: 'goblin', x: 2, y: 2 }
        ],
        npcs: [], 
        obstaculos: 5
    }
];