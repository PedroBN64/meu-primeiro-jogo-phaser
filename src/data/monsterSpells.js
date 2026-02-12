// src/data/monsterSpells.js
export const MONSTER_SPELLS = {
    'mordida_basica': {
        nome: "Mordida",
        alcance: 1,
        tipo: 'FISICO',
        danoMin: 3,
        danoMax: 6,
        efeitoVisual: null
    },
    'flecha_orc': {
        nome: "Disparo Orc",
        alcance: 5,
        tipo: 'FISICO',
        danoMin: 4,
        danoMax: 8,
        efeitoVisual: 0xaaaaaa // Cinza
    },
    'bola_fogo_dragao': {
        nome: "Baforada de Fogo",
        alcance: 4,
        tipo: 'MAGICO',
        danoMin: 15,
        danoMax: 25,
        efeitoVisual: 0xff4500 // Laranja
    },
    'cura_xamanica': {
        nome: "Cura Tribal",
        alcance: 3, // Cura aliados (futuro) ou si mesmo
        tipo: 'CURA',
        danoMin: 10,
        danoMax: 20,
        efeitoVisual: 0x00ff00
    },
    'golpe_esmagador': {
        nome: "Esmagar",
        alcance: 1,
        tipo: 'FISICO',
        danoMin: 10,
        danoMax: 15,
        efeitoVisual: 0x550000 // Vermelho escuro
    }
};