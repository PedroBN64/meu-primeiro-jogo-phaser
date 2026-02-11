/**
 * ARQUIVO: LoginScene.js
 * DESCRIÇÃO: Cena de entrada do jogo. Responsável pelo título e acesso ao menu.
 */

import { Button } from '../components/Button.js';

export class LoginScene extends Phaser.Scene {
    constructor() {
        // A 'key' é o identificador único desta cena para o Phaser
        super({ key: 'LoginScene' });
    }

    /**
     * Carregamento de recursos necessários apenas para esta cena.
     */
    preload() {
        // Espaço reservado para carregar backgrounds ou logos futuros
        // Exemplo: this.load.image('bg_login', 'assets/backgrounds/menu.png');
    }

    /**
     * Criação e posicionamento dos elementos visuais.
     */
    create() {
        // Atalhos para largura e altura da tela configurada no main.js
        const { width, height } = this.scale;

        // --- SEÇÃO 1: FUNDO E DECORAÇÃO ---
        // Adicionando um retângulo de fundo para dar profundidade
        this.add.rectangle(0, 0, width, height, 0x111111).setOrigin(0);

        // --- SEÇÃO 2: TÍTULO DO JOGO ---
        this.titleText = this.add.text(width / 2, height * 0.3, 'PHASER TACTICS', {
            fontSize: '48px',
            fill: '#E0E0E0',
            fontStyle: 'bold',
            fontFamily: 'Verdana'
        }).setOrigin(0.5);

        // Subtítulo ou Versão
        this.add.text(width / 2, height * 0.38, 'Alpha Version 0.1', {
            fontSize: '14px',
            fill: '#888888'
        }).setOrigin(0.5);

        // --- SEÇÃO 3: INTERFACE DE USUÁRIO (BOTÕES) ---
        
        // Botão para iniciar a criação de personagem
        this.btnStart = new Button(
            this, 
            width / 2, 
            height / 2 + 50, 
            'NOVO JOGO', 
            () => this.iniciarNovoJogo()
        );

        // Botão de Opções (apenas visual por enquanto)
        this.btnOptions = new Button(
            this, 
            width / 2, 
            height / 2 + 120, 
            'OPÇÕES', 
            () => console.log('Abrindo Opções...')
        );

        // --- SEÇÃO 4: RODAPÉ ---
        this.add.text(width / 2, height - 30, 'Pressione para interagir', {
            fontSize: '12px',
            fill: '#444'
        }).setOrigin(0.5);
    }

    /**
     * Lógica para transição de cena
     */
    iniciarNovoJogo() {
        // Efeito simples de "fade out" da câmera antes de mudar de cena
        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('CharacterScene');
        });
    }
}