/**
 * ARQUIVO: src/systems/PartyManager.js
 * DESCRIÇÃO: Gerencia o grupo de heróis, contratações, mortes e seleção atual.
 * PADRÃO: Singleton (ou Classe Estática) para fácil acesso global.
 */

export class PartyManager {
    constructor(scene) {
        this.scene = scene;
        // Tenta recuperar dados salvos, ou cria uma lista vazia
        this.members = this.scene.registry.get('party') || [];
        this.maxMembers = 4; // Limite de tamanho da party (comum em TRPGs)
        this.selectedIndex = 0; // Quem está selecionado agora?
    }

    /**
     * Adiciona um novo personagem ao grupo
     * @param {Object} characterData - Dados vindos do classes.js ou gerados
     */
    addMember(characterData) {
        if (this.members.length >= this.maxMembers) {
            console.warn("A Party está cheia!");
            return false;
        }

        // Criamos um ID único para cada membro (essencial para diferenciar 2 guerreiros iguais)
        const uniqueId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        
        const newMember = {
            ...characterData,
            uniqueId: uniqueId,
            isLeader: this.members.length === 0 // O primeiro é o líder
        };

        this.members.push(newMember);
        this.saveToRegistry();
        console.log(`[PartyManager] ${newMember.name} entrou para o grupo.`);
        return true;
    }

    /**
     * Remove um membro (morte ou demissão)
     */
    removeMember(uniqueId) {
        this.members = this.members.filter(m => m.uniqueId !== uniqueId);
        this.saveToRegistry();
    }

    /**
     * Retorna o membro atualmente selecionado (para exibir na UI)
     */
    getSelectedMember() {
        return this.members[this.selectedIndex];
    }

    /**
     * Seleciona um membro específico pelo índice ou ID
     */
    selectMemberByIndex(index) {
        if (index >= 0 && index < this.members.length) {
            this.selectedIndex = index;
            // Aqui futuramente emitiremos um evento para a UI atualizar
            // this.scene.events.emit('ui-update-stats', this.getSelectedMember());
            return this.getSelectedMember();
        }
    }

    getAllMembers() {
        return this.members;
    }

    /**
     * Salva o estado atual na memória global do Phaser
     */
    saveToRegistry() {
        this.scene.registry.set('party', this.members);
    }
}