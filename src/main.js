/**
 * ARQUIVO: main.js
 * DESCRIÇÃO: Configuração principal do Phaser e inicialização das cenas.
 */

import { LoginScene } from './scenes/LoginScene.js';
import { CharacterScene } from './scenes/CharacterScene.js';
import { UIScene } from './scenes/UIScene.js';
import { BattleScene } from './scenes/BattleScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1080,
    height: 720,
    parent: 'game-container',
    pixelArt: true, // Importante para RPGs com estilo retrô
    scene: [LoginScene, CharacterScene, BattleScene, UIScene], // A primeira da lista inicia automaticamente
    dom: {
        createContainer: true // Permite usar elementos HTML (Inputs) se necessário
    }
};

const game = new Phaser.Game(config);
window.game = game; // Torna o jogo acessível globalmente para depuração    