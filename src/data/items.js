// src/data/items.js
export const ITENS_DB = [
    // --- CONSUMÍVEIS ---
    { id: 'pocao_hp', nome: "Health Potion", tipo: 'consumivel', valor: 30, icon: '🍷' },
    { id: 'pocao_mp', nome: "Mana Potion", tipo: 'consumivel', valor: 20, icon: '🧪' },
    { id: 'elixir_forca', nome: "Elixir de Força", tipo: 'consumivel', buff: 'str', valor: 2, icon: '💪' },

    // --- ARMAS ---
    { id: 'espada_curta', nome: "Espada Curta", tipo: 'equipo', slot: 'arma', bonusStr: 1, danoDie: 6, icon: '🗡️' },
    { id: 'machado_batalha', nome: "Machado Batalha", tipo: 'equipo', slot: 'arma', bonusStr: 3, danoDie: 8, icon: '🪓' },
    { id: 'cajado_iniciante', nome: "Cajado Madeira", tipo: 'equipo', slot: 'arma', bonusInt: 2, danoDie: 4, icon: '🥢' },
    { id: 'arco_curto', nome: "Arco Curto", tipo: 'equipo', slot: 'arma', bonusStr: 1, danoDie: 6, icon: '🏹' },
    { id: 'espada_fogo', nome: "Fire Sword", tipo: 'equipo', slot: 'arma', bonusStr: 4, bonusInt: 1, danoDie: 10, icon: '🔥' },
    { id: 'adaga_curta',nome: "Adaga Curta",tipo: 'equipo',slot: 'arma', bonusStr: 1, danoDie: 4, icon: '🗡️'},

    // --- CAPACETES ---
    { id: 'elmo_couro', nome: "Leather Helmet", tipo: 'equipo', slot: 'capacete', bonusAC: 1, icon: '🧢' },
    { id: 'elmo_ferro', nome: "Iron Helmet", tipo: 'equipo', slot: 'capacete', bonusAC: 2, icon: '🪖' },
    { id: 'elmo_aco', nome: "Steel Helmet", tipo: 'equipo', slot: 'capacete', bonusAC: 3, icon: '🛡️' },
    { id: 'elmo_viking', nome: "Viking Helmet", tipo: 'equipo', slot: 'capacete', bonusAC: 2, bonusStr: 1, icon: '🤘' },
    { id: 'capuz_mago', nome: "Mage Hat", tipo: 'equipo', slot: 'capacete', bonusAC: 1, bonusInt: 2, icon: '🧙' },

    // --- ARMADURAS ---
    { id: 'tunica_velha', nome: "Túnica Velha", tipo: 'equipo', slot: 'armadura', bonusAC: 1, icon: '👕' },
    { id: 'armadura_couro', nome: "Leather Armor", tipo: 'equipo', slot: 'armadura', bonusAC: 2, icon: '🧥' },
    { id: 'cota_malha', nome: "Chain Armor", tipo: 'equipo', slot: 'armadura', bonusAC: 4, icon: '⛓️' },
    { id: 'peitoral_aco', nome: "Plate Armor", tipo: 'equipo', slot: 'armadura', bonusAC: 6, icon: '🥋' },
    { id: 'manto_azul', nome: "Blue Robe", tipo: 'equipo', slot: 'armadura', bonusAC: 2, bonusInt: 3, mpMax: 20, icon: '👗' },

    // --- CALÇAS ---
    { id: 'calca_rasgada', nome: "Calça Rasgada", tipo: 'equipo', slot: 'calca', bonusAC: 0, icon: '🩳' },
    { id: 'calca_couro', nome: "Leather Legs", tipo: 'equipo', slot: 'calca', bonusAC: 1, icon: '👖' },
    { id: 'calca_ferro', nome: "Plate Legs", tipo: 'equipo', slot: 'calca', bonusAC: 3, icon: '🦵' },
    { id: 'calca_dourada', nome: "Golden Legs", tipo: 'equipo', slot: 'calca', bonusAC: 4, bonusStr: 1, icon: '🌕' },
    { id: 'saia_mago', nome: "Mage Skirt", tipo: 'equipo', slot: 'calca', bonusAC: 1, bonusInt: 1, icon: '👘' },

    // --- BOTAS ---
    { id: 'botas_couro', nome: "Leather Boots", tipo: 'equipo', slot: 'botas', bonusAC: 1, icon: '👢' },
    { id: 'botas_ferro', nome: "Steel Boots", tipo: 'equipo', slot: 'botas', bonusAC: 2, icon: '👞' },
    { id: 'botas_velocidade', nome: "Boots of Haste", tipo: 'equipo', slot: 'botas', bonusAC: 1, movimento: 1, icon: '👟' },

    // --- ESCUDOS ---
    { id: 'escudo_madeira', nome: "Wooden Shield", tipo: 'equipo', slot: 'escudo', bonusAC: 1, icon: '🚪' },
    { id: 'escudo_torre', nome: "Tower Shield", tipo: 'equipo', slot: 'escudo', bonusAC: 3, movimento: -1, icon: '🛡️' },

    // --- ACESSÓRIOS (Anéis e Amuletos) ---
    { id: 'anel_forca', nome: "Ring of Strength", tipo: 'equipo', slot: 'anel', bonusStr: 2, icon: '💍' },
    { id: 'anel_inteligencia', nome: "Ring of Intellect", tipo: 'equipo', slot: 'anel', bonusInt: 2, icon: '💎' },
    { id: 'anel_vida', nome: "Life Ring", tipo: 'equipo', slot: 'anel', hpMax: 20, icon: '⭕' },
    { id: 'colar_sabedoria', nome: "Wisdom Amulet", tipo: 'equipo', slot: 'colar', bonusInt: 1, mpMax: 10, icon: '📿' },
    { id: 'colar_protecao', nome: "Protection Amulet", tipo: 'equipo', slot: 'colar', bonusAC: 2, icon: '🧿' },
    { id: 'colar_rubi', nome: "Ruby Amulet", tipo: 'equipo', slot: 'colar', bonusStr: 1, hpMax: 10, icon: '🔴' }
];