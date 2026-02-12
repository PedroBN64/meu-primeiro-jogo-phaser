/**
 * ARQUIVO: src/scenes/UIScene.js
 * DESCRIÇÃO: Interface do usuário (HUD). 
 * ATUALIZAÇÃO: Adicionado botão 'Sair do Mapa' e lógica de fim de batalha.
 */

import { MercenarySystem } from '../systems/MercenarySystem.js';

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        const { width, height } = this.scale;

        // --- 1. BOTÃO DE ENCERRAR TURNO (Vermelho - Inferior) ---
        this.btnEndTurn = this.add.text(width - 150, height - 190, '[ ENCERRAR TURNO ]', {
            fontSize: '18px',
            fill: '#fff',
            backgroundColor: '#c0392b', // Vermelho
            padding: { x: 10, y: 10 },
            fontStyle: 'bold'
        })
        .setInteractive({ useHandCursor: true })
        .setVisible(false)
        .setDepth(100);

        this.btnEndTurn.on('pointerdown', () => {
            const battleScene = this.scene.get('BattleScene');
            if (battleScene) {
                battleScene.events.emit('ui-end-turn');
            }
            this.btnEndTurn.setVisible(false);
        });

        // --- 2. BOTÃO SAIR DO MAPA (Verde - Superior) ---
        // Só aparece quando vence a batalha
        this.btnExitLevel = this.add.text(width - 150, 20, '[ SAIR DO MAPA ]', {
            fontSize: '18px',
            fill: '#fff',
            backgroundColor: '#27ae60', // Verde
            padding: { x: 10, y: 10 },
            fontStyle: 'bold'
        })
        .setInteractive({ useHandCursor: true })
        .setVisible(false) // Começa invisível
        .setDepth(100);

        this.btnExitLevel.on('pointerdown', () => {
            const battleScene = this.scene.get('BattleScene');
            if (battleScene) {
                // Chama a função que salva o progresso e troca de cena
                battleScene.finishLevel(); 
            }
        });

        // Configura os ouvintes de ambos os botões
        this.setupButtonEvents();

        // --- 3. O PAINEL DESLIZANTE ---
        this.panelHeight = 160;
        this.panelContainer = this.add.container(0, height);
        
        const bg = this.add.rectangle(width / 2, this.panelHeight / 2, width, this.panelHeight, 0x000000, 0.85);
        const border = this.add.rectangle(width / 2, 0, width, 4, 0xd4af37); 

        const portraitFrame = this.add.rectangle(80, this.panelHeight / 2, 70, 70, 0x222222).setStrokeStyle(2, 0x888888);
        this.portrait = this.add.image(80, this.panelHeight / 2, 'heroi_placeholder');

        this.createExportButton(80, this.panelHeight - 30); 

        this.nameText = this.add.text(140, 20, '', { fontSize: '22px', fontStyle: 'bold', fill: '#ffffff', fontFamily: 'Verdana' });
        this.levelText = this.add.text(140, 50, '', { fontSize: '14px', fill: '#f1c40f' });

        const hpBg = this.createBarBackground(140, 80, 200, 16);
        const mpBg = this.createBarBackground(140, 105, 200, 16);
        this.hpBar = this.add.rectangle(140, 80, 200, 16, 0xe74c3c).setOrigin(0, 0);
        this.mpBar = this.add.rectangle(140, 105, 200, 16, 0x3498db).setOrigin(0, 0);
        this.hpText = this.add.text(240, 88, '', { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);
        this.mpText = this.add.text(240, 113, '', { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);

        this.statsText = this.add.text(400, 30, '', { fontSize: '16px', fill: '#cccccc', lineHeight: 24, fontFamily: 'Courier New' });

        this.panelContainer.add([
            bg, border, portraitFrame, this.portrait, 
            this.nameText, this.levelText, 
            hpBg, mpBg, this.hpBar, this.mpBar, 
            this.hpText, this.mpText, this.statsText,
            this.exportContainer 
        ]);

        // --- 4. TOOLTIP ---
        this.tooltip = this.add.text(0, 0, '', {
            fontSize: '12px', backgroundColor: '#000', padding: { x: 5, y: 5 }
        }).setOrigin(0.5, 1).setDepth(200).setVisible(false);

        // --- 5. CONFIGURAÇÃO INICIAL ---
        this.isPanelVisible = false;
        this.currentHeroData = null;
        this.setupPanelEvents();
    }

    // --- MÉTODOS AUXILIARES ---

    setupButtonEvents() {
        const battleScene = this.scene.get('BattleScene');
        if (!battleScene) return; 

        // Limpeza de eventos antigos
        battleScene.events.off('ui-enable-turn-button');
        battleScene.events.off('ui-show-exit');

        // Evento: Mostrar/Esconder botão de turno
        battleScene.events.on('ui-enable-turn-button', (isEnabled) => {
            this.btnEndTurn.setVisible(isEnabled);
        });

        // Evento: Fim de Batalha -> Troca os botões
        battleScene.events.on('ui-show-exit', () => {
            this.btnEndTurn.setVisible(false);   // Esconde turno
            this.btnExitLevel.setVisible(true);  // Mostra saída
        });
    }

    setupPanelEvents() {
        const battleScene = this.scene.get('BattleScene');
        if (!battleScene) return;

        battleScene.events.off('ui-update-stats');
        battleScene.events.off('ui-clear-stats');

        battleScene.events.on('ui-update-stats', (hero) => {
            this.updateStats(hero);
            this.showPanel();
        });

        battleScene.events.on('ui-clear-stats', () => {
            this.hidePanel();
        });
    }

    createBarBackground(x, y, w, h) {
        return this.add.rectangle(x, y, w, h, 0x333333).setOrigin(0, 0).setStrokeStyle(1, 0x000000);
    }

    createExportButton(x, y) {
        this.exportContainer = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 32, 32, 0x444444).setStrokeStyle(1, 0xaaaaaa);
        const icon = this.add.text(0, 0, '💾', { fontSize: '20px' }).setOrigin(0.5);

        this.exportContainer.add([bg, icon]);
        this.exportContainer.setSize(32, 32);
        this.exportContainer.setInteractive({ useHandCursor: true });

        this.exportContainer.on('pointerover', () => {
            bg.setFillStyle(0x666666);
            const globalPos = this.exportContainer.getBounds();
            this.showTooltip(globalPos.centerX, globalPos.top - 5, "Salvar Card");
        });

        this.exportContainer.on('pointerout', () => {
            bg.setFillStyle(0x444444);
            this.hideTooltip();
        });

        this.exportContainer.on('pointerdown', () => {
            bg.setFillStyle(0x222222);
            this.exportCurrentHero();
        });

        this.exportContainer.on('pointerup', () => bg.setFillStyle(0x666666));
    }

    showPanel() {
        if (this.isPanelVisible) return;
        this.isPanelVisible = true;
        this.tweens.add({
            targets: this.panelContainer,
            y: this.scale.height - this.panelHeight,
            duration: 300,
            ease: 'Back.out'
        });
    }

    hidePanel() {
        if (!this.isPanelVisible) return;
        this.isPanelVisible = false;
        this.hideTooltip();
        this.tweens.add({
            targets: this.panelContainer,
            y: this.scale.height,
            duration: 200,
            ease: 'Power2'
        });
    }

    updateStats(hero) {
        if (!hero) return;
        this.currentHeroData = hero;

        this.nameText.setText(hero.name);
        this.levelText.setText(`Nível ${hero.level || 1} - ${hero.classKey}`);

        if (hero.sprite && hero.sprite.texture) {
            if (this.textures.exists(hero.sprite.texture.key)) {
                this.portrait.setTexture(hero.sprite.texture.key);
                const maxDim = Math.max(hero.sprite.width, hero.sprite.height);
                this.portrait.setScale(60 / maxDim);
            }
        }

        const hpPercent = Phaser.Math.Clamp(hero.currentHp / hero.stats.hp, 0, 1);
        const mpPercent = Phaser.Math.Clamp(hero.currentMp / hero.stats.mp, 0, 1);

        this.tweens.add({ targets: this.hpBar, width: 200 * hpPercent, duration: 200 });
        this.mpBar.width = 200 * mpPercent;

        this.hpText.setText(`${Math.floor(hero.currentHp)}/${hero.stats.hp}`);
        this.mpText.setText(`${Math.floor(hero.currentMp)}/${hero.stats.mp}`);

        const stats = `STR: ${hero.stats.str}   DEF: ${hero.stats.def}\n` +
                      `INT: ${hero.stats.int}   RES: ${hero.stats.res}\n` +
                      `MOV: ${hero.mobility || 3}   RNG: ${hero.range || 1}`;
        this.statsText.setText(stats);
    }

    showTooltip(x, y, text) {
        this.tooltip.setPosition(x, y);
        this.tooltip.setText(text);
        this.tooltip.setVisible(true);
    }

    hideTooltip() {
        this.tooltip.setVisible(false);
    }

    exportCurrentHero() {
        if (!this.currentHeroData) return;
        const mercSystem = new MercenarySystem(this);
        mercSystem.exportCharacter(this.currentHeroData);
        this.tweens.add({
            targets: this.exportContainer,
            alpha: 0.5, duration: 100, yoyo: true, repeat: 1
        });
    }
}