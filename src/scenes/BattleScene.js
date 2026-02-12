/**
 * ARQUIVO: src/scenes/BattleScene.js
 * DESCRIÇÃO: Cena Principal.
 * CORREÇÃO: Garante que o método 'finishLevel' exista e funcione para sair da fase.
 */

import { GridSystem } from '../systems/GridSystem.js';
import { PathfindingSystem } from '../systems/PathfindingSystem.js';
import { TurnSystem } from '../systems/TurnSystem.js';
import { CLASSES } from '../data/classes.js';
import { MONSTERS } from '../data/monsters.js';
import { LOCATIONS } from '../data/locations.js';
import { MAPAS } from '../data/maps.js'; 

export class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    init(data) {
        // Pega o ID da localização ou usa o padrão
        this.currentLocationId = data.locationId || 'VILA_INICIAL';
        
        // Descobre qual mapa carregar com base na localização
        const locationConfig = LOCATIONS[this.currentLocationId];
        this.currentMapId = (locationConfig && locationConfig.config) ? locationConfig.config.mapId : 'vila_map';
        
        console.log(`[BattleScene] Iniciando Local: ${this.currentLocationId}, Mapa: ${this.currentMapId}`);
    }

    preload() {
        this.load.image('piso', 'assets/piso.png');
        this.load.image('heroi_placeholder', 'assets/piso.png'); 
        this.load.image('bau_fechado', 'assets/bau.png'); 

        Object.keys(CLASSES).forEach(key => {
            const s = CLASSES[key].sprite;
            if (s) this.load.image(s, `assets/${s.replace('img_', '')}.png`);
        });
        
        Object.keys(MONSTERS).forEach(key => {
            const s = MONSTERS[key].sprite;
            if (s) this.load.image(s, `assets/${s.replace('img_', '')}.png`);
        });
    }

    create() {
        // 1. FAXINA DE ENTRADA
        this.input.off('pointerdown');
        this.events.off('ui-end-turn'); 
        this.events.off('ui-show-exit');
        this.events.off('turn-start');

        // Estados
        this.battleEnded = false; 
        this.explorationMode = false;
        this.isBusy = false; // Bloqueio de input spam
        this.turnMarker = null; // Marcador visual (quadrado azul)

        // Sistemas
        this.grid = new GridSystem(this, 12, 8, 64);
        this.grid.createMap();
        this.pathfinder = new PathfindingSystem(12, 8);
        this.turnSystem = new TurnSystem(this);

        this.chests = []; 

        // 2. RECUPERA E RESETA HEROIS
        this.party = this.registry.get('party') || [];
        this.resetPartyData(); 

        // 3. SPAWNS
        this.spawnUnits(this.party, 1, true); 
        this.loadMapEnemies(); 
        this.spawnChests(); 

        // 4. UI
        this.scene.launch('UIScene');
        
        this.events.on('ui-end-turn', () => this.endPlayerTurn());
        this.events.on('turn-start', (unit) => this.handleTurnStart(unit));

        // 5. INÍCIO DO COMBATE
        this.turnSystem.addUnits(this.party, this.enemies);
        
        this.input.on('pointerdown', (pointer) => this.handleTileClick(pointer));
        this.turnSystem.startCombat();

        // 6. LIMPEZA NA SAÍDA
        this.events.once('shutdown', () => {
            this.cleanUpScene();
        });
    }

    cleanUpScene() {
        console.log("BattleScene: Limpando cena...");
        
        if (this.turnMarker) {
            this.turnMarker.destroy();
            this.turnMarker = null;
        }

        if (this.turnSystem) this.turnSystem.destroy();
        if (this.grid) this.grid.destroy();
        
        this.turnSystem = null; 
        this.grid = null;
        
        this.tweens.killAll();
        this.time.removeAllEvents();
        this.input.off('pointerdown');
        this.events.off('ui-end-turn');
        this.events.off('turn-start');
        this.events.off('ui-show-exit');
        
        if (this.scene.isActive('UIScene')) {
            this.scene.stop('UIScene');
        }
    }

    update() {
        if (this.grid && this.input.activePointer && !this.isBusy) {
            this.grid.update(this.input.activePointer);
        }
    }

    // =================================================================
    //  SETUP
    // =================================================================

    resetPartyData() {
        this.party.forEach((hero, index) => {
            hero.sprite = null; 
            hero.barBg = null;
            hero.barFill = null;
            hero.gridX = 1;
            hero.gridY = 2 + index; 
            hero.hasMoved = false;
            hero.hasAttacked = false;
            hero.isDead = false; 
        });
    }

    loadMapEnemies() {
        const mapData = MAPAS[this.currentMapId];
        this.enemies = []; 

        if (!mapData) {
            console.error(`ERRO: Mapa '${this.currentMapId}' não encontrado.`);
            return;
        }

        mapData.inimigos.forEach((enemyData, index) => {
            let spawnX = enemyData.x;
            let spawnY = enemyData.y;
            let isOccupied = true;
            let attempts = 0;

            while (isOccupied && attempts < 10) {
                const clashHero = this.party.some(h => h.gridX === spawnX && h.gridY === spawnY);
                const clashEnemy = this.enemies.some(e => e.gridX === spawnX && e.gridY === spawnY);
                if (clashHero || clashEnemy) {
                    spawnX += 1; 
                    if (spawnX > 11) { spawnX = 5; spawnY += 1; } 
                } else {
                    isOccupied = false;
                }
                attempts++;
            }

            const baseMonster = MONSTERS[enemyData.monsterKey];
            if (baseMonster) {
                const newEnemy = {
                    ...baseMonster,
                    gridX: spawnX,
                    gridY: spawnY,
                    uniqueId: `${enemyData.monsterKey}_${index}`,
                    isDead: false,
                    textureKey: baseMonster.sprite, 
                    sprite: null 
                };
                this.enemies.push(newEnemy);
            }
        });

        this.spawnUnits(this.enemies, 9, false);
    }

    spawnUnits(units, startCol, isPlayer) {
        units.forEach((unit, index) => {
            if (unit.gridX === undefined) unit.gridX = startCol;
            if (unit.gridY === undefined) unit.gridY = 2 + index;
            
            unit.isPlayer = isPlayer;
            unit.isDead = false;
            if (!unit.stats) unit.stats = { hp: 10, maxHp: 10, str: 1, def: 0 };
            unit.currentHp = unit.stats.hp; 

            this.pathfinder.setObstacle(unit.gridX, unit.gridY, true);

            const pos = this.grid.getWorldPosition(unit.gridX, unit.gridY);
            let spriteKey = 'piso';
            if (isPlayer) {
                if (CLASSES[unit.classKey]) spriteKey = CLASSES[unit.classKey].sprite;
            } else {
                spriteKey = unit.textureKey || unit.sprite || 'piso';
            }
            if (!this.textures.exists(spriteKey)) spriteKey = 'piso';

            const sprite = this.add.image(pos.x, pos.y, spriteKey);
            if (sprite.width > 0) sprite.setScale((64 * 0.8) / sprite.height).setOrigin(0.5, 0.8);
            if (!isPlayer) sprite.setFlipX(true);
            
            unit.sprite = sprite;
            this.createLifeBar(unit);
        });
    }

    createLifeBar(unit) {
        if(unit.barBg) unit.barBg.destroy();
        if(unit.barFill) unit.barFill.destroy();
        const x = unit.sprite.x - 20; const y = unit.sprite.y - 70;
        unit.barBg = this.add.rectangle(x, y, 40, 6, 0x000000).setOrigin(0);
        unit.barFill = this.add.rectangle(x, y, 40, 6, 0x00ff00).setOrigin(0);
    }
    
    updateLifeBar(unit) {
        if (!unit.barFill || !unit.barFill.scene) return;
        const percent = Phaser.Math.Clamp(unit.currentHp / unit.stats.hp, 0, 1);
        this.tweens.add({ targets: unit.barFill, width: 40 * percent, duration: 200 });
        if (percent < 0.3) unit.barFill.setFillStyle(0xff0000);
    }

    spawnChests() {
        // Exemplo simples. Num jogo real, viria do MAPAS
        const chestData = { gridX: 6, gridY: 4, opened: false, loot: "Ouro" };
        this.createChestVisual(chestData);
        this.chests.push(chestData);
    }

    createChestVisual(chest) {
        const pos = this.grid.getWorldPosition(chest.gridX, chest.gridY);
        this.pathfinder.setObstacle(chest.gridX, chest.gridY, true);
        if (this.textures.exists('bau_fechado')) {
            chest.sprite = this.add.image(pos.x, pos.y, 'bau_fechado').setScale(0.8);
        } else {
            chest.sprite = this.add.rectangle(pos.x, pos.y, 40, 40, 0xf1c40f).setStrokeStyle(2, 0x000000);
        }
    }

    // =================================================================
    //  TURNOS (MARCADOR AZUL)
    // =================================================================

    handleTurnStart(unit) {
        if (this.battleEnded && !this.explorationMode) return; 

        this.isBusy = false; 
        this.selectedHero = null;
        this.grid.clearHighlights();
        unit.hasMoved = false;
        unit.hasAttacked = false;

        this.showTurnBanner(unit);
        this.highlightCurrentUnit(unit);

        if (unit.isPlayer) {
            this.time.delayedCall(100, () => this.events.emit('ui-enable-turn-button', true));
            this.events.emit('ui-update-stats', unit);
        } else {
            this.events.emit('ui-enable-turn-button', false);
            this.isBusy = true; 
            this.time.delayedCall(1500, () => this.enemyAI(unit));
        }
    }

    highlightCurrentUnit(unit) {
        // Limpa tints antigos
        this.party.concat(this.enemies).forEach(u => { if(u.sprite) u.sprite.clearTint(); });
        
        // Remove quadrado antigo
        if (this.turnMarker) {
            this.turnMarker.destroy();
            this.turnMarker = null;
        }

        // Desenha novo quadrado azul
        if (unit && unit.sprite && unit.sprite.scene) {
            const pos = this.grid.getWorldPosition(unit.gridX, unit.gridY);
            
            this.turnMarker = this.add.graphics();
            this.turnMarker.lineStyle(4, 0x3498db, 1); 
            this.turnMarker.strokeRect(pos.x - 32, pos.y - 32, 64, 64);
            this.turnMarker.setDepth(9); 
        }
    }

    // =================================================================
    //  INPUT
    // =================================================================

    handleTileClick(pointer) {
        if (this.isBusy) return;

        const { col, row, valid } = this.grid.update(pointer);
        if (!valid) return;

        const targetUnit = this.enemies.concat(this.party).find(u => u.gridX === col && u.gridY === row && !u.isDead);
        const targetChest = this.chests.find(c => c.gridX === col && c.gridY === row);

        if (this.explorationMode) {
            if (targetUnit && targetUnit.isPlayer) this.selectHero(targetUnit);
            else if (targetChest && this.selectedHero) {
                const dist = Math.abs(this.selectedHero.gridX - targetChest.gridX) + Math.abs(this.selectedHero.gridY - targetChest.gridY);
                if (dist <= 1) this.interactWithChest(this.selectedHero, targetChest);
                else this.moveAndInteract(this.selectedHero, targetChest.gridX, targetChest.gridY);
            }
            else if (this.selectedHero) this.tryMoveHero(col, row);
            return;
        }

        const currentUnit = this.turnSystem.currentUnit;
        if (!currentUnit || !currentUnit.isPlayer) return;

        if (targetUnit) {
            if (!targetUnit.isPlayer) this.tryAttack(currentUnit, targetUnit);
            else if (targetUnit === currentUnit) this.selectHero(currentUnit);
        } 
        else if (this.selectedHero && !currentUnit.hasMoved) {
            this.tryMoveHero(col, row);
        }
    }

    // =================================================================
    //  AÇÕES
    // =================================================================

    selectHero(hero) {
        if (!this.explorationMode && hero.hasMoved) return; 
        
        this.selectedHero = hero;
        this.grid.clearHighlights();
        
        const range = this.explorationMode ? 20 : (hero.mobility || 3);
        const reachable = this.pathfinder.getReachableTiles(hero.gridX, hero.gridY, range);
        
        reachable.forEach(t => this.grid.highlightTile(t.x, t.y, 0x00aaff));
        this.grid.highlightTile(hero.gridX, hero.gridY, 0x00ff00);
        this.events.emit('ui-update-stats', hero);

        if (!this.explorationMode) {
            this.highlightCurrentUnit(hero);
        }
    }

    tryMoveHero(col, row) {
        const hero = this.selectedHero;
        const path = this.pathfinder.findPath(hero.gridX, hero.gridY, col, row);
        if(path) this.moveHeroAlongPath(hero, path);
    }

    moveAndInteract(hero, tx, ty) {
        const path = this.pathfinder.findPath(hero.gridX, hero.gridY, tx, ty);
        if (path && path.length > 1) {
            path.pop();
            this.moveHeroAlongPath(hero, path, () => {
                 const chest = this.chests.find(c => c.gridX === tx && c.gridY === ty);
                 if (chest) this.interactWithChest(hero, chest);
            });
        }
    }

    moveHeroAlongPath(hero, path, callback) {
        this.isBusy = true;
        this.grid.clearHighlights();
        this.pathfinder.setObstacle(hero.gridX, hero.gridY, false);
        hero.hasMoved = true;
        
        // Esconde marcador enquanto anda
        if (this.turnMarker) this.turnMarker.setVisible(false);

        this.moveNextStep(hero, path, 0, callback);
    }

    moveNextStep(hero, path, index, callback) {
        if (index >= path.length) {
            this.isBusy = false;
            this.pathfinder.setObstacle(hero.gridX, hero.gridY, true);
            
            // Reexibe marcador se for o turno dele
            if (!this.explorationMode && hero === this.turnSystem.currentUnit) {
                this.highlightCurrentUnit(hero);
            }
            
            if (callback) callback();
            return;
        }

        const next = path[index];
        const pos = this.grid.getWorldPosition(next.x, next.y);
        
        if (next.x > hero.gridX) hero.sprite.setFlipX(false);
        else if (next.x < hero.gridX) hero.sprite.setFlipX(true);

        hero.gridX = next.x; 
        hero.gridY = next.y;

        this.tweens.add({
            targets: [hero.sprite, hero.barBg, hero.barFill],
            x: (target) => target === hero.sprite ? pos.x : pos.x - 20,
            y: (target) => target === hero.sprite ? pos.y : pos.y - 70,
            duration: 200, 
            onComplete: () => this.moveNextStep(hero, path, index + 1, callback)
        });
    }

    tryAttack(attacker, target) {
        if (this.explorationMode) return;
        if (attacker.hasAttacked || target.isDead) return;

        const dist = Math.abs(attacker.gridX - target.gridX) + Math.abs(attacker.gridY - target.gridY);
        if (dist <= (attacker.range || 1)) {
            this.executeAttack(attacker, target);
        }
    }

    executeAttack(attacker, target) {
        this.isBusy = true; 
        attacker.hasAttacked = true;
        this.grid.clearHighlights();

        const damage = Math.max(1, (attacker.stats.str || 5) - (target.stats.def || 2));
        target.currentHp -= damage;
        this.showDamageText(target.sprite.x, target.sprite.y, damage);
        this.updateLifeBar(target);

        this.tweens.add({
            targets: target.sprite,
            x: target.sprite.x + 4, yoyo: true, duration: 50, repeat: 3,
            onComplete: () => {
                this.isBusy = false;
                if (this.turnMarker) this.turnMarker.setVisible(true);
                
                if (target.currentHp <= 0) this.handleDeath(target);
                this.checkBattleEnd(); 
            }
        });
    }

    interactWithChest(hero, chest) {
        if (chest.opened) return;
        this.isBusy = true;
        chest.opened = true;
        chest.sprite.setAlpha(0.5);

        const pos = this.grid.getWorldPosition(chest.gridX, chest.gridY);
        const t = this.add.text(pos.x, pos.y - 30, `LOOT: ${chest.loot}`, {
            fontSize: '14px', backgroundColor: '#000', color: '#ffd700'
        }).setOrigin(0.5);

        this.tweens.add({ 
            targets: t, y: pos.y - 80, alpha: 0, duration: 1500, 
            onComplete: () => {
                t.destroy();
                this.isBusy = false;
            }
        });
    }

    handleDeath(unit) {
        unit.isDead = true;
        this.pathfinder.setObstacle(unit.gridX, unit.gridY, false);
        if (unit.barBg) unit.barBg.destroy();
        if (unit.barFill) unit.barFill.destroy();
        this.tweens.add({ targets: unit.sprite, angle: 90, alpha: 0.5, duration: 500 });
    }

    checkBattleEnd() {
        const enemiesAlive = this.enemies.filter(e => !e.isDead);
        if (enemiesAlive.length === 0) {
            this.startExplorationMode();
        } else {
            const currentUnit = this.turnSystem.currentUnit;
            if (!this.battleEnded && (!currentUnit.isPlayer || (currentUnit.hasMoved && currentUnit.hasAttacked))) {
                this.time.delayedCall(600, () => this.endPlayerTurn());
            }
        }
    }

    startExplorationMode() {
        this.battleEnded = true; 
        this.explorationMode = true;
        this.isBusy = true; // Bloqueia input durante a transição

        // Remove marcador de turno
        if (this.turnMarker) {
            this.turnMarker.destroy();
            this.turnMarker = null;
        }

        // TEXTO DE VITÓRIA
        const winText = this.add.text(this.scale.width/2, this.scale.height/2, 'VITÓRIA!', { 
            fontSize: '64px', fill: '#f1c40f', stroke: '#000', strokeThickness: 8 
        }).setOrigin(0.5).setDepth(5000);
        
        // Efeito de fade-out do texto
        this.tweens.add({ 
            targets: winText, 
            alpha: 0, 
            delay: 1500, 
            duration: 1000, 
            onComplete: () => {
                this.isBusy = false; // Libera o jogador para andar
            }
        });
        
        // --- IMPORTANTE: Dispara o evento para a UI mostrar o botão 'SAIR' ---
        this.events.emit('ui-show-exit'); 
        
        // Reseta status dos herois
        this.party.forEach(h => {
            if(!h.isDead) { 
                h.hasMoved = false; 
                h.hasAttacked = false; 
                if(h.sprite) h.sprite.clearTint(); 
            }
        });
        
        if(this.currentTween) this.currentTween.stop();
        this.grid.clearHighlights();
    }

    // --- FUNÇÃO CRUCIAL: Chamada pelo botão da UIScene ---
    finishLevel() {
        console.log("BattleScene: Finalizando fase...");
        
        // Desbloqueia próximos mapas
        const currentLoc = LOCATIONS[this.currentLocationId];
        if (currentLoc && currentLoc.connections) {
            currentLoc.connections.forEach(nextId => { 
                if (LOCATIONS[nextId]) LOCATIONS[nextId].unlocked = true; 
            });
        }
        
        // Troca de cena
        this.scene.stop('UIScene');
        this.scene.start('WorldMapScene');
    }

    endPlayerTurn() {
        if (this.battleEnded || this.isMoving) return;
        this.events.emit('ui-enable-turn-button', false);
        this.turnSystem.nextTurn();
    }

    enemyAI(enemy) {
        if (this.battleEnded || enemy.isDead) return;
        let target = this.party.filter(h => !h.isDead).sort((a,b) => (Math.abs(enemy.gridX - a.gridX) + Math.abs(enemy.gridY - a.gridY)) - (Math.abs(enemy.gridX - b.gridX) + Math.abs(enemy.gridY - b.gridY)))[0];
        
        if (!target) return this.endPlayerTurn();

        const dist = Math.abs(enemy.gridX - target.gridX) + Math.abs(enemy.gridY - target.gridY);
        
        if (dist <= (enemy.range || 1)) {
            this.executeAttack(enemy, target);
        } else {
            const vizinhos = [{x:target.gridX, y:target.gridY-1}, {x:target.gridX, y:target.gridY+1}, {x:target.gridX-1, y:target.gridY}, {x:target.gridX+1, y:target.gridY}];
            const dV = vizinhos.filter(v => this.pathfinder.isValid(v.x, v.y) && !this.pathfinder.isBlocked(v.x, v.y));
            if (dV.length > 0) {
                const path = this.pathfinder.findPath(enemy.gridX, enemy.gridY, dV[0].x, dV[0].y);
                if (path) {
                    this.moveHeroAlongPath(enemy, path.slice(0, enemy.mobility || 3), () => {
                        if (this.battleEnded) return;
                        const newDist = Math.abs(enemy.gridX - target.gridX) + Math.abs(enemy.gridY - target.gridY);
                        if (newDist <= (enemy.range || 1)) this.executeAttack(enemy, target);
                        else this.endPlayerTurn();
                    });
                } else { this.endPlayerTurn(); }
            } else { this.endPlayerTurn(); }
        }
    }
    
    showTurnBanner(unit) {
        if (this.explorationMode) return;
        const banner = this.add.text(this.scale.width/2, 150, `VEZ DE: ${unit.name.toUpperCase()}`, {fontSize:'32px', fontStyle:'bold', fill:'#3498db', stroke:'#000', strokeThickness:6}).setOrigin(0.5).setDepth(1000);
        this.tweens.add({targets:banner, y:100, alpha:0, duration:1500, onComplete:()=>banner.destroy()});
    }
    showDamageText(x, y, amount) {
        const t = this.add.text(x, y-40, `-${amount}`, {fontSize:'28px', fill:'#f00', stroke:'#000', strokeThickness:4}).setDepth(2000);
        this.tweens.add({targets:t, y:y-100, alpha:0, duration:1000, onComplete:()=>t.destroy()});
    }
}