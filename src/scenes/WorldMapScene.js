/**
 * ARQUIVO: src/scenes/WorldMapScene.js
 * DESCRIÇÃO: Cena do Mapa Mundi. 
 * MELHORIAS: Persistência da posição do jogador e efeitos visuais.
 */

import { LOCATIONS } from '../data/locations.js';

export class WorldMapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WorldMapScene' });
    }

    create() {
        const { width, height } = this.scale;
        
        // Fundo
        this.add.rectangle(width/2, height/2, width, height, 0x3d2b1f);
        this.add.text(width / 2, 40, 'MAPA DE AVENTURA', { 
            fontSize: '32px', fontStyle: 'bold', fill: '#f1c40f' 
        }).setOrigin(0.5);

        this.graphics = this.add.graphics();
        this.drawConnections();

        Object.values(LOCATIONS).forEach(loc => {
            this.createLocationNode(loc);
        });

        // --- MELHORIA 1: LEMBRAR ONDE O JOGADOR ESTAVA ---
        // Tenta pegar do Registry. Se não tiver (jogo começou agora), usa VILA_INICIAL
        const lastLocId = this.registry.get('currentLocationId');
        let startLoc = LOCATIONS[lastLocId];

        // Fallback se não encontrar
        if (!startLoc) startLoc = LOCATIONS.VILA_INICIAL;

        this.playerToken = this.add.circle(startLoc.x, startLoc.y, 12, 0xffff00).setDepth(10);
        this.playerToken.setStrokeStyle(3, 0x000000);
        // --------------------------------------------------

        this.isTraveling = false;
        
        this.add.text(width / 2, height - 30, 'Clique nos locais verdes para viajar', { fontSize: '16px', fill: '#aaa' }).setOrigin(0.5);
    }

    drawConnections() {
        this.graphics.lineStyle(4, 0x000000, 0.3);
        Object.values(LOCATIONS).forEach(loc => {
            if (loc.connections) {
                loc.connections.forEach(targetId => {
                    const target = LOCATIONS[targetId];
                    // Segurança: Só desenha se o destino existir
                    if (target) {
                        this.graphics.lineBetween(loc.x, loc.y, target.x, target.y);
                    }
                });
            }
        });
    }

    createLocationNode(loc) {
        const color = loc.unlocked ? 0x2ecc71 : 0x7f8c8d; // Verde ou Cinza
        
        const dot = this.add.circle(loc.x, loc.y, 18, color).setStrokeStyle(2, 0x000000);
        
        // Texto com sombra para leitura melhor
        this.add.text(loc.x + 1, loc.y + 31, loc.name, { fontSize: '16px', fontStyle: 'bold', fill: '#000' }).setOrigin(0.5);
        this.add.text(loc.x, loc.y + 30, loc.name, { fontSize: '16px', fontStyle: 'bold', fill: '#ffffff' }).setOrigin(0.5);

        if (loc.unlocked) {
            dot.setInteractive({ useHandCursor: true });
            
            // --- MELHORIA 2: EFEITO DE PULSO (CHAMAR ATENÇÃO) ---
            this.tweens.add({
                targets: dot,
                scale: 1.1,
                duration: 800,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            // ---------------------------------------------------

            dot.on('pointerdown', () => {
                if (this.isTraveling) return;
                
                // Só viaja se não estiver já no local (opcional)
                const currentId = this.registry.get('currentLocationId');
                if (currentId === loc.id) {
                    // Se clicar onde já está, entra direto na fase
                    this.scene.start(loc.scene, { locationId: loc.id });
                } else {
                    this.travelTo(loc);
                }
            });

            // Efeito Hover extra
            dot.on('pointerover', () => dot.setFillStyle(0x00ff00)); // Verde brilhante
            dot.on('pointerout', () => dot.setFillStyle(color));
        }
    }

    travelTo(loc) {
        this.isTraveling = true;

        // --- MELHORIA 3: SALVAR O DESTINO NA MEMÓRIA ---
        this.registry.set('currentLocationId', loc.id);

        this.tweens.add({
            targets: this.playerToken,
            x: loc.x,
            y: loc.y,
            duration: 1000,
            ease: 'Cubic.easeInOut', // Movimento suave (acelera e desacelera)
            onComplete: () => {
                this.time.delayedCall(300, () => {
                    this.isTraveling = false;
                    this.scene.start(loc.scene, { locationId: loc.id });
                });
            }
        });
    }
}