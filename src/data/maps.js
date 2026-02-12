export const MAPAS = {
    'vila_map': {
        nome: "Vila de Start",
        tipo: "BATALHA",
        fundo: "piso", // Podemos mudar o chão dependendo do mapa
        inimigos: [
            // CUIDADO: O 'id' aqui deve ser IGUAL à chave no monsters.js (ex: 'GOBLIN')
            { monsterKey: 'GOBLIN', x: 5, y: 2 },
            { monsterKey: 'GOBLIN', x: 6, y: 1 }
        ],
        obstaculos: [] // Lista de coordenadas {x,y} para pedras/arvores
    },
    'bosque_map': {
        nome: "Bosque Sombrio",
        tipo: "BATALHA",
        fundo: "piso",
        inimigos: [
            { monsterKey: 'ORC', x: 4, y: 3 }, // Era 'orc_guerreiro', mudei para 'ORC' para bater com monsters.js
            { monsterKey: 'GOBLIN', x: 7, y: 4 }
        ],
        obstaculos: [{x: 3, y: 3}, {x: 4, y: 4}] // Exemplo de obstáculos
    },
    'torre_map': {
        nome: "Torre do Mago",
        tipo: "BATALHA",
        fundo: "piso",
        inimigos: [
            { monsterKey: 'ORC', x: 8, y: 2 },
            { monsterKey: 'ORC', x: 8, y: 5 },
            { monsterKey: 'GOBLIN', x: 6, y: 3 }
        ],
        obstaculos: []
    }
};