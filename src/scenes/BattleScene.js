/**
 * ARQUIVO: src/scenes/BattleScene.js
 * DESCRIÇÃO: Cena Principal de Combate.
 * CORREÇÃO: Blindagem contra erros de transição (sys/size) e limpeza de memória.
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
        this.currentLocationId = data.locationId || 'VILA_INICIAL';
        const locationConfig = LOCATIONS[this.currentLocationId];
        this.currentMapId = (locationConfig && locationConfig.config) ? locationConfig.config.mapId : 'vila_map';
        
        // Flags de controle de estado
        this.isTransitioning = false; // Bloqueia tudo na troca de mapa
        this.isBusy = false;          // Bloqueia cliques durante animações
        this.battleEnded = false; 
        this.explorationMode = false;
    }

    preload() {
        // Fallbacks essenciais
        this.load.image('piso', 'assets/piso.png');
        this.load.image('heroi_placeholder', 'assets/piso.png'); 
        this.load.image('bau_fechado', 'assets/bau.png'); 

        // Carregamento dinâmico baseado nos dados
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
        // 1. LIMPEZA DE EVENTOS ANTIGOS (Prevenção de ataques duplos)
        this.input.off('pointerdown');
        this.events.off('ui-end-turn'); 
        this.events.off('ui-show-exit');
        this.events.off('turn-start');

        // 2. INICIALIZAÇÃO DE SISTEMAS
        this.grid = new GridSystem(this, 12, 8, 64);
        this.grid.createMap();
        this.pathfinder = new PathfindingSystem(12, 8);
        this.turnSystem = new TurnSystem(this);
        this.turnMarker = null; // Quadrado azul de seleção
        this.chests = []; 

        // 3. CONFIGURAÇÃO DE GRUPO E SPAWN
        this.party = this.registry.get('party') || [];
        this.resetPartyData(); 

        this.spawnUnits(this.party, 1, true); 
        this.loadMapEnemies(); 
        this.spawnChests(); 

        // 4. INTERFACE E EVENTOS DE CENA
        this.scene.launch('UIScene');
        
        this.events.on('ui-end-turn', () => this.endPlayerTurn());
        this.events.on('turn-start', (unit) => this.handleTurnStart(unit));
        this.input.on('pointerdown', (pointer) => this.handleTileClick(pointer));

        // 5. INÍCIO DO CICLO DE JOGO
        this.turnSystem.addUnits(this.party, this.enemies);
        this.turnSystem.startCombat();

        // 6. PROTOCOLO DE FECHAMENTO (Shutdown)
        this.events.once('shutdown', () => this.handleShutdown());
    }

    update() {
        // Guarda de Vida: Se a cena está fechando ou morreu, pare o update imediatamente
        if (this.isTransitioning || !this.sys || !this.sys.settings.active) return;

        if (this.grid && this.input.activePointer && !this.isBusy) {
            this.grid.update(this.input.activePointer);
        }
    }

    /**
     * Limpa a memória e para processos ao sair da cena
     */
    handleShutdown() {
        console.log("BattleScene: Limpando processos zumbis...");
        this.time.removeAllEvents();
        this.tweens.killAll();

        if (this.grid) this.grid.destroy();
        if (this.turnSystem) this.turnSystem.destroy();
        if (this.turnMarker) this.turnMarker.destroy();
        
        // Fecha a UI de forma segura
        if (this.scene.isActive('UIScene')) {
            this.scene.stop('UIScene');
        }
    }

    /**
     * Finaliza a fase e volta para o Mapa Mundi
     */
    finishLevel() {
        if (this.isTransitioning) return;
        this.isTransitioning = true; // Trava lógica de update e IA
        this.input.enabled = false;  // Trava cliques do mouse

        console.log("BattleScene: Salvando e trocando de cena...");

        // Desbloqueia conexões no mapa
        const currentLoc = LOCATIONS[this.currentLocationId];
        if (currentLoc && currentLoc.connections) {
            currentLoc.connections.forEach(nextId => { 
                if (LOCATIONS[nextId]) LOCATIONS[nextId].unlocked = true; 
            });
        }
        
        // Pequeno atraso de 1 frame para garantir que o Phaser termine de processar o clique
        this.time.delayedCall(1, () => {
            this.scene.start('WorldMapScene');
        });
    }

    // =================================================================
    //  LOGICA DE SPAWN E DADOS
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
        if (!mapData) return;

        mapData.inimigos.forEach((enemyData, index) => {
            let sx = enemyData.x, sy = enemyData.y;
            let occupied = true, attempts = 0;

            while (occupied && attempts < 10) {
                const clash = this.party.some(h => h.gridX === sx && h.gridY === sy) || 
                              this.enemies.some(e => e.gridX === sx && e.gridY === sy);
                if (clash) { sx++; if (sx > 11) { sx = 5; sy++; } } 
                else { occupied = false; }
                attempts++;
            }

            const base = MONSTERS[enemyData.monsterKey];
            if (base) {
                this.enemies.push({
                    ...base, gridX: sx, gridY: sy,
                    uniqueId: `${enemyData.monsterKey}_${index}`,
                    isDead: false, textureKey: base.sprite, sprite: null 
                });
            }
        });
        this.spawnUnits(this.enemies, 9, false);
    }

    spawnUnits(units, startCol, isPlayer) {
        units.forEach((unit, index) => {
            unit.gridX = unit.gridX ?? startCol;
            unit.gridY = unit.gridY ?? (2 + index);
            unit.isPlayer = isPlayer;
            unit.isDead = false;
            if (!unit.stats) unit.stats = { hp: 10, maxHp: 10, str: 1, def: 0 };
            unit.currentHp = unit.stats.hp; 

            this.pathfinder.setObstacle(unit.gridX, unit.gridY, true);
            const pos = this.grid.getWorldPosition(unit.gridX, unit.gridY);
            
            let sk = isPlayer ? (CLASSES[unit.classKey]?.sprite || 'piso') : (unit.textureKey || 'piso');
            if (!this.textures.exists(sk)) sk = 'piso';

            const sprite = this.add.image(pos.x, pos.y, sk);
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
        if (this.isTransitioning || !this.sys || !unit.barFill?.scene) return;
        const pct = Phaser.Math.Clamp(unit.currentHp / unit.stats.hp, 0, 1);
        this.tweens.add({ targets: unit.barFill, width: 40 * pct, duration: 200 });
        if (pct < 0.3) unit.barFill.setFillStyle(0xff0000);
    }

    spawnChests() {
        const chestData = { gridX: 6, gridY: 4, opened: false, loot: "Ouro" };
        const pos = this.grid.getWorldPosition(chestData.gridX, chestData.gridY);
        this.pathfinder.setObstacle(chestData.gridX, chestData.gridY, true);
        if (this.textures.exists('bau_fechado')) {
            chestData.sprite = this.add.image(pos.x, pos.y, 'bau_fechado').setScale(0.8);
        } else {
            chestData.sprite = this.add.rectangle(pos.x, pos.y, 40, 40, 0xf1c40f).setStrokeStyle(2, 0x000000);
        }
        this.chests.push(chestData);
    }

    // =================================================================
    //  SISTEMA DE TURNOS E HIGHLIGHT
    // =================================================================

    handleTurnStart(unit) {
        if (this.isTransitioning || (this.battleEnded && !this.explorationMode)) return; 

        this.isBusy = false; 
        this.grid.clearHighlights();
        unit.hasMoved = false;
        unit.hasAttacked = false;

        this.showTurnBanner(unit);
        this.highlightCurrentUnit(unit);

        if (unit.isPlayer) {
            this.time.delayedCall(100, () => {
                if(!this.isTransitioning && this.sys) this.events.emit('ui-enable-turn-button', true);
            });
            this.events.emit('ui-update-stats', unit);
        } else {
            this.events.emit('ui-enable-turn-button', false);
            this.isBusy = true; 
            this.time.delayedCall(1500, () => {
                if(!this.isTransitioning && this.sys) this.enemyAI(unit);
            });
        }
    }

    highlightCurrentUnit(unit) {
        if (this.isTransitioning || !this.sys) return;
        this.party.concat(this.enemies).forEach(u => u.sprite?.clearTint());
        
        if (this.turnMarker) this.turnMarker.destroy();

        if (unit?.sprite?.scene) {
            const pos = this.grid.getWorldPosition(unit.gridX, unit.gridY);
            this.turnMarker = this.add.graphics().lineStyle(4, 0x3498db, 1);
            this.turnMarker.strokeRect(pos.x - 32, pos.y - 32, 64, 64).setDepth(9); 
        }
    }

    // =================================================================
    //  INPUT E AÇÕES DE COMBATE
    // =================================================================

    handleTileClick(pointer) {
        if (this.isTransitioning || this.isBusy) return;

        const { col, row, valid } = this.grid.update(pointer);
        if (!valid) return;

        const targetUnit = this.enemies.concat(this.party).find(u => u.gridX === col && u.gridY === row && !u.isDead);
        const targetChest = this.chests.find(c => c.gridX === col && c.gridY === row);

        if (this.explorationMode) {
            if (targetUnit?.isPlayer) this.selectHero(targetUnit);
            else if (targetChest && this.selectedHero) {
                const dist = Math.abs(this.selectedHero.gridX - targetChest.gridX) + Math.abs(this.selectedHero.gridY - targetChest.gridY);
                if (dist <= 1) this.interactWithChest(this.selectedHero, targetChest);
                else this.moveAndInteract(this.selectedHero, targetChest.gridX, targetChest.gridY);
            }
            else if (this.selectedHero) this.tryMoveHero(col, row);
            return;
        }

        const currentUnit = this.turnSystem.currentUnit;
        if (!currentUnit?.isPlayer) return;

        if (targetUnit) {
            if (!targetUnit.isPlayer) this.tryAttack(currentUnit, targetUnit);
            else if (targetUnit === currentUnit) this.selectHero(currentUnit);
        } else if (this.selectedHero && !currentUnit.hasMoved) {
            this.tryMoveHero(col, row);
        }
    }

    selectHero(hero) {
        if (this.isTransitioning || (!this.explorationMode && hero.hasMoved)) return; 
        this.selectedHero = hero;
        this.grid.clearHighlights();
        const range = this.explorationMode ? 20 : (hero.mobility || 3);
        this.pathfinder.getReachableTiles(hero.gridX, hero.gridY, range).forEach(t => this.grid.highlightTile(t.x, t.y, 0x00aaff));
        this.grid.highlightTile(hero.gridX, hero.gridY, 0x00ff00);
        this.events.emit('ui-update-stats', hero);
        if (!this.explorationMode) this.highlightCurrentUnit(hero);
    }

    tryMoveHero(col, row) {
        const path = this.pathfinder.findPath(this.selectedHero.gridX, this.selectedHero.gridY, col, row);
        if(path) this.moveHeroAlongPath(this.selectedHero, path);
    }

    moveAndInteract(hero, tx, ty) {
        const path = this.pathfinder.findPath(hero.gridX, hero.gridY, tx, ty);
        if (path?.length > 1) { 
            path.pop(); 
            this.moveHeroAlongPath(hero, path, () => {
                const c = this.chests.find(ch => ch.gridX === tx && ch.gridY === ty);
                if (c) this.interactWithChest(hero, c);
            }); 
        }
    }

    moveHeroAlongPath(hero, path, cb) {
        this.isBusy = true; 
        this.grid.clearHighlights();
        this.pathfinder.setObstacle(hero.gridX, hero.gridY, false);
        hero.hasMoved = true; 
        if (this.turnMarker) this.turnMarker.setVisible(false);
        this.moveNextStep(hero, path, 0, cb);
    }

    moveNextStep(hero, path, idx, cb) {
        if (this.isTransitioning || !this.sys) return;
        if (idx >= path.length) {
            this.isBusy = false;
            this.pathfinder.setObstacle(hero.gridX, hero.gridY, true);
            if (!this.explorationMode && hero === this.turnSystem.currentUnit) this.highlightCurrentUnit(hero);
            if (cb) cb(); return;
        }

        const next = path[idx]; 
        const pos = this.grid.getWorldPosition(next.x, next.y);
        hero.sprite.setFlipX(next.x < hero.gridX);
        hero.gridX = next.x; hero.gridY = next.y;

        this.tweens.add({
            targets: [hero.sprite, hero.barBg, hero.barFill],
            x: (t) => t === hero.sprite ? pos.x : pos.x - 20,
            y: (t) => t === hero.sprite ? pos.y : pos.y - 70,
            duration: 200, 
            onComplete: () => { if (this.sys && !this.isTransitioning) this.moveNextStep(hero, path, idx + 1, cb); }
        });
    }

    tryAttack(attacker, target) {
        if (this.explorationMode || attacker.hasAttacked || target.isDead) return;
        const dist = Math.abs(attacker.gridX - target.gridX) + Math.abs(attacker.gridY - target.gridY);
        if (dist <= (attacker.range || 1)) this.executeAttack(attacker, target);
    }

    executeAttack(atkr, tgt) {
        this.isBusy = true; 
        atkr.hasAttacked = true; 
        this.grid.clearHighlights();
        const dmg = Math.max(1, (atkr.stats.str || 5) - (tgt.stats.def || 2));
        tgt.currentHp -= dmg; 
        this.showDamageText(tgt.sprite.x, tgt.sprite.y, dmg); 
        this.updateLifeBar(tgt);

        this.tweens.add({
            targets: tgt.sprite, x: tgt.sprite.x + 4, yoyo: true, duration: 50, repeat: 3,
            onComplete: () => { 
                if (this.isTransitioning || !this.sys) return; 
                this.isBusy = false; 
                if (this.turnMarker) this.turnMarker.setVisible(true); 
                if (tgt.currentHp <= 0) this.handleDeath(tgt); 
                this.checkBattleEnd(); 
            }
        });
    }

    interactWithChest(hero, chest) {
        if (chest.opened) return;
        this.isBusy = true; chest.opened = true; chest.sprite.setAlpha(0.5);
        const pos = this.grid.getWorldPosition(chest.gridX, chest.gridY);
        const t = this.add.text(pos.x, pos.y - 30, `LOOT: ${chest.loot}`, { fontSize: '14px', backgroundColor: '#000', color: '#ffd700' }).setOrigin(0.5);
        this.tweens.add({ 
            targets: t, y: pos.y - 80, alpha: 0, duration: 1500, 
            onComplete: () => { if (this.sys) { t.destroy(); this.isBusy = false; } } 
        });
    }

    handleDeath(u) {
        u.isDead = true; 
        this.pathfinder.setObstacle(u.gridX, u.gridY, false);
        if (u.barBg) u.barBg.destroy();
        if (u.barFill) u.barFill.destroy();
        this.tweens.add({ targets: u.sprite, angle: 90, alpha: 0.5, duration: 500 });
    }

    // =================================================================
    //  FINALIZAÇÃO E IA
    // =================================================================

    checkBattleEnd() {
        if (this.isTransitioning) return;
        if (this.enemies.every(e => e.isDead)) {
            this.startExplorationMode();
        } else {
            const curr = this.turnSystem.currentUnit;
            if (!this.battleEnded && (!curr.isPlayer || (curr.hasMoved && curr.hasAttacked))) {
                this.time.delayedCall(600, () => { if (!this.isTransitioning && this.sys) this.endPlayerTurn(); });
            }
        }
    }

    startExplorationMode() {
        if (this.isTransitioning) return;
        this.battleEnded = true; 
        this.explorationMode = true;
        this.isBusy = true;

        if (this.turnMarker) this.turnMarker.destroy();
        const win = this.add.text(this.scale.width/2, this.scale.height/2, 'VITÓRIA!', { fontSize: '64px', fill: '#f1c40f', stroke: '#000', strokeThickness: 8 }).setOrigin(0.5).setDepth(5000);
        
        this.tweens.add({ 
            targets: win, alpha: 0, delay: 1500, duration: 1000, 
            onComplete: () => { if (!this.isTransitioning && this.sys) this.isBusy = false; } 
        });
        
        this.events.emit('ui-show-exit'); 
        this.party.forEach(h => { if(!h.isDead) { h.hasMoved = false; h.hasAttacked = false; h.sprite?.clearTint(); } });
        this.grid.clearHighlights();
    }

    endPlayerTurn() {
        if (this.battleEnded || this.isMoving || this.isTransitioning) return;
        this.events.emit('ui-enable-turn-button', false);
        this.turnSystem.nextTurn();
    }

    enemyAI(enemy) {
        if (this.battleEnded || enemy.isDead || this.isTransitioning) return;
        let tgt = this.party.filter(h => !h.isDead).sort((a,b) => (Math.abs(enemy.gridX - a.gridX) + Math.abs(enemy.gridY - a.gridY)) - (Math.abs(enemy.gridX - b.gridX) + Math.abs(enemy.gridY - b.gridY)))[0];
        if (!tgt) return this.endPlayerTurn();

        const dist = Math.abs(enemy.gridX - tgt.gridX) + Math.abs(enemy.gridY - tgt.gridY);
        if (dist <= (enemy.range || 1)) {
            this.executeAttack(enemy, tgt);
        } else {
            const v = [{x:tgt.gridX, y:tgt.gridY-1}, {x:tgt.gridX, y:tgt.gridY+1}, {x:tgt.gridX-1, y:tgt.gridY}, {x:tgt.gridX+1, y:tgt.gridY}]
                      .filter(vi => this.pathfinder.isValid(vi.x, vi.y) && !this.pathfinder.isBlocked(vi.x, vi.y));
            if (v.length > 0) {
                const path = this.pathfinder.findPath(enemy.gridX, enemy.gridY, v[0].x, v[0].y);
                if (path) {
                    this.moveHeroAlongPath(enemy, path.slice(0, enemy.mobility || 3), () => {
                        if (this.battleEnded || this.isTransitioning) return;
                        if (Math.abs(enemy.gridX - tgt.gridX) + Math.abs(enemy.gridY - tgt.gridY) <= (enemy.range || 1)) this.executeAttack(enemy, tgt);
                        else this.endPlayerTurn();
                    });
                } else this.endPlayerTurn();
            } else this.endPlayerTurn();
        }
    }
    
    showTurnBanner(u) {
        if (this.explorationMode || this.isTransitioning) return;
        const b = this.add.text(this.scale.width/2, 150, `VEZ DE: ${u.name.toUpperCase()}`, {fontSize:'32px', fontStyle:'bold', fill:'#3498db', stroke:'#000', strokeThickness:6}).setOrigin(0.5).setDepth(1000);
        this.tweens.add({ targets:b, y:100, alpha:0, duration:1500, onComplete:()=>{ if(this.sys) b.destroy() } });
    }

    showDamageText(x, y, amt) {
        const t = this.add.text(x, y-40, `-${amt}`, {fontSize:'28px', fill:'#f00', stroke:'#000', strokeThickness:4}).setDepth(2000);
        this.tweens.add({ targets:t, y:y-100, alpha:0, duration:1000, onComplete:()=>{ if(this.sys) t.destroy() } });
    }
}