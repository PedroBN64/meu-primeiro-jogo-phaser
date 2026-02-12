/**
 * ARQUIVO: src/systems/MercenarySystem.js
 * DESCRIÇÃO: Permite exportar um herói único e importar no jogo de um amigo.
 */

import { PartyManager } from './PartyManager.js';

export class MercenarySystem {
    constructor(scene) {
        this.scene = scene;
        this.partyManager = new PartyManager(scene);
    }

    /**
     * Exporta APENAS o herói selecionado para um arquivo JSON
     */
    exportCharacter(heroData) {
        if (!heroData) return;

        // Cria um pacote seguro (sem dados de posição do grid, pois isso muda)
        const mercenaryData = {
            type: 'mercenary_card_v1', // Identificador para não confundir com Save Game
            name: heroData.name,
            classKey: heroData.classKey,
            level: heroData.level,
            stats: heroData.stats,
            equipment: heroData.equipment,
            growth: heroData.growth,
            mobility: heroData.mobility,
            range: heroData.range,
            // Não exportamos currentHp (ele chega descansado)
            exportedAt: new Date().toISOString()
        };

        const fileName = `${heroData.name.replace(/\s+/g, '_')}_lv${heroData.level}.json`;
        
        // Técnica do Blob (igual ao SaveSystem)
        const blob = new Blob([JSON.stringify(mercenaryData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log(`Mercenário ${heroData.name} exportado!`);
    }

    /**
     * Abre janela para importar um herói
     * @param {Function} onSuccess - Callback quando terminar
     */
    importMercenary(onSuccess) {
        // Verifica se a party já está cheia
        if (this.partyManager.members.length >= 4) {
            alert("Sua party está cheia (Máx: 4)! Demita alguém antes.");
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    // Validação simples
                    if (data.type !== 'mercenary_card_v1') {
                        alert("Este arquivo não é um Card de Mercenário válido!");
                        return;
                    }

                    // Prepara o herói para entrar no jogo (restaura HP/MP)
                    const newHero = {
                        ...data,
                        currentHp: data.stats.hp,
                        currentMp: data.stats.mp,
                        exp: 0,
                        uniqueId: Date.now().toString() // Novo ID para evitar conflito
                    };

                    // Adiciona à party usando o Manager
                    this.partyManager.addMember(newHero);
                    
                    alert(`${newHero.name} foi recrutado com sucesso!`);
                    
                    if (onSuccess) onSuccess(newHero);

                } catch (error) {
                    console.error("Erro ao importar:", error);
                    alert("Arquivo corrompido.");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
}