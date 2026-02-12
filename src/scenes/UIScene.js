/**
 * ARQUIVO: src/scenes/UIScene.js
 * DESCRIÇÃO: Interface do usuário (HUD). 
 * MELHORIAS: Painel oculto que surge com animação (Slide Up).
 */

import { MercenarySystem } from '../systems/MercenarySystem.js';

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        const { width, height } = this.scale;

        // 1. Criar o botão (usando a sua classe Button ou um texto simples interativo)
        this.btnEndTurn = this.add.text(width - 150, height - 100, '[ ENCERRAR TURNO ]', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#c0392b', // Vermelho
            padding: { x: 10, y: 10 },
            fontStyle: 'bold'
        })
        .setInteractive({ useHandCursor: true })
        .setVisible(false); // Começa invisível

        // 2. Lógica do Clique
        this.btnEndTurn.on('pointerdown', () => {
            // Busca a cena de batalha e avisa que o jogador quer encerrar
            const battleScene = this.scene.get('BattleScene');
            battleScene.events.emit('ui-end-turn');
            
            // Esconde o botão após clicar para evitar cliques duplos
            this.btnEndTurn.setVisible(false);
        });

        // 3. Ouvir a BattleScene para saber quando mostrar o botão
        const battleScene = this.scene.get('BattleScene');

        battleScene.events.on('ui-enable-turn-button', (isEnabled) => {
            this.btnEndTurn.setVisible(isEnabled);
        });
        
        // Altura do painel
        this.panelHeight = 160;

        // --- 1. O CONTAINER (A GAVETA) ---
        // Ele começa posicionado fora da tela (y = height)
        this.panelContainer = this.add.container(0, height);
        
        // --- 2. CONSTRUINDO DENTRO DA GAVETA ---
        // Nota: Agora o Y é relativo ao topo do painel (0 é o topo do preto)
        
        // Fundo
        const bg = this.add.rectangle(width / 2, this.panelHeight / 2, width, this.panelHeight, 0x000000, 0.85);
        const border = this.add.rectangle(width / 2, 0, width, 4, 0xd4af37); // Borda Dourada no topo (y=0)

        // Moldura do Retrato
        const portraitFrame = this.add.rectangle(80, this.panelHeight / 2, 70, 70, 0x222222).setStrokeStyle(2, 0x888888);
        
        // Retrato
        this.portrait = this.add.image(80, this.panelHeight / 2, 'heroi_placeholder');

        // Botão Salvar (Disquete)
        // Precisamos criar o container do botão e adicionar ao Container Principal
        this.createExportButton(80, this.panelHeight - 30); 

        // Textos Básicos
        this.nameText = this.add.text(140, 20, '', {
            fontSize: '22px', fontStyle: 'bold', fill: '#ffffff', fontFamily: 'Verdana'
        });

        this.levelText = this.add.text(140, 50, '', {
            fontSize: '14px', fill: '#f1c40f'
        });

        // Barras (Fundo)
        const hpBg = this.createBarBackground(140, 80, 200, 16);
        const mpBg = this.createBarBackground(140, 105, 200, 16);

        // Barras (Frente)
        this.hpBar = this.add.rectangle(140, 80, 200, 16, 0xe74c3c).setOrigin(0, 0);
        this.mpBar = this.add.rectangle(140, 105, 200, 16, 0x3498db).setOrigin(0, 0);

        // Textos das Barras
        this.hpText = this.add.text(240, 88, '', { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);
        this.mpText = this.add.text(240, 113, '', { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);

        // Atributos
        this.statsText = this.add.text(400, 30, '', {
            fontSize: '16px', fill: '#cccccc', lineHeight: 24, fontFamily: 'Courier New'
        });

        // ADICIONA TUDO AO CONTAINER
        this.panelContainer.add([
            bg, border, portraitFrame, this.portrait, 
            this.nameText, this.levelText, 
            hpBg, mpBg, this.hpBar, this.mpBar, 
            this.hpText, this.mpText, this.statsText,
            this.exportContainer // Adiciona o botão também
        ]);

        // --- 3. TOOLTIP (Fora do Container) ---
        // O tooltip fica fora para não ser cortado ou movido
        this.tooltip = this.add.text(0, 0, '', {
            fontSize: '12px', backgroundColor: '#000', padding: { x: 5, y: 5 }
        }).setOrigin(0.5, 1).setDepth(100).setVisible(false);

        // --- 4. CONFIGURAÇÃO INICIAL ---
        this.isPanelVisible = false;
        this.currentHeroData = null;
        this.setupEvents();
    }

    createBarBackground(x, y, w, h) {
        return this.add.rectangle(x, y, w, h, 0x333333).setOrigin(0, 0).setStrokeStyle(1, 0x000000);
    }

    createExportButton(x, y) {
        this.exportContainer = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 32, 32, 0x444444).setStrokeStyle(1, 0xaaaaaa);
        const icon = this.add.text(0, 0, '💾', { fontSize: '20px' }).setOrigin(0.5); // Emoji Disquete

        this.exportContainer.add([bg, icon]);
        this.exportContainer.setSize(32, 32);
        this.exportContainer.setInteractive({ useHandCursor: true });

        // Eventos do Botão
        this.exportContainer.on('pointerover', () => {
            bg.setFillStyle(0x666666);
            // Calculamos a posição global porque o botão está dentro de um container
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

    setupEvents() {
        const battleScene = this.scene.get('BattleScene');
        battleScene.events.off('ui-update-stats');
        battleScene.events.off('ui-clear-stats');

        battleScene.events.on('ui-update-stats', (hero) => {
            this.updateStats(hero);
            this.showPanel(); // ANIMAÇÃO DE ENTRADA
        });

        battleScene.events.on('ui-clear-stats', () => {
            this.hidePanel(); // ANIMAÇÃO DE SAÍDA
        });
    }

    /**
     * Animação: Painel sobe (Slide Up)
     */
    showPanel() {
        if (this.isPanelVisible) return; // Se já está visível, não anima de novo
        
        this.isPanelVisible = true;
        const { height } = this.scale;

        this.tweens.add({
            targets: this.panelContainer,
            y: height - this.panelHeight, // Sobe até a posição visível
            duration: 300, // 300ms (rápido e fluido)
            ease: 'Back.out' // Efeito "elástico" suave no final
        });
    }

    /**
     * Animação: Painel desce (Slide Down)
     */
    hidePanel() {
        if (!this.isPanelVisible) return;

        this.isPanelVisible = false;
        const { height } = this.scale;
        
        // Esconde o tooltip se estiver aberto
        this.hideTooltip();

        this.tweens.add({
            targets: this.panelContainer,
            y: height, // Desce para fora da tela
            duration: 200,
            ease: 'Power2'
        });
    }

    updateStats(hero) {
        if (!hero) return;
        this.currentHeroData = hero;

        this.nameText.setText(hero.name);
        this.levelText.setText(`Nível ${hero.level || 1} - ${hero.classKey}`);

        if (hero.sprite) {
            this.portrait.setTexture(hero.sprite.texture.key);
            const maxDim = Math.max(hero.sprite.width, hero.sprite.height);
            this.portrait.setScale(60 / maxDim);
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
        
        // Efeito de piscar no container do botão
        this.tweens.add({
            targets: this.exportContainer,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 1
        });
    }
}