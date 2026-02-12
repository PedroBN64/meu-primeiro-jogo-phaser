/**
 * ARQUIVO: src/systems/TurnSystem.js
 * DESCRIÇÃO: Gerencia a ordem dos turnos. 
 * ATUALIZAÇÃO: Adicionado método destroy() para limpeza de memória.
 */

export class TurnSystem {
    constructor(scene) {
        this.scene = scene;
        this.units = [];       
        this.currentUnit = null;
        this.roundCount = 0;
        this.turnIndex = 0;
    }

    addUnits(heroes, monsters) {
        heroes.forEach(h => { h.isPlayer = true; h.isDead = false; });
        monsters.forEach(m => { m.isPlayer = false; m.isDead = false; });

        this.units = [...heroes, ...monsters];
        
        // Ordena por Velocidade (Maior SPD primeiro)
        this.units.sort((a, b) => (b.stats.spd || 0) - (a.stats.spd || 0));

        console.log("Ordem do Turno:", this.units.map(u => `${u.name} (SPD: ${u.stats.spd})`));
    }

    startCombat() {
        this.roundCount = 1;
        this.turnIndex = 0;
        this.nextTurn();
    }

    nextTurn() {
        // --- TRAVA DE SEGURANÇA ---
        // Se o sistema foi destruído ou a cena morreu, para tudo.
        if (!this.scene || !this.scene.sys || !this.scene.sys.settings.active) {
            return;
        }
        // --------------------------

        // Verifica se sobrou alguém vivo antes de continuar
        const anyoneAlive = this.units.some(u => !u.isDead);
        if (!anyoneAlive) return;

        // Se a lista acabou, reinicia (Novo Round)
        if (this.turnIndex >= this.units.length) {
            this.turnIndex = 0;
            this.roundCount++;
            console.log(`--- ROUND ${this.roundCount} INICIADO ---`);
        }

        // Pega a unidade atual
        this.currentUnit = this.units[this.turnIndex];

        // Se não houver unidade (erro de índice), reseta
        if (!this.currentUnit) {
            this.turnIndex = 0;
            this.currentUnit = this.units[0];
        }

        // Se a unidade estiver morta, pula ela recursivamente
        if (this.currentUnit.isDead) {
            this.turnIndex++;
            // Pequeno delay para evitar stack overflow se muitos morrerem
            if (this.scene && this.scene.time) {
                this.scene.time.delayedCall(10, () => this.nextTurn());
            } else {
                this.nextTurn();
            }
            return;
        }

        console.log(`VEZ DE: ${this.currentUnit.name}`);

        // Avisa a Cena quem é o dono do turno
        if (this.scene.events) {
            this.scene.events.emit('turn-start', this.currentUnit);
        }

        // Prepara o índice para o próximo
        this.turnIndex++;
    }

    // --- NOVO MÉTODO: DESTROY (Essencial para trocar de mapa sem erro) ---
    destroy() {
        this.scene = null; // Remove a referência da cena morta
        this.units = [];
        this.currentUnit = null;
    }
}