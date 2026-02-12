/**
 * ARQUIVO: Button.js
 * DESCRIÇÃO: Componente de botão flexível.
 * MELHORIAS: Tamanho dinâmico e suporte a estilos personalizados.
 */

export class Button extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene - Cena atual
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     * @param {string} text - Texto do botão
     * @param {Function} callback - Ação ao clicar
     * @param {Object} style - (Opcional) Configurações visuais personalizadas
     */
    constructor(scene, x, y, text, callback, style = {}) {
        super(scene, x, y);

        this.scene = scene;
        this.callback = callback;

        // --- CONFIGURAÇÕES PADRÃO (Valores Default) ---
        // Se não passarmos um estilo, ele usa esses valores
        const config = {
            width: style.width || 200,
            height: style.height || 50,
            bgColor: style.bgColor || 0x444444,
            bgHover: style.bgHover || 0x666666,
            textColor: style.textColor || '#ffffff',
            textHover: style.textHover || '#ffff00',
            fontSize: style.fontSize || '18px'
        };

        this.config = config; // Salva para usar nos eventos

        // --- 1. FUNDO DO BOTÃO ---
        // Dica de Performance: Usamos 'new' em vez de 'scene.add' para não 
        // adicionar à cena duas vezes (o container já será adicionado).
        this.bg = new Phaser.GameObjects.Rectangle(
            scene, 
            0, 0, // x, y relativos ao centro do container
            config.width, 
            config.height, 
            config.bgColor
        );
        this.bg.setStrokeStyle(2, 0xffffff);

        // --- 2. TEXTO ---
        this.label = new Phaser.GameObjects.Text(
            scene, 
            0, 0, 
            text, 
            {
                fontSize: config.fontSize,
                fill: config.textColor,
                fontFamily: 'Verdana, Arial, sans-serif',
                align: 'center'
            }
        ).setOrigin(0.5);

        // --- 3. MONTAGEM ---
        this.add([this.bg, this.label]);

        // --- 4. ÁREA DE CLIQUE ---
        // Importante: A área de clique deve ter o tamanho do fundo
        this.setSize(config.width, config.height);
        this.setInteractive({ useHandCursor: true });

        // --- 5. EVENTOS ---
        this.setupEventListeners();

        // Adiciona o container finalizado à cena
        scene.add.existing(this);
    }

    setupEventListeners() {
        // Pointer Over (Entrou com o mouse)
        this.on('pointerover', () => {
            this.bg.setFillStyle(this.config.bgHover);
            this.label.setStyle({ fill: this.config.textHover });
            
            // Dica de RPG: Aqui futuramente colocaremos um som de "blip"
            // this.scene.sound.play('ui_hover'); 
        });

        // Pointer Out (Saiu com o mouse)
        this.on('pointerout', () => {
            this.bg.setFillStyle(this.config.bgColor);
            this.label.setStyle({ fill: this.config.textColor });
            this.setScale(1); // Garante que volta ao tamanho normal
        });

        // Pointer Down (Clicou e segurou)
        this.on('pointerdown', () => {
            this.setScale(0.95);
        });

        // Pointer Up (Soltou o clique)
        this.on('pointerup', () => {
            this.setScale(1);
            // Executa a ação do botão
            if (this.callback) this.callback();
        });
    }
}