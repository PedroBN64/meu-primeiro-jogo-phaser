/**
 * ARQUIVO: StatRow.js
 * DESCRIÇÃO: Componente que agrupa [Nome: - Valor +] para atributos.
 */

import { Button } from './Button.js';

export class StatRow extends Phaser.GameObjects.Container {
    constructor(scene, x, y, label, initialValue) {
        super(scene, x, y);

        this.value = initialValue;
        this.label = label;

        // --- 1. NOME DO ATRIBUTO ---
        this.labelText = scene.add.text(-100, 0, label, {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);

        // --- 2. VALOR NUMÉRICO ---
        this.valueText = scene.add.text(50, 0, this.value.toString(), {
            fontSize: '24px',
            fill: '#ffff00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // --- 3. BOTÕES DE CONTROLE ---
        // Botão Menos
        this.btnMinus = new Button(scene, 10, 0, '-', () => this.updateValue(-1));
        this.btnMinus.bg.setSize(30, 30); // Fazemos o botão ser menor e quadrado
        this.btnMinus.setSize(30, 30);

        // Botão Mais
        this.btnPlus = new Button(scene, 90, 0, '+', () => this.updateValue(1));
        this.btnPlus.bg.setSize(30, 30);
        this.btnPlus.setSize(30, 30);

        // Adicionando tudo ao Container
        this.add([this.labelText, this.valueText, this.btnMinus, this.btnPlus]);
        
        scene.add.existing(this);
    }

    updateValue(amount) {
        // Lógica simples de limite (ex: atributo entre 0 e 20)
        const newValue = this.value + amount;
        if (newValue >= 0 && newValue <= 20) {
            this.value = newValue;
            this.valueText.setText(this.value.toString());
            
            // Emite um evento para a cena saber que o valor mudou
            this.emit('changed', { label: this.label, value: this.value });
        }
    }
}