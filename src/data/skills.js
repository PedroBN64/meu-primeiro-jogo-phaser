// ARQUIVO: src/data/skills.js
export const SKILLS = {
    // --- GUERREIRO ---
    'golpe_pesado': {
        nome: "Golpe Pesado",
        custoMp: 3,
        alcance: 1,
        tipo: 'FISICO',
        danoBase: 6,
        efeitoVisual: 0xffffff,
        descricao: "Um ataque brutal com força total."
    },
    'grito_guerra': {
        nome: "Grito de Guerra",
        custoMp: 5,
        alcance: 0, 
        tipo: 'BUFF',
        stat: 'str',
        valor: 2,
        efeitoVisual: 0xff0000,
        descricao: "Aumenta sua Força temporariamente."
    },

    // --- MAGO ---
    'bola_fogo': {
        nome: "Bola de Fogo",
        custoMp: 8,
        alcance: 5,
        tipo: 'MAGICO',
        danoBase: 12,
        efeitoVisual: 0xff4500,
        descricao: "Lança uma esfera flamejante."
    },
    'missil_magico': {
        nome: "Míssil Arcano",
        custoMp: 4,
        alcance: 6,
        tipo: 'MAGICO',
        danoBase: 6,
        efeitoVisual: 0x8800ff,
        descricao: "Projétil rápido e barato."
    },

    // --- ARQUEIRO ---
    'tiro_preciso': {
        nome: "Tiro Preciso",
        custoMp: 5,
        alcance: 6,
        tipo: 'FISICO',
        danoBase: 8,
        criticoBonus: 10,
        efeitoVisual: 0xffff00,
        descricao: "Um tiro focado em pontos vitais."
    },

    // --- CLÉRIGO ---
    'curar_leve': {
        nome: "Curar Ferimentos",
        custoMp: 6,
        alcance: 3,
        tipo: 'CURA',
        danoBase: 10,
        efeitoVisual: 0x00ff00,
        descricao: "Restaura vida do alvo."
    },
    'luz_sagrada': {
        nome: "Luz Sagrada",
        custoMp: 5,
        alcance: 4,
        tipo: 'MAGICO',
        danoBase: 8,
        efeitoVisual: 0xffffcc,
        descricao: "Queima o inimigo com luz divina."
    }
};