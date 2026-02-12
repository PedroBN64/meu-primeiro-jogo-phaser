/**
 * ARQUIVO: src/scenes/BattleScene.js
 * DESCRIÇÃO: Versão Final com IA corrigida e Barras de Vida Flutuantes.
 */

import { GridSystem } from '../systems/GridSystem.js';
import { PathfindingSystem } from '../systems/PathfindingSystem.js';
import { TurnSystem } from '../systems/TurnSystem.js';
import { CLASSES } from '../data/classes.js';
import { MONSTERS } from '../data/monsters.js';

export class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    preload() {
        this.load.image('piso', 'assets/piso.png');
        Object.keys(CLASSES).forEach(key => {
            this.load.image(CLASSES[key].sprite, `assets/${CLASSES[key].sprite.replace('img_', '')}.png`);
        });
        Object.keys(MONSTERS).forEach(key => {
            this.load.image(MONSTERS[key].sprite, `assets/${MONSTERS[key].sprite.replace('img_', '')}.png`);
        });
    }

    create() {
        this.grid = new GridSystem(this, 12, 8, 64);
        this.grid.createMap();
        this.pathfinder = new PathfindingSystem(12, 8);
        this.turnSystem = new TurnSystem(this);

        this.party = this.registry.get('party') || [];
        this.spawnUnits(this.party, 1, true);

        this.enemies = [
            { ...MONSTERS.GOBLIN, gridX: 9, gridY: 2, uniqueId: 'gob_1' },
            { ...MONSTERS.ORC, gridX: 9, gridY: 5, uniqueId: 'orc_1' }
        ];
        this.spawnUnits(this.enemies, 9, false);

        this.scene.launch('UIScene');
        
        this.events.off('ui-end-turn'); 
        this.events.on('ui-end-turn', () => this.endPlayerTurn());
        this.events.on('turn-start', (unit) => this.handleTurnStart(unit));

        this.turnSystem.addUnits(this.party, this.enemies);
        this.isMoving = false;
        
        this.input.on('pointerdown', (pointer) => this.handleTileClick(pointer));
        this.turnSystem.startCombat();
    }

    update() {
        this.grid.update(this.input.activePointer);
    }

    spawnUnits(units, startCol, isPlayer) {
        units.forEach((unit, index) => {
            unit.gridX = unit.gridX ?? startCol;
            unit.gridY = unit.gridY ?? 2 + index;
            unit.isPlayer = isPlayer;
            this.pathfinder.setObstacle(unit.gridX, unit.gridY, true);

            const pos = this.grid.getWorldPosition(unit.gridX, unit.gridY);
            const spriteKey = isPlayer ? CLASSES[unit.classKey].sprite : unit.sprite;
            const sprite = this.add.image(pos.x, pos.y, spriteKey);
            
            sprite.setScale((64 * 0.8) / sprite.height).setOrigin(0.5, 0.8);
            if (!isPlayer) sprite.setFlipX(true);
            unit.sprite = sprite;
            unit.currentHp = unit.stats.hp;

            // Criar container para a barra de vida sobre a cabeça
            this.createLifeBar(unit);
        });
    }

    createLifeBar(unit) {
        const barWidth = 40;
        const barHeight = 6;
        const x = unit.sprite.x - barWidth / 2;
        const y = unit.sprite.y - 70; // Acima da cabeça

        unit.barBg = this.add.rectangle(x, y, barWidth, barHeight, 0x000000).setOrigin(0);
        unit.barFill = this.add.rectangle(x, y, barWidth, barHeight, 0x00ff00).setOrigin(0);
    }

    updateLifeBar(unit) {
        if (!unit.barFill) return;
        const percent = Phaser.Math.Clamp(unit.currentHp / unit.stats.hp, 0, 1);
        this.tweens.add({
            targets: unit.barFill,
            width: 40 * percent,
            duration: 200
        });
        // Muda cor para vermelho se estiver morrendo
        if (percent < 0.3) unit.barFill.setFillStyle(0xff0000);
    }

    handleTurnStart(unit) {
        this.isMoving = false;
        this.selectedHero = null;
        this.grid.clearHighlights();
        
        unit.hasMoved = false;
        unit.hasAttacked = false;

        this.showTurnBanner(unit);

        if (unit.isPlayer) {
            this.time.delayedCall(100, () => this.events.emit('ui-enable-turn-button', true));
            this.highlightCurrentUnit(unit);
            this.events.emit('ui-update-stats', unit);
        } else {
            this.events.emit('ui-enable-turn-button', false);
            this.time.delayedCall(1500, () => this.enemyAI(unit));
        }
    }

    highlightCurrentUnit(unit) {
        if (this.currentTween) this.currentTween.stop();
        this.party.concat(this.enemies).forEach(u => u.sprite.setTint(0xffffff));
        this.currentTween = this.tweens.add({
            targets: unit.sprite,
            tint: 0x00aaff,
            duration: 600,
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * Tenta realizar um ataque se o alvo for válido e estiver no alcance
     */
    tryAttack(attacker, target) {
        // Se o atacante já usou sua ação de ataque neste turno, ignora
        if (attacker.hasAttacked || target.isDead) return;

        // Calcula a distância entre os dois
        const dist = Math.abs(attacker.gridX - target.gridX) + Math.abs(attacker.gridY - target.gridY);
        const range = attacker.range || 1; // Padrão é 1 (corpo a corpo)

        if (dist <= range) {
            console.log(`${attacker.name} atacando ${target.name}!`);
            this.executeAttack(attacker, target);
        } else {
            console.log("Inimigo muito longe para atacar!");
            // Opcional: Mostrar um pequeno aviso visual de "Fora de Alcance"
        }
    }

    /**
     * Lógica de clique atualizada para não dar erro
     */
    handleTileClick(pointer) {
        const currentUnit = this.turnSystem.currentUnit;
        
        // Bloqueios de segurança
        if (this.isMoving || !currentUnit || !currentUnit.isPlayer) return;

        const { col, row, valid } = this.grid.update(pointer);
        if (!valid) return;

        // 1. Procura se tem alguém no lugar clicado
        const targetUnit = this.enemies.concat(this.party).find(u => u.gridX === col && u.gridY === row && !u.isDead);

        if (targetUnit) {
            if (!targetUnit.isPlayer) {
                // Se clicou num inimigo -> TENTA ATACAR
                this.tryAttack(currentUnit, targetUnit);
            } else if (targetUnit === currentUnit) {
                // Se clicou no herói da vez -> MOSTRA GRID DE MOVIMENTO
                this.selectHero(currentUnit);
            }
        } 
        // 2. Se não clicou em ninguém e já tinha selecionado o herói -> TENTA MOVER
        else if (this.selectedHero && !currentUnit.hasMoved) {
            this.tryMoveHero(col, row);
        }
    }

    selectHero(hero) {
        if (hero.hasMoved) return;
        this.selectedHero = hero;
        this.grid.clearHighlights();
        const reachable = this.pathfinder.getReachableTiles(hero.gridX, hero.gridY, hero.mobility || 3);
        reachable.forEach(t => this.grid.highlightTile(t.x, t.y, 0x00aaff));
        this.grid.highlightTile(hero.gridX, hero.gridY, 0x00ff00);
    }

    tryMoveHero(targetCol, targetRow) {
        const hero = this.selectedHero;
        const path = this.pathfinder.findPath(hero.gridX, hero.gridY, targetCol, targetRow);
        if (path && path.length <= (hero.mobility || 3)) {
            this.moveHeroAlongPath(hero, path);
        }
    }

    moveHeroAlongPath(hero, path, callback) {
        this.isMoving = true;
        this.grid.clearHighlights();
        this.pathfinder.setObstacle(hero.gridX, hero.gridY, false);
        hero.hasMoved = true;
        this.moveNextStep(hero, path, 0, callback);
    }

    moveNextStep(hero, path, index, callback) {
        if (index >= path.length) {
            this.isMoving = false;
            this.pathfinder.setObstacle(hero.gridX, hero.gridY, true);
            if (hero.isPlayer && !hero.hasAttacked) this.highlightCurrentUnit(hero);
            if (callback) callback();
            return;
        }

        const next = path[index];
        const pos = this.grid.getWorldPosition(next.x, next.y);
        hero.sprite.setFlipX(next.x < hero.gridX);
        hero.gridX = next.x;
        hero.gridY = next.y;

        this.tweens.add({
            targets: [hero.sprite, hero.barBg, hero.barFill], // Move a barra junto!
            x: (target) => target === hero.sprite ? pos.x : pos.x - 20,
            y: (target) => target === hero.sprite ? pos.y : pos.y - 70,
            duration: 250,
            onComplete: () => this.moveNextStep(hero, path, index + 1, callback)
        });
    }

    executeAttack(attacker, target) {
        attacker.hasAttacked = true;
        this.grid.clearHighlights();
        if (this.currentTween) this.currentTween.stop();
        attacker.sprite.setTint(0xffffff);

        const damage = Math.max(1, (attacker.stats.str || 5) - (target.stats.def || 2));
        target.currentHp -= damage;

        this.showDamageText(target.sprite.x, target.sprite.y, damage);
        this.updateLifeBar(target); // ATUALIZA BARRINHA
        this.events.emit('ui-update-stats', target);

        this.tweens.add({
            targets: target.sprite,
            x: target.sprite.x + 4,
            yoyo: true, duration: 50, repeat: 3,
            onComplete: () => {
                if (target.currentHp <= 0) this.handleDeath(target);
                if (!attacker.isPlayer || (attacker.hasMoved && attacker.hasAttacked)) {
                    this.time.delayedCall(600, () => this.endPlayerTurn());
                }
            }
        });
    }

    enemyAI(enemy) {
        if (enemy.isDead) return this.endPlayerTurn();

        let target = this.party.filter(h => !h.isDead).sort((a,b) => 
            (Math.abs(enemy.gridX - a.gridX) + Math.abs(enemy.gridY - a.gridY)) - 
            (Math.abs(enemy.gridX - b.gridX) + Math.abs(enemy.gridY - b.gridY))
        )[0];

        if (!target) return this.endPlayerTurn();

        const dist = Math.abs(enemy.gridX - target.gridX) + Math.abs(enemy.gridY - target.gridY);
        const range = enemy.range || 1;
        
        if (dist <= range) {
            this.executeAttack(enemy, target);
        } else {
            const vizinhos = [
                {x: target.gridX, y: target.gridY - 1}, {x: target.gridX, y: target.gridY + 1},
                {x: target.gridX - 1, y: target.gridY}, {x: target.gridX + 1, y: target.gridY}
            ];
            // CORREÇÃO DO ERRO AQUI: USANDO this.pathfinder.isValid
            const destinosValidos = vizinhos.filter(v => 
                this.pathfinder.isValid(v.x, v.y) && !this.pathfinder.isBlocked(v.x, v.y)
            );

            destinosValidos.sort((a,b) => 
                (Math.abs(enemy.gridX - a.x) + Math.abs(enemy.gridY - a.y)) - 
                (Math.abs(enemy.gridX - b.x) + Math.abs(enemy.gridY - b.y))
            );

            if (destinosValidos.length > 0) {
                const path = this.pathfinder.findPath(enemy.gridX, enemy.gridY, destinosValidos[0].x, destinosValidos[0].y);
                if (path) {
                    const actualPath = path.slice(0, enemy.mobility || 3);
                    this.moveHeroAlongPath(enemy, actualPath, () => {
                        const newDist = Math.abs(enemy.gridX - target.gridX) + Math.abs(enemy.gridY - target.gridY);
                        if (newDist <= range) this.executeAttack(enemy, target);
                        else this.endPlayerTurn();
                    });
                } else { this.endPlayerTurn(); }
            } else { this.endPlayerTurn(); }
        }
    }

    handleDeath(unit) {
        unit.isDead = true;
        this.pathfinder.setObstacle(unit.gridX, unit.gridY, false);
        if (unit.barBg) unit.barBg.destroy();
        if (unit.barFill) unit.barFill.destroy();
        this.tweens.add({ targets: unit.sprite, angle: 90, alpha: 0.5, duration: 500 });
    }

    endPlayerTurn() {
        if (this.isMoving) return;
        if (this.currentTween) this.currentTween.stop();
        this.events.emit('ui-enable-turn-button', false);
        this.turnSystem.nextTurn();
    }

    showTurnBanner(unit) {
        const banner = this.add.text(this.scale.width / 2, 150, `VEZ DE: ${unit.name.toUpperCase()}`, {
            fontSize: '32px', fontStyle: 'bold', fill: unit.isPlayer ? '#3498db' : '#e74c3c',
            stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(1000);
        this.tweens.add({ targets: banner, y: 100, alpha: 0, duration: 1500, onComplete: () => banner.destroy() });
    }

    showDamageText(x, y, amount) {
        const damageText = this.add.text(x, y - 40, `-${amount}`, {
            fontSize: '28px', fontStyle: 'bold', fill: '#ff0000', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(2000);
        this.tweens.add({ targets: damageText, y: y - 100, alpha: 0, duration: 1000, onComplete: () => damageText.destroy() });
    }
}