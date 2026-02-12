// ARQUIVO: src/data/classes.js

export const CLASSES = {
    GUERREIRO: {
        name: "Guerreiro",
        sprite: "img_guerreiro", 
        description: "Tanque de batalha. Alta resistência física.",
        
        // Status Base (Nível 1)
        baseStats: {
            hp: 120,    // Vida
            mp: 10,     // Mana (Guerreiro usa pouco)
            str: 6,     // Força (Dano Físico)
            int: 1,     // Inteligência (Dano Mágico)
            def: 5,     // Defesa Física
            res: 2,     // Resistência Mágica
            spd: 3      // Velocidade (Quem ataca primeiro?)
        },

        // Quanto ele ganha por nível (Escalabilidade)
        growth: {
            hp: 20,     
            mp: 2,
            str: 2,
            int: 0.3,
            def: 1.5,
            res: 0.5
        },

        // Mecânicas Táticas
        mobility: 2,    // Quantos quadrados anda
        range: 1,       // Alcance do ataque básico (Melee)

        // Inventário Inicial
        startEquipment: { 
            handRight: 'espada_curta', 
            handLeft: 'escudo_madeira',
            armor: 'cota_malha' 
        },
        
        skills: ['golpe_pesado', 'grito_guerra']
    },

    MAGO: {
        name: "Mago",
        sprite: "img_mago",
        description: "Dano explosivo à distância. Frágil fisicamente.",
        
        baseStats: {
            hp: 60,
            mp: 100,
            str: 1,
            int: 8,
            def: 1,
            res: 6,
            spd: 4
        },

        growth: {
            hp: 8,
            mp: 15,
            str: 0.3,
            int: 3,
            def: 0.2,
            res: 2
        },

        mobility: 3,
        range: 2, // Pode atacar a 2 quadros de distância (básico)

        startEquipment: { 
            handRight: 'cajado_iniciante', 
            handLeft: null, // Duas mãos ou nada
            armor: 'manto_azul',
            head: 'capuz_mago'
        },
        
        skills: ['bola_fogo', 'missil_magico']
    },

    ARQUEIRO: {
        name: "Arqueiro",
        sprite: "img_arqueiro",
        description: "Rápido e letal. Ataca de longe.",
        
        baseStats: {
            hp: 80,
            mp: 40,
            str: 4,
            int: 2,
            def: 3,
            res: 3,
            spd: 6 // O mais rápido, ataca primeiro
        },

        growth: {
            hp: 12,
            mp: 5,
            str: 1.5,
            int: 0.5,
            def: 0.8,
            res: 0.8
        },

        mobility: 4, // Anda mais que os outros
        range: 4,    // O maior alcance do jogo

        startEquipment: { 
            handRight: 'arco_curto', 
            handLeft: null,
            armor: 'armadura_couro',
            feet: 'botas_velocidade'
        },
        
        skills: ['tiro_preciso']
    },

    CLERICO: {
        name: "Clérico",
        sprite: "img_clerico", // Corrigido (havia duplicidade)
        description: "Guerreiro santo. Suporte e Defesa.",
        
        baseStats: {
            hp: 90,
            mp: 60,
            str: 3,
            int: 4,
            def: 4,
            res: 5,
            spd: 2
        },

        growth: {
            hp: 14,
            mp: 8,
            str: 1,
            int: 1.5,
            def: 1,
            res: 1.5
        },

        mobility: 3,
        range: 1,

        startEquipment: { 
            handRight: 'machado_guerra', 
            handLeft: null,
            accessory: 'colar_sabedoria' 
        },
        
        skills: ['curar_leve', 'luz_sagrada']
    }
};