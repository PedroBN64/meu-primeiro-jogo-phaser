/**
 * ARQUIVO: src/scenes/CharacterScene.js
 * DESCRIÇÃO: Criação de Personagem.
 * CORREÇÃO: Tamanho do sprite ajustado e integração com PartyManager.
 */

import { CLASSES } from '../data/classes.js';
import { Button } from '../components/Button.js';
import { PartyManager } from '../systems/PartyManager.js';

export class CharacterScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterScene' });
    }

    preload() {
        // Carregamento Automático de Sprites das Classes
        Object.keys(CLASSES).forEach(key => {
            const classe = CLASSES[key];
            // Remove o prefixo 'img_' para achar o arquivo (ex: 'img_guerreiro' -> 'guerreiro.png')
            const nomeArquivo = classe.sprite.replace('img_', '') + '.png';
            this.load.image(classe.sprite, `assets/${nomeArquivo}`);
        });
    }

    create() {
        const { width, height } = this.scale;
        
        // Inicializa com Guerreiro
        this.selectedClassKey = 'GUERREIRO'; 
        this.heroName = "Herói"; 

        // Fundo
        this.add.rectangle(0, 0, width, height, 0x2c3e50).setOrigin(0);

        // TÍTULO
        this.add.text(width / 2, 50, 'ESCOLHA SUA CLASSE', {
            fontSize: '32px', fontStyle: 'bold', fill: '#f1c40f'
        }).setOrigin(0.5);

        // --- ÁREA ESQUERDA: BOTÕES DE CLASSE ---
        let yPos = 120;
        Object.keys(CLASSES).forEach(key => {
            const classe = CLASSES[key];
            
            // Botão de seleção
            new Button(this, 150, yPos, classe.name, () => {
                this.updateSelection(key);
            }, { width: 180, height: 40, fontSize: '18px', bgColor: 0x34495e });
            
            yPos += 55;
        });

        // --- ÁREA CENTRAL: PREVIEW ---
        // Moldura
        this.add.rectangle(width / 2, height / 2 - 20, 200, 200, 0x000000, 0.5).setStrokeStyle(2, 0xbdc3c7);
        
        // Sprite do Personagem
        this.heroSprite = this.add.image(width / 2, height / 2 - 40, CLASSES.GUERREIRO.sprite);
        
        // --- CORREÇÃO DO ZOOM ---
        // Reduzido de 6 para 3. Se ainda ficar grande, tente 2.
        this.heroSprite.setScale(3); 
        this.heroSprite.texture.setFilter(Phaser.Textures.FilterMode.NEAREST); // Pixel art nítido

        // --- NOME DO PERSONAGEM ---
        this.nameLabel = this.add.text(width / 2, height / 2 + 100, `Nome: ${this.heroName}`, {
            fontSize: '24px', fill: '#fff'
        }).setOrigin(0.5);

        new Button(this, width / 2, height / 2 + 140, 'ALTERAR NOME', () => {
            // Usa prompt nativo para evitar erro de DOM
            const novoNome = prompt("Digite o nome do seu herói:", this.heroName);
            if (novoNome && novoNome.trim() !== "") {
                this.heroName = novoNome.trim();
                this.nameLabel.setText(`Nome: ${this.heroName}`);
            }
        }, { width: 160, height: 30, fontSize: '12px', bgColor: 0x7f8c8d });


        // --- ÁREA DIREITA: INFO ---
        this.descText = this.add.text(width - 250, 150, '', {
            fontSize: '14px', fill: '#bdc3c7', wordWrap: { width: 200 }, align: 'center'
        }).setOrigin(0.5, 0);

        this.statsText = this.add.text(width - 250, 250, '', {
            fontSize: '16px', fill: '#ecf0f1', lineHeight: 28, fontFamily: 'Courier New'
        }).setOrigin(0.5, 0);

        // --- RODAPÉ: BOTÃO INICIAR ---
        new Button(this, width / 2, height - 60, 'INICIAR AVENTURA', () => {
            this.confirmCreation();
        }, { width: 250, height: 50, bgColor: 0x27ae60, bgHover: 0x2ecc71 });

        // Atualiza primeira vez
        this.updateSelection('GUERREIRO');
    }

    updateSelection(key) {
        this.selectedClassKey = key;
        const data = CLASSES[key];

        this.heroSprite.setTexture(data.sprite);
        this.descText.setText(data.description || "Um bravo guerreiro.");

        const s = data.baseStats;
        this.statsText.setText(
            `HP:  ${s.hp}\n` +
            `MP:  ${s.mp}\n` +
            `STR: ${s.str}\n` +
            `DEF: ${s.def}\n` +
            `SPD: ${s.spd}`
        );
    }

    confirmCreation() {
        console.log(`[CharacterScene] Criando: ${this.heroName} (${this.selectedClassKey})`);

        const classData = CLASSES[this.selectedClassKey];
        
        const heroData = {
            name: this.heroName,
            classKey: this.selectedClassKey,
            sprite: classData.sprite, 
            
            stats: { ...classData.baseStats },
            growth: { ...classData.growth },
            
            currentHp: classData.baseStats.hp,
            currentMp: classData.baseStats.mp,
            
            level: 1,
            exp: 0,
            xpToNext: 100,
            
            mobility: classData.mobility || 3,
            range: classData.range || 1,
            equipment: { ...classData.startEquipment }
        };

        // Instancia o PartyManager (Agora com o método clearParty funcional)
        const partyManager = new PartyManager(this);
        
        // Limpa qualquer dado antigo antes de começar
        partyManager.clearParty(); 
        
        // Adiciona o novo herói
        partyManager.addMember(heroData);

        // Define o local inicial
        this.registry.set('currentLocationId', 'VILA_INICIAL');

        // Transição
        this.cameras.main.fadeOut(500);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('WorldMapScene');
        });
    }
}