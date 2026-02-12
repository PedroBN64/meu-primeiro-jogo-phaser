/**
 * ARQUIVO: src/scenes/BattleScene.js
 * DESCRIÇÃO: Versão Corrigida - Sincronia de Turnos e Botão de Encerrar.
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
        
        // --- EVENTOS CRUCIALMENTE SINCRONIZADOS ---
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
            this.pathfinder.setObstacle(unit.gridX, unit.gridY, true);

            const pos = this.grid.getWorldPosition(unit.gridX, unit.gridY);
            const sprite = this.add.image(pos.x, pos.y, isPlayer ? CLASSES[unit.classKey].sprite : unit.sprite);
            sprite.setScale((64 * 0.8) / sprite.height).setOrigin(0.5, 0.8);
            if (!isPlayer) sprite.setFlipX(true);
            unit.sprite = sprite;
            unit.currentHp = unit.stats.hp;
        });
    }

    handleTurnStart(unit) {
        this.isMoving = false;
        this.selectedHero = null;
        this.grid.clearHighlights();
        
        unit.hasMoved = false;
        unit.hasAttacked = false;

        this.showTurnBanner(unit);

        if (unit.isPlayer) {
            // Garante que o botão apareça assim que o turno começa
            this.time.delayedCall(100, () => {
                this.events.emit('ui-enable-turn-button', true);
            });
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

    handleTileClick(pointer) {
        const currentUnit = this.turnSystem.currentUnit;
        if (this.isMoving || !currentUnit || !currentUnit.isPlayer) return;

        const { col, row, valid } = this.grid.update(pointer);
        if (!valid) return;

        const targetUnit = this.enemies.concat(this.party).find(u => u.gridX === col && u.gridY === row && !u.isDead);

        // 1. Se clicou em um Inimigo -> Tenta Atacar
        if (targetUnit && !targetUnit.isPlayer) {
            this.tryAttack(currentUnit, targetUnit);
        } 
        // 2. Se clicou no herói da vez -> Mostra área de movimento (se não moveu ainda)
        else if (targetUnit === currentUnit) {
            this.selectHero(currentUnit);
        }
        // 3. Se já selecionou e clicou no vazio -> Tenta Mover
        else if (this.selectedHero && !currentUnit.hasMoved) {
            this.tryMoveHero(col, row);
        }
    }

    selectHero(hero) {
        if (hero.hasMoved) return;
        this.selectedHero = hero;
        this.grid.clearHighlights();

        const moveRange = hero.mobility || 3;
        const reachable = this.pathfinder.getReachableTiles(hero.gridX, hero.gridY, moveRange);
        
        reachable.forEach(t => this.grid.highlightTile(t.x, t.y, 0x00aaff));
        this.grid.highlightTile(hero.gridX, hero.gridY, 0x00ff00);
        this.events.emit('ui-update-stats', hero);
    }

    tryMoveHero(targetCol, targetRow) {
        const hero = this.selectedHero;
        const path = this.pathfinder.findPath(hero.gridX, hero.gridY, targetCol, targetRow);
        
        if (path && path.length <= (hero.mobility || 3)) {
            this.moveHeroAlongPath(hero, path);
        }
    }

    moveHeroAlongPath(hero, path) {
        this.isMoving = true;
        this.grid.clearHighlights();
        this.pathfinder.setObstacle(hero.gridX, hero.gridY, false);
        hero.hasMoved = true;
        this.moveNextStep(hero, path, 0);
    }

    moveNextStep(hero, path, index) {
        if (index >= path.length) {
            this.isMoving = false;
            this.pathfinder.setObstacle(hero.gridX, hero.gridY, true);
            // IMPORTANTE: Após mover, não deseleciona o herói para ele poder atacar!
            this.highlightCurrentUnit(hero);
            return;
        }

        const next = path[index];
        const pos = this.grid.getWorldPosition(next.x, next.y);
        hero.sprite.setFlipX(next.x < hero.gridX);
        hero.gridX = next.x;
        hero.gridY = next.y;

        this.tweens.add({
            targets: hero.sprite,
            x: pos.x, y: pos.y,
            duration: 250,
            onComplete: () => this.moveNextStep(hero, path, index + 1)
        });
    }

    tryAttack(attacker, target) {
        if (attacker.hasAttacked) return;

        const dist = Math.abs(attacker.gridX - target.gridX) + Math.abs(attacker.gridY - target.gridY);
        if (dist <= (attacker.range || 1)) {
            this.executeAttack(attacker, target);
        } else {
            console.log("Muito longe para atacar!");
        }
    }

    executeAttack(attacker, target) {
        attacker.hasAttacked = true;
        this.grid.clearHighlights();

        const damage = Math.max(1, (attacker.stats.str || 5) - (target.stats.def || 2));
        target.currentHp -= damage;
        this.events.emit('ui-update-stats', target);

        // Animação de dano
        this.tweens.add({
            targets: target.sprite,
            x: target.sprite.x + 4,
            yoyo: true, duration: 50, repeat: 3,
            onComplete: () => {
                if (target.currentHp <= 0) this.handleDeath(target);
                // Se o herói já moveu e atacou, passa o turno automaticamente
                if (attacker.hasMoved && attacker.hasAttacked) {
                    this.time.delayedCall(500, () => this.endPlayerTurn());
                }
            }
        });
    }

    handleDeath(unit) {
        unit.isDead = true;
        this.pathfinder.setObstacle(unit.gridX, unit.gridY, false);
        this.tweens.add({ targets: unit.sprite, angle: 90, alpha: 0.5, duration: 500 });
    }

    endPlayerTurn() {
        if (this.isMoving) return;
        if (this.currentTween) this.currentTween.stop();
        this.events.emit('ui-enable-turn-button', false); // Esconde o botão IMEDIATAMENTE
        this.turnSystem.nextTurn();
    }

    enemyAI(enemy) {
        this.endPlayerTurn(); // Inimigo apenas passa a vez por enquanto
    }

    showTurnBanner(unit) {
        const banner = this.add.text(this.scale.width / 2, 150, `VEZ DE: ${unit.name.toUpperCase()}`, {
            fontSize: '32px', fontStyle: 'bold', fill: unit.isPlayer ? '#3498db' : '#e74c3c',
            stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5).setDepth(1000);

        this.tweens.add({
            targets: banner, y: 100, alpha: 0, duration: 1500,
            onComplete: () => banner.destroy()
        });
    }
}