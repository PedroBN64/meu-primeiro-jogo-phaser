/**
 * ARQUIVO: src/systems/TurnSystem.js
 * DESCRIÇÃO: Gerencia a ordem dos turnos baseada na Velocidade (SPD).
 */

export class TurnSystem {
    constructor(scene) {
        this.scene = scene;
        this.units = [];       // Todos os combatentes
        this.currentUnit = null;
        this.roundCount = 0;
        this.turnIndex = 0;
    }

    /**
     * Adiciona combatentes à batalha
     */
    addUnits(heroes, monsters) {
        // Marca herois como 'isPlayer = true' e monstros como 'false'
        heroes.forEach(h => { h.isPlayer = true; h.isDead = false; });
        monsters.forEach(m => { m.isPlayer = false; m.isDead = false; });

        this.units = [...heroes, ...monsters];
        
        // ORDENAÇÃO POR VELOCIDADE (Iniciativa)
        // Quem tem mais SPD vem primeiro.
        this.units.sort((a, b) => b.stats.spd - a.stats.spd);

        console.log("Ordem do Turno:", this.units.map(u => `${u.name} (SPD: ${u.stats.spd})`));
    }

    /**
     * Inicia o combate
     */
    startCombat() {
        this.roundCount = 1;
        this.turnIndex = 0;
        this.nextTurn();
    }

    /**
     * Passa para o próximo personagem da fila
     */
    nextTurn() {
        // Se a lista acabou, reinicia (Novo Round)
        if (this.turnIndex >= this.units.length) {
            this.turnIndex = 0;
            this.roundCount++;
            console.log(`--- ROUND ${this.roundCount} INICIADO ---`);
        }

        // Pega a unidade atual
        this.currentUnit = this.units[this.turnIndex];

        // Se a unidade estiver morta, pula ela recursivamente
        if (this.currentUnit.isDead) {
            this.turnIndex++;
            this.nextTurn();
            return;
        }

        console.log(`VEZ DE: ${this.currentUnit.name}`);

        // Avisa a Cena quem é o dono do turno
        this.scene.events.emit('turn-start', this.currentUnit);

        // Prepara o índice para o próximo
        this.turnIndex++;
    }
}