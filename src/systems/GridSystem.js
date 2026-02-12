/**
 * ARQUIVO: src/systems/GridSystem.js
 * DESCRIÇÃO: Gerencia o tabuleiro, converte coordenadas e desenha o chão.
 */

export class GridSystem {
    /**
     * @param {Phaser.Scene} scene - A cena que vai desenhar o grid
     * @param {number} mapWidth - Quantas colunas tem o mapa
     * @param {number} mapHeight - Quantas linhas tem o mapa
     * @param {number} tileSize - Tamanho de cada quadrado (ex: 64px)
     */
    constructor(scene, mapWidth = 10, mapHeight = 8, tileSize = 64) {
        this.scene = scene;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.tileSize = tileSize;

        // Grupo para guardar os sprites do chão (útil para destruir o mapa depois)
        this.tileGroup = this.scene.add.group();
        
        // Marcador de seleção (o quadrado amarelo que segue o mouse)
        this.cursorMarker = null;
    }

    /**
     * Cria os sprites do chão visualmente
     */
    createMap() {
        // Centraliza o mapa na tela
        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;
        
        // Calculamos o offset para o mapa ficar bem no meio
        this.offsetX = (screenWidth - (this.mapWidth * this.tileSize)) / 2;
        this.offsetY = (screenHeight - (this.mapHeight * this.tileSize)) / 2;

        // Loop duplo para criar as linhas e colunas
        for (let row = 0; row < this.mapHeight; row++) {
            for (let col = 0; col < this.mapWidth; col++) {
                // Converte Col/Row para X/Y na tela
                const x = this.offsetX + (col * this.tileSize) + (this.tileSize / 2);
                const y = this.offsetY + (row * this.tileSize) + (this.tileSize / 2);

                // Cria o sprite do chão
                // 'piso' é a key que carregaremos no preload da cena
                const tile = this.scene.add.image(x, y, 'piso');
                
                // Ajusta o tamanho do sprite caso a imagem seja maior/menor que 64px
                tile.setDisplaySize(this.tileSize, this.tileSize);
                
                this.tileGroup.add(tile);
            }
        }

        this.createCursor();
    }

    /**
     * Cria o quadrado de seleção (Cursor)
     */
    createCursor() {
        // Criamos um quadrado apenas com borda (Stroke)
        this.cursorMarker = this.scene.add.graphics();
        this.cursorMarker.lineStyle(4, 0xffff00, 1); // Borda Amarela, espessura 4
        this.cursorMarker.strokeRect(
            -this.tileSize / 2, 
            -this.tileSize / 2, 
            this.tileSize, 
            this.tileSize
        );
        
        // Inicialmente invisível até mover o mouse
        this.cursorMarker.setVisible(false);
    }

    /**
     * Atualiza a posição do cursor baseado no mouse
     */
    update(pointer) {
        // 1. Converte a posição do mouse (pixels) para Posição do Grid (col, row)
        const col = Math.floor((pointer.x - this.offsetX) / this.tileSize);
        const row = Math.floor((pointer.y - this.offsetY) / this.tileSize);

        // 2. Verifica se o mouse está DENTRO do tabuleiro
        if (col >= 0 && col < this.mapWidth && row >= 0 && row < this.mapHeight) {
            this.cursorMarker.setVisible(true);
            
            // 3. Move o marcador para o centro desse tile
            const worldX = this.offsetX + (col * this.tileSize) + (this.tileSize / 2);
            const worldY = this.offsetY + (row * this.tileSize) + (this.tileSize / 2);
            
            this.cursorMarker.setPosition(worldX, worldY);

            // Retorna a posição do grid para quem chamou (útil para cliques)
            return { col, row, worldX, worldY, valid: true };
        } else {
            this.cursorMarker.setVisible(false);
            return { valid: false };
        }
    }

    /**
     * Helper: Pega a posição exata em pixels de uma célula
     */
    getWorldPosition(col, row) {
        const x = this.offsetX + (col * this.tileSize) + (this.tileSize / 2);
        const y = this.offsetY + (row * this.tileSize) + (this.tileSize / 2);
        return { x, y };
    }

    // --- NOVOS MÉTODOS PARA ILUMINAÇÃO (HIGHLIGHT) ---

    /**
     * Pinta um quadrado específico de uma cor
     * @param {number} col - Coluna
     * @param {number} row - Linha
     * @param {number} color - Cor Hex (ex: 0x0000ff para azul)
     */
    highlightTile(col, row, color = 0x0000ff) {
        // Usa o graphics (marcador) para desenhar um quadrado colorido semi-transparente
        if (!this.highlightLayer) {
            this.highlightLayer = this.scene.add.graphics();
            this.highlightLayer.setDepth(0); // Fica logo acima do chão, mas abaixo do personagem
        }

        const worldPos = this.getWorldPosition(col, row);
        
        this.highlightLayer.fillStyle(color, 0.5); // 0.5 = 50% transparente
        this.highlightLayer.fillRect(
            worldPos.x - this.tileSize / 2, 
            worldPos.y - this.tileSize / 2, 
            this.tileSize, 
            this.tileSize
        );
    }

    /**
     * Limpa todas as pinturas do chão (usado ao deselecionar)
     */
    clearHighlights() {
        if (this.highlightLayer) {
            this.highlightLayer.clear();
        }
    }




}