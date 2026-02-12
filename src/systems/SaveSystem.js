/**
 * ARQUIVO: src/systems/SaveSystem.js
 * DESCRIÇÃO: Sistema híbrido de salvamento (Local Storage + Arquivo JSON).
 */

export class SaveSystem {
    constructor(scene) {
        this.scene = scene;
        this.SAVE_KEY = 'my_rpg_save_data_v1'; // Chave única para não misturar com outros sites
    }

    /**
     * Helper: Reúne os dados atuais do jogo em um objeto
     */
    getGameData() {
        return {
            version: '0.1',
            timestamp: new Date().toISOString(),
            party: this.scene.registry.get('party') || [],
            // Futuramente: inventory, gold, currentMap, playerPosition
        };
    }

    /**
     * Helper: Aplica os dados carregados ao jogo
     */
    applyGameData(data) {
        if (data.party) {
            this.scene.registry.set('party', data.party);
        }
        console.log("Dados aplicados com sucesso:", data);
    }

    // --- MÉTODOS LOCAL STORAGE (Rápido) ---

    saveToLocal() {
        try {
            const data = this.getGameData();
            const json = JSON.stringify(data);
            localStorage.setItem(this.SAVE_KEY, json);
            console.log("Jogo salvo localmente!");
            return true;
        } catch (e) {
            console.error("Erro ao salvar localmente (Quota excedida?):", e);
            return false;
        }
    }

    loadFromLocal() {
        const json = localStorage.getItem(this.SAVE_KEY);
        if (!json) return null;

        const data = JSON.parse(json);
        this.applyGameData(data);
        return data;
    }

    hasLocalSave() {
        return localStorage.getItem(this.SAVE_KEY) !== null;
    }

    // --- MÉTODOS DE ARQUIVO (Backup/Transferência) ---

    exportSaveGame(filename = 'save_rpg.json') {
        const data = this.getGameData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importSaveGame(onLoadComplete) {
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
                    this.applyGameData(data);
                    if (onLoadComplete) onLoadComplete(data);
                } catch (error) {
                    console.error("Save inválido:", error);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
}