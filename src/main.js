/**
 * ARQUIVO: main.js
 * DESCRIÇÃO: Configuração principal do Phaser.
 * MELHORIAS: Adicionado 'scale' para centralizar e ajustar o jogo na tela.
 */

import { LoginScene } from './scenes/LoginScene.js';
import { CharacterScene } from './scenes/CharacterScene.js';
import { WorldMapScene } from './scenes/WorldMapScene.js';
import { UIScene } from './scenes/UIScene.js';
import { BattleScene } from './scenes/BattleScene.js';

const config = {
    type: Phaser.AUTO, // Usa WebGL se disponível, senão Canvas
    width: 1080,
    height: 720,
    parent: 'game-container', // ID da DIV no HTML
    backgroundColor: '#111111', // Cor de fundo padrão (cinza escuro) para não ofuscar
    pixelArt: true, // Mantém os pixels nítidos ao redimensionar
    
    // --- CONFIGURAÇÃO DE ESCALA (IMPORTANTE) ---
    scale: {
        mode: Phaser.Scale.FIT, // Ajusta o jogo para caber na janela mantendo a proporção
        autoCenter: Phaser.Scale.CENTER_BOTH // Centraliza o jogo horizontal e verticalmente
    },

    // --- DOM (PARA INPUTS DE TEXTO HTML) ---
    dom: {
        createContainer: true // Necessário para usar this.add.dom() na CharacterScene
    },

    // --- ORDEM DAS CENAS ---
    // A primeira cena da lista é a que inicia (LoginScene)
    scene: [
        LoginScene,      // Tela inicial
        CharacterScene,  // Criação de Personagem
        WorldMapScene,   // Mapa Mundi
        BattleScene,     // Combate
        UIScene          // Interface (Hud)
    ]
};

const game = new Phaser.Game(config);

// Torna o jogo acessível no console do navegador para debug (F12)
window.game = game;