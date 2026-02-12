/**
 * ARQUIVO: src/systems/GridSystem.js
 * DESCRIÇÃO: Gerencia o tabuleiro, converte coordenadas e desenha o chão.
 * ATUALIZAÇÃO: Adicionado destroy() para evitar vazamento de memória.
 */

export class GridSystem {
    /**
     * @param {Phaser.Scene} scene - A cena que vai desenhar o grid
     * @param {number} mapWidth - Quantas colunas tem o mapa
     * @param {number} mapHeight - Quantas linhas tem o mapa
     * @param {number} tileSize - Tamanho de cada quadrado (ex: 64px)
     */
    constructor(scene, mapWidth = 10, mapHeight = 8, tileSize = 64) {
        if (!scene) console.error("GridSystem: Cena inválida!");
        
        this.scene = scene;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.tileSize = tileSize;

        this.tileGroup = this.scene.add.group();
        this.cursorMarker = null;
        this.highlightLayer = null;
    }

    createMap() {
        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;
        
        // Centraliza o mapa
        this.offsetX = (screenWidth - (this.mapWidth * this.tileSize)) / 2;
        this.offsetY = (screenHeight - (this.mapHeight * this.tileSize)) / 2;

        for (let row = 0; row < this.mapHeight; row++) {
            for (let col = 0; col < this.mapWidth; col++) {
                const x = this.offsetX + (col * this.tileSize) + (this.tileSize / 2);
                const y = this.offsetY + (row * this.tileSize) + (this.tileSize / 2);

                const tile = this.scene.add.image(x, y, 'piso');
                tile.setDisplaySize(this.tileSize, this.tileSize);
                tile.setDepth(0); // Chão fica no fundo
                
                this.tileGroup.add(tile);
            }
        }

        this.createCursor();
    }

    createCursor() {
        this.cursorMarker = this.scene.add.graphics();
        this.cursorMarker.lineStyle(4, 0xffff00, 1);
        this.cursorMarker.strokeRect(
            -this.tileSize / 2, 
            -this.tileSize / 2, 
            this.tileSize, 
            this.tileSize
        );
        this.cursorMarker.setVisible(false);
        this.cursorMarker.setDepth(10); // Cursor sempre no topo
    }

    update(pointer) {
        // --- PROTEÇÃO ---
        // Se a cena já morreu, não faz nada
        if (!this.scene) return { valid: false };
        if (!pointer) return { valid: false };

        const col = Math.floor((pointer.x - this.offsetX) / this.tileSize);
        const row = Math.floor((pointer.y - this.offsetY) / this.tileSize);

        if (col >= 0 && col < this.mapWidth && row >= 0 && row < this.mapHeight) {
            this.cursorMarker.setVisible(true);
            
            const worldX = this.offsetX + (col * this.tileSize) + (this.tileSize / 2);
            const worldY = this.offsetY + (row * this.tileSize) + (this.tileSize / 2);
            
            this.cursorMarker.setPosition(worldX, worldY);

            return { col, row, worldX, worldY, valid: true };
        } else {
            this.cursorMarker.setVisible(false);
            return { valid: false };
        }
    }

    getWorldPosition(col, row) {
        const x = this.offsetX + (col * this.tileSize) + (this.tileSize / 2);
        const y = this.offsetY + (row * this.tileSize) + (this.tileSize / 2);
        return { x, y };
    }

    highlightTile(col, row, color = 0x0000ff) {
        if (!this.highlightLayer) {
            this.highlightLayer = this.scene.add.graphics();
            this.highlightLayer.setDepth(1); // Acima do chão
        }

        const worldPos = this.getWorldPosition(col, row);
        
        this.highlightLayer.fillStyle(color, 0.5);
        this.highlightLayer.fillRect(
            worldPos.x - this.tileSize / 2, 
            worldPos.y - this.tileSize / 2, 
            this.tileSize, 
            this.tileSize
        );
    }

    clearHighlights() {
        if (this.highlightLayer) {
            this.highlightLayer.clear();
        }
    }

    // --- NOVO MÉTODO OBRIGATÓRIO PARA LIMPEZA ---
    destroy() {
        console.log("GridSystem: Destruindo...");
        
        if (this.tileGroup) {
            this.tileGroup.clear(true, true); // Remove sprites e destroi texturas
            this.tileGroup.destroy();
        }
        
        if (this.cursorMarker) {
            this.cursorMarker.destroy();
        }
        
        if (this.highlightLayer) {
            this.highlightLayer.destroy();
        }

        this.scene = null; // Quebra a referência circular com a cena
    }
}