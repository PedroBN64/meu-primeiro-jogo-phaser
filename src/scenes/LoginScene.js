/**
 * ARQUIVO: src/scenes/LoginScene.js
 * DESCRIÇÃO: Cena de entrada. 
 * CORREÇÃO: O jogo agora inicia pelo WorldMapScene, não pela BattleScene direta.
 */

import { Button } from '../components/Button.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { MercenarySystem } from '../systems/MercenarySystem.js';

export class LoginScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoginScene' });
    }

    preload() {
        // Carregamento de assets do menu (logo, música, etc)
    }

    create() {
        const { width, height } = this.scale;

        // --- SEÇÃO 1: FUNDO ---
        this.add.rectangle(0, 0, width, height, 0x111111).setOrigin(0);

        // --- SEÇÃO 2: TÍTULO ---
        this.add.text(width / 2, height * 0.25, 'PHASER TACTICS', {
            fontSize: '48px',
            fill: '#E0E0E0',
            fontStyle: 'bold',
            fontFamily: 'Verdana'
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.33, 'Alpha Version 0.1', {
            fontSize: '14px', fill: '#888888'
        }).setOrigin(0.5);

        // --- SEÇÃO 3: SISTEMAS ---
        const saveSystem = new SaveSystem(this);
        const existeSaveLocal = saveSystem.hasLocalSave();

        let yPos = height / 2; 

        // 1. BOTÃO CONTINUAR (Só aparece se tiver save)
        if (existeSaveLocal) {
            new Button(this, width / 2, yPos, 'CONTINUAR', () => {
                const dados = saveSystem.loadFromLocal();
                if (dados) {
                    console.log("Save Local Carregado!");
                    this.startGame(); // Vai para o Mapa
                }
            }, { bgColor: 0xe67e22, bgHover: 0xd35400 }); // Laranja
            
            yPos += 70; 
        }

        // 2. BOTÃO NOVO JOGO
        new Button(this, width / 2, yPos, 'NOVO JOGO', () => {
            // Se quiser limpar o save anterior ao criar novo:
            // saveSystem.clearLocal(); 
            
            this.cameras.main.fadeOut(500);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                // Inicia criando o personagem, que depois levará ao Mapa
                this.scene.start('CharacterScene'); 
            });
        });

        yPos += 70;

        // 3. BOTÃO IMPORTAR SAVE (.json)
        new Button(this, width / 2, yPos, 'IMPORTAR SAVE', () => {
            saveSystem.importSaveGame((dados) => {
                if (dados) this.startGame();
            });
        }, { bgColor: 0x8e44ad, bgHover: 0x9b59b6 }); // Roxo

        yPos += 70;

        // 4. BOTÃO RECRUTAR AMIGO (Mercenário)
        new Button(this, width / 2, yPos, 'RECRUTAR AMIGO', () => {
            const mercSystem = new MercenarySystem(this);
            mercSystem.importMercenary(() => {
                console.log("Amigo adicionado ao registro!");
                // Feedback visual simples
                this.add.text(width/2, height - 60, 'Mercenário Recrutado!', { 
                    fill: '#0f0', fontSize: '14px' 
                }).setOrigin(0.5);
            });
        }, { bgColor: 0x2980b9 }); // Azul

        yPos += 70;

        // 5. BOTÃO OPÇÕES
        new Button(this, width / 2, yPos, 'OPÇÕES', () => {
            console.log('Abrindo menu de opções...');
        });

        // --- RODAPÉ ---
        this.add.text(width / 2, height - 30, 'Phaser 3 RPG Engine', {
            fontSize: '12px', fill: '#444'
        }).setOrigin(0.5);
    }

    /**
     * Transição para o jogo.
     * CORREÇÃO: Agora aponta para WorldMapScene
     */
    startGame() {
        this.cameras.main.fadeOut(500);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            // Se carregamos um save, queremos ir para o Mapa, 
            // onde o jogador escolherá a próxima batalha.
            this.scene.start('WorldMapScene');
        });
    }
}