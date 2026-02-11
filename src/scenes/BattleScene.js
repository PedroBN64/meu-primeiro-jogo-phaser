/**
 * ARQUIVO: BattleScene.js
 */
export class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    create() {
        const { width, height } = this.scale;

        // 1. Criar o fundo azul
        this.bg = this.add.rectangle(0, 0, width, height, 0x1a237e)
            .setOrigin(0)
            .setInteractive();

        // 2. Lançar a UI por cima
        // O comando 'launch' é excelente para interfaces sobrepostas
        this.scene.launch('UIScene');

        // 3. Trazer a UI para o topo (Garante que ela fique na frente)
        this.scene.bringToTop('UIScene');

        // 4. Evento de Clique
        this.bg.on('pointerdown', () => {
            console.log("Clique no mapa azul!");
            this.events.emit('PLAYER_DAMAGE', 10);
        });
    }
}