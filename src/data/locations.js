export const LOCATIONS = {
    VILA_INICIAL: {
        id: 'VILA_INICIAL',
        name: "Vila de Start",
        x: 100, y: 300,
        unlocked: true,
        scene: 'BattleScene', // Cena que será carregada
        config: { mapId: 'vila_map' }, // Dados extras para a batalha
        connections: ['BOSQUE_SOMBRIO'] // Para onde posso ir a partir daqui
    },
    BOSQUE_SOMBRIO: {
        id: 'BOSQUE_SOMBRIO',
        name: "Bosque Sombrio",
        x: 300, y: 200,
        unlocked: false, // Bloqueado até passar pela Vila
        scene: 'BattleScene',
        config: { mapId: 'bosque_map' },
        connections: ['VILA_INICIAL', 'TORRE_MAGO']
    },
    TORRE_MAGO: {
        id: 'TORRE_MAGO',
        name: "Torre do Mago",
        x: 500, y: 150,
        unlocked: false,
        scene: 'BattleScene',
        config: { mapId: 'torre_map' },
        connections: ['BOSQUE_SOMBRIO']
    }
};