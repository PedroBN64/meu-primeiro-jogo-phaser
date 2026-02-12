/**
 * ARQUIVO: src/scenes/LoginScene.js
 * DESCRIÇÃO: Cena de entrada. Gerencia Novo Jogo, Load Local e Importação de Save.
 */

import { Button } from '../components/Button.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { MercenarySystem } from '../systems/MercenarySystem.js';

export class LoginScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoginScene' });
    }

    preload() {
        // Espaço para carregar assets do menu no futuro
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

        // --- SEÇÃO 3: LÓGICA DE SAVE E BOTÕES ---
        
        // Inicializa o sistema para verificar se existe save local
        const saveSystem = new SaveSystem(this);
        const existeSaveLocal = saveSystem.hasLocalSave();

        // Variável para controlar a altura dos botões dinamicamente
        let yPos = height / 2; 

        // 1. BOTÃO CONTINUAR (Só aparece se tiver save local)
        if (existeSaveLocal) {
            new Button(this, width / 2, yPos, 'CONTINUAR', () => {
                const dados = saveSystem.loadFromLocal();
                if (dados) {
                    console.log("Save Local Carregado!");
                    this.startGame();
                }
            }, { bgColor: 0xe67e22, bgHover: 0xd35400 }); // Laranja
            
            yPos += 70; // Empurra o próximo botão para baixo
        }

        // 2. BOTÃO NOVO JOGO
        new Button(this, width / 2, yPos, 'NOVO JOGO', () => {
            // Opcional: saveSystem.clearLocal(); // Se quiser apagar o save antigo ao iniciar um novo
            this.cameras.main.fadeOut(500);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('CharacterScene'); // Vai para criação de personagem
            });
        });

        yPos += 70;

        // 3. BOTÃO IMPORTAR SAVE (Arquivo .json)
        new Button(this, width / 2, yPos, 'IMPORTAR SAVE', () => {
            saveSystem.importSaveGame((dados) => {
                if (dados) this.startGame();
            });
        }, { bgColor: 0x8e44ad, bgHover: 0x9b59b6 }); // Roxo

        yPos += 70;

        new Button(this, width / 2, yPos, 'RECRUTAR AMIGO', () => {
            const mercSystem = new MercenarySystem(this);
            mercSystem.importMercenary(() => {
                // Se importou com sucesso, talvez atualizar a tela ou só avisar
                console.log("Amigo adicionado ao registro!");
            });
        }, { bgColor: 0x2980b9 }); // Azul


        yPos += 70;

        

        // 4. BOTÃO OPÇÕES
        new Button(this, width / 2, yPos, 'OPÇÕES', () => {
            console.log('Abrindo menu de opções...');
        });

        // --- SEÇÃO 4: RODAPÉ ---
        this.add.text(width / 2, height - 30, 'Pressione para interagir', {
            fontSize: '12px', fill: '#444'
        }).setOrigin(0.5);
    }

    /**
     * Helper para transição suave para a batalha/mapa
     */
    startGame() {
        this.cameras.main.fadeOut(500);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('BattleScene');
        });
    }
}