/**
 * ARQUIVO: src/systems/PathfindingSystem.js
 * DESCRIÇÃO: Sistema de navegação inteligente.
 * CONTÉM: 
 * 1. Algoritmo A* (A-Star) para calcular rotas ponto-a-ponto.
 * 2. Algoritmo BFS (Flood Fill) para calcular área de movimento.
 */

export class PathfindingSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        // Grid lógico: 0 = Livre, 1 = Bloqueado
        this.grid = []; 
        this.initGrid();
    }

    initGrid() {
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] = 0; 
            }
        }
    }

    /**
     * Define se uma posição é obstáculo (1) ou livre (0)
     */
    setObstacle(x, y, isBlocked) {
        if (this.isValid(x, y)) {
            this.grid[y][x] = isBlocked ? 1 : 0;
        }
    }

    isValid(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    isBlocked(x, y) {
        return this.isValid(x, y) && this.grid[y][x] === 1;
    }

    /**
     * ALGORITMO 1: A* (A-Star)
     * Retorna a melhor rota entre A e B desviando de obstáculos.
     * Retorna: Array de passos [{x,y}, {x,y}...] ou null se impossível.
     */
    findPath(startX, startY, endX, endY) {
        // Se o destino é uma parede/inimigo, não dá para ir
        if (this.isBlocked(endX, endY)) return null;

        let openList = [];
        let closedList = [];

        // Adiciona o início
        openList.push({ x: startX, y: startY, parent: null, g: 0, h: 0, f: 0 });

        while (openList.length > 0) {
            // 1. Pega o nó com menor custo F
            let lowInd = 0;
            for (let i = 0; i < openList.length; i++) {
                if (openList[i].f < openList[lowInd].f) { lowInd = i; }
            }
            let currentNode = openList[lowInd];

            // 2. Chegou ao destino?
            if (currentNode.x === endX && currentNode.y === endY) {
                let curr = currentNode;
                let path = [];
                while (curr.parent) {
                    path.push({ x: curr.x, y: curr.y });
                    curr = curr.parent;
                }
                return path.reverse(); // Inverte para ir do início ao fim
            }

            // 3. Move da lista Aberta para Fechada
            openList.splice(lowInd, 1);
            closedList.push(currentNode);

            // 4. Analisa Vizinhos
            let neighbors = [
                { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
            ];

            for (let i = 0; i < neighbors.length; i++) {
                let nx = currentNode.x + neighbors[i].x;
                let ny = currentNode.y + neighbors[i].y;

                if (!this.isValid(nx, ny) || this.isBlocked(nx, ny)) continue;
                
                // Se já visitamos este nó na lista fechada, ignora
                if (closedList.find(node => node.x === nx && node.y === ny)) continue;

                let gScore = currentNode.g + 1;
                let hScore = Math.abs(nx - endX) + Math.abs(ny - endY); // Manhattan
                let fScore = gScore + hScore;

                // Verifica se já existe na lista aberta com um caminho melhor
                let existing = openList.find(n => n.x === nx && n.y === ny);
                if (existing && gScore >= existing.g) continue;

                // Adiciona ou Atualiza na lista aberta
                if (!existing) {
                    openList.push({ x: nx, y: ny, parent: currentNode, g: gScore, h: hScore, f: fScore });
                } else {
                    existing.g = gScore;
                    existing.parent = currentNode;
                    existing.f = fScore;
                }
            }
        }
        return null; // Caminho não encontrado
    }

    /**
     * ALGORITMO 2: BFS (Flood Fill)
     * Retorna todos os tiles que podem ser alcançados com X passos.
     * Útil para desenhar a área azul de movimento.
     */
    getReachableTiles(startX, startY, maxSteps) {
        let reachable = [];
        let visited = new Set();
        let queue = [{ x: startX, y: startY, steps: 0 }];
        
        visited.add(`${startX},${startY}`);

        while (queue.length > 0) {
            let current = queue.shift();

            // Se não é o ponto inicial, é um tile válido para andar
            if (current.steps > 0) {
                reachable.push({ x: current.x, y: current.y });
            }

            if (current.steps >= maxSteps) continue;

            let neighbors = [
                { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
            ];

            for (let i = 0; i < neighbors.length; i++) {
                let nx = current.x + neighbors[i].x;
                let ny = current.y + neighbors[i].y;
                let key = `${nx},${ny}`;

                if (this.isValid(nx, ny) && !this.isBlocked(nx, ny) && !visited.has(key)) {
                    visited.add(key);
                    queue.push({ x: nx, y: ny, steps: current.steps + 1 });
                }
            }
        }
        return reachable;
    }
}