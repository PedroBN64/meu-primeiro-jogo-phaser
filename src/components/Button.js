/**
 * ARQUIVO: Button.js
 * DESCRIÇÃO: Componente modular de botão reutilizável.
 */

export class Button extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene - A cena onde o botão será criado
     * @param {number} x - Posição horizontal
     * @param {number} y - Posição vertical
     * @param {string} text - Texto que aparecerá no botão
     * @param {Function} callback - Função executada ao clicar
     */
    constructor(scene, x, y, text, callback, fontSize = '18px') {
        super(scene, x, y);

        this.scene = scene;
        this.callback = callback;

        // --- 1. CONFIGURAÇÃO DO FUNDO (BACKGROUND) ---
        // Criamos um retângulo simples como placeholder. 
        // Depois você pode substituir por uma imagem (Sprite).
        this.bg = scene.add.rectangle(0, 0, 200, 50, 0x444444)
            .setStrokeStyle(2, 0xffffff);

        // --- 2. CONFIGURAÇÃO DO TEXTO ---
        this.label = scene.add.text(0, 0, text, {
            fontSize: fontSize,
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5); // Centraliza o texto no meio do botão

        // --- 3. MONTAGEM DO COMPONENTE ---
        // Adicionamos o fundo e o texto dentro deste Container
        this.add([this.bg, this.label]);

        // --- 4. INTERATIVIDADE ---
        // Tornamos o container clicável com o tamanho do background
        this.setSize(this.bg.width, this.bg.height);
        this.setInteractive({ useHandCursor: true });

        // Adicionando os efeitos visuais de feedback
        this.setupEventListeners();

        // Adiciona este container à cena
        scene.add.existing(this);
    }
    // Método extra: Caso queira mudar o tamanho do fundo via código depois
    setButtonSize(width, height) {
        this.bg.setSize(width, height);
        this.setSize(width, height);
        return this; // Permite encadeamento: btn.setButtonSize(300, 50).setAlpha(0.5)
    }   


    /**
     * Define como o botão reage às interações do mouse
     */
    setupEventListeners() {
        // Efeito visual quando o mouse passa por cima (Hover)
        this.on('pointerover', () => {
            this.bg.setFillStyle(0x666666);
            this.label.setStyle({ fill: '#ffff00' });
        });

        // Efeito visual quando o mouse sai de cima
        this.on('pointerout', () => {
            this.bg.setFillStyle(0x444444);
            this.label.setStyle({ fill: '#ffffff' });
        });

        // Efeito ao clicar (Down)
        this.on('pointerdown', () => {
            this.setScale(0.95); // Leve "pressionada" visual
        });

        // Execução da função ao soltar o clique (Up)
        this.on('pointerup', () => {
            this.setScale(1);
            this.callback();
        });
    }
}