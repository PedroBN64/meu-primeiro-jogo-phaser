/**
 * ARQUIVO: CharacterScene.js
 * DESCRIÇÃO: Tela de criação e customização do personagem.
 */
import { StatRow } from '../components/StatRow.js';
import { Button } from '../components/Button.js';


export class CharacterScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterScene' });
    }

    create() {
        const { width, height } = this.scale;

        // Título apenas para sabermos que chegamos aqui
        this.add.text(width / 2, 50, 'CUSTOMIZAÇÃO DE PERSONAGEM', {
            fontSize: '32px',
            fill: '#fff'
        }).setOrigin(0.5);

        // --- SISTEMA DE ATRIBUTOS ---
        // Posicionamos as linhas de atributos uma abaixo da outra
        this.forca = new StatRow(this, width / 2, 200, 'FORÇA', 10);
        this.destreza = new StatRow(this, width / 2, 260, 'AGILIDADE', 10);
        this.inteligencia = new StatRow(this, width / 2, 320, 'MAGIA', 10);

        // Exemplo de como ouvir a mudança:
        this.forca.on('changed', (data) => {
            console.log(`Novo valor de ${data.label}: ${data.value}`);
        });

        // --- BOTÃO FINALIZAR ---
        this.btnConfirm = new Button(this, width / 2, 500, 'CONFIRMAR', () => {
            // Para a cena de criação
            this.scene.stop('CharacterScene');
            // Inicia a cena de batalha
            this.scene.start('BattleScene');
            }, '14px');
        this.btnConfirm.setButtonSize(280, 50);


    }
}