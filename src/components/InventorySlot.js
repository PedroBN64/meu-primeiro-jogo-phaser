/**
 * ARQUIVO: InventorySlot.js
 * DESCRIÇÃO: Um slot quadrado para itens ou habilidades.
 */

export class InventorySlot extends Phaser.GameObjects.Container {
    constructor(scene, x, y, size = 50) {
        super(scene, x, y);

        // Fundo do Slot
        this.bg = scene.add.rectangle(0, 0, size, size, 0x222222)
            .setStrokeStyle(2, 0x555555)
            .setInteractive({ useHandCursor: true });

        // Placeholder para o ícone do item (inicia invisível)
        this.icon = scene.add.image(0, 0, null).setVisible(false);

        this.add([this.bg, this.icon]);

        // Feedback visual de Hover
        this.bg.on('pointerover', () => this.bg.setStrokeStyle(2, 0xffff00));
        this.bg.on('pointerout', () => this.bg.setStrokeStyle(2, 0x555555));

        scene.add.existing(this);
    }

    // Função para "equipar" um item no slot visualmente
    setItem(texture) {
        if (texture) {
            this.icon.setTexture(texture).setDisplaySize(35, 35).setVisible(true);
        } else {
            this.icon.setVisible(false);
        }
    }
}