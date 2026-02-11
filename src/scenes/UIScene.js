/**
 * ARQUIVO: UIScene.js
 * DESCRIÇÃO: Gerencia o HUD (Heads-up Display) de forma modular.
 */

import { InventorySlot } from '../components/InventorySlot.js';

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    /**
     * O init é executado antes do create. Ideal para resetar variáveis.
     */
    init() {
        this.currentHP = 100;
        this.maxHP = 100;
    }

    create() {
        const { width, height } = this.scale;

        // --- SEÇÃO 1: CONSTRUÇÃO VISUAL ---
        this.createHealthBar(20, 20);
        this.createInventoryGrid(width - 300, height - 120);
        this.createActionBar(width / 2, height - 50);

        // --- SEÇÃO 2: CONEXÃO DE EVENTOS (Ouvindo a BattleScene) ---
        this.setupBattleEvents();

        // --- SEÇÃO 3: TESTE DE EMERGÊNCIA (Teclado) ---
        // Se o clique no mapa falhar, use ESPAÇO para validar a barra
        this.input.keyboard.on('keydown-SPACE', () => {
            console.log("Teste: Dano via Teclado");
            this.updateHealth(5);
        });
    }

    /**
     * Configura a escuta de eventos vindos de outras cenas
     */
    setupBattleEvents() {
        const battleScene = this.scene.get('BattleScene');

        // Se a BattleScene já existir e estiver ativa
        if (battleScene) {
            // Removemos para evitar duplicidade caso a cena reinicie
            battleScene.events.off('PLAYER_DAMAGE');
            
            battleScene.events.on('PLAYER_DAMAGE', (amount) => {
                console.log("%c UI: Recebido dano de " + amount, "color: red; font-weight: bold");
                this.updateHealth(amount);
            }, this);
        } else {
            console.warn("Aguardando BattleScene carregar...");
        }
    }

    /**
     * Cria a estrutura da barra de vida
     */
    createHealthBar(x, y) {
        const barWidth = 200;
        const barHeight = 20;

        // 1. Fundo (Background)
        this.add.rectangle(x, y, barWidth, barHeight, 0x000000).setOrigin(0);
        
        // 2. Barra de Vida (Foreground)
        // Usamos 196 para deixar uma borda de 2px de cada lado
        this.hpBar = this.add.rectangle(x + 2, y + 2, 196, barHeight - 4, 0xff0000).setOrigin(0);
        
        // 3. Texto informativo
        this.hpText = this.add.text(x, y + 25, `HP: ${this.currentHP} / ${this.maxHP}`, { 
            fontSize: '14px', 
            fill: '#fff',
            fontFamily: 'monospace'
        });
    }

    /**
     * Lógica de atualização do HP
     */
    updateHealth(amount) {
        this.currentHP -= amount;
        if (this.currentHP < 0) this.currentHP = 0;

        // Calcula a largura proporcional (Regra de 3)
        const ratio = this.currentHP / this.maxHP;
        
        // Atualiza a largura visual da barra vermelha
        this.hpBar.width = 196 * ratio;

        // Atualiza o texto na tela
        this.hpText.setText(`HP: ${this.currentHP} / ${this.maxHP}`);

        // Feedback visual: Se estiver com pouca vida, a barra fica Laranja
        if (ratio < 0.35) {
            this.hpBar.setFillStyle(0xffa500);
        }
    }

    /**
     * Monta o grid de inventário
     */
    createInventoryGrid(startX, startY) {
        const rows = 2;
        const cols = 5;
        const spacing = 55;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                new InventorySlot(this, startX + (c * spacing), startY + (r * spacing));
            }
        }
    }

    /**
     * Monta os slots de ação rápida
     */
    createActionBar(x, y) {
        for (let i = 0; i < 4; i++) {
            new InventorySlot(this, x + (i * 60) - 90, y, 45);
        }
    }
}