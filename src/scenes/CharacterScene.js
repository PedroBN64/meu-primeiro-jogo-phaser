import { CLASSES } from '../data/classes.js';
import { Button } from '../components/Button.js';
import { PartyManager } from '../systems/PartyManager.js';

export class CharacterScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterScene' });
    }

    preload() {
        // --- 1. CARREGAMENTO AUTOMÁTICO DE SPRITES ---
        // Percorremos nosso arquivo de classes para carregar as imagens
        Object.keys(CLASSES).forEach(key => {
            const classe = CLASSES[key];
            // Importante: O nome do arquivo na pasta assets deve bater com a lógica aqui
            // Ex: Se no classes.js o sprite é 'img_guerreiro', o arquivo deve ser 'assets/guerreiro.png'
            // Vou assumir que seus arquivos são: guerreiro.png, mago.png, etc.
            const nomeArquivo = classe.sprite.replace('img_', '') + '.png';
            this.load.image(classe.sprite, `assets/${nomeArquivo}`);
        });

        // Carrega uma imagem de UI para o fundo dos atributos (opcional, usarei cor sólida por enquanto)
    }

    create() {
        const { width, height } = this.scale;
        
        // Estado atual da seleção (Padrão: GUERREIRO)
        this.selectedClassKey = 'GUERREIRO'; 

        // --- TÍTULO ---
        this.add.text(width / 2, 50, 'CRIE SEU HERÓI', {
            fontSize: '32px', fontStyle: 'bold', fill: '#ffffff'
        }).setOrigin(0.5);

        // --- ÁREA ESQUERDA: LISTA DE CLASSES (BOTÕES) ---
        let yPos = 150;
        Object.keys(CLASSES).forEach(key => {
            const classe = CLASSES[key];
            
            // Cria um botão menor para cada classe
            new Button(this, 200, yPos, classe.name, () => {
                this.updateSelection(key);
            }, { width: 180, height: 40, fontSize: '16px' });
            
            yPos += 55; // Espaço entre os botões
        });

        // --- ÁREA CENTRAL: PREVIEW DO PERSONAGEM ---
        // Fundo do preview
        this.add.rectangle(width / 2, height / 2 - 50, 200, 300, 0x222222).setStrokeStyle(2, 0x888888);
        
        // Sprite do Personagem (Começa com o Guerreiro)
        this.heroSprite = this.add.image(width / 2, height / 2 - 80, CLASSES.GUERREIRO.sprite);
        this.heroSprite.setScale(4); // Aumenta o Pixel Art para ficar visível (4x)

        // --- INPUT DE NOME (DOM ELEMENT) ---
        // Criamos um input HTML real posicionado sobre o jogo
        this.nameInput = this.add.dom(width / 2, height / 2 + 50).createFromHTML(`
            <input type="text" name="heroName" placeholder="Digite o nome..." 
            style="font-size: 20px; width: 180px; padding: 5px; text-align: center; color: black;">
        `);
        // Focamos no input para facilitar
        this.nameInput.addListener('click'); 

        // --- ÁREA DIREITA: ATRIBUTOS E DESCRIÇÃO ---
        this.descText = this.add.text(width - 300, 150, '', {
            fontSize: '14px', fill: '#cccccc', wordWrap: { width: 250 }
        });

        this.statsText = this.add.text(width - 300, 250, '', {
            fontSize: '16px', fill: '#ffffff', lineHeight: 24
        });

        // --- BOTÃO DE CONFIRMAR ---
        new Button(this, width / 2, height - 80, 'INICIAR JORNADA', () => {
            this.confirmCreation();
        }, { width: 250, height: 60, bgColor: 0x2ecc71, bgHover: 0x27ae60 });

        // Inicializa a tela com os dados do Guerreiro
        this.updateSelection('GUERREIRO');
    }

    /**
     * Atualiza a tela quando o jogador clica em uma classe
     */
    updateSelection(key) {
        this.selectedClassKey = key;
        const data = CLASSES[key];

        // 1. Troca a imagem
        this.heroSprite.setTexture(data.sprite);

        // 2. Atualiza Descrição
        this.descText.setText(data.description);

        // 3. Atualiza Texto de Status
        // Dica de Mentor: Usamos template literals (``) para formatar bonito
        this.statsText.setText(`
        VIDA (HP): ${data.baseStats.hp}
        MANA (MP): ${data.baseStats.mp}
        FORÇA:     ${data.baseStats.str}
        INTEL:     ${data.baseStats.int}
        DEFESA:    ${data.baseStats.def}
        VELOC:     ${data.baseStats.spd}
        `);
    }

    /**
     * Valida e salva os dados antes de ir para o jogo
     */
    confirmCreation() {
        const inputElement = this.nameInput.getChildByName('heroName');
        const nomeDigitado = inputElement.value.trim();

        if (nomeDigitado === "") {
            alert("Por favor, dê um nome ao seu herói!");
            return;
        }

        // Prepara os dados brutos
        const classData = CLASSES[this.selectedClassKey];
        const heroData = {
            name: nomeDigitado,
            classKey: this.selectedClassKey,
            stats: { ...classData.baseStats },
            growth: { ...classData.growth },
            equipment: { ...classData.startEquipment },
            mobility: classData.mobility, // Copia quanto ele anda
            range: classData.range,       // Copia o alcance do ataque
            currentHp: classData.baseStats.hp,
            currentMp: classData.baseStats.mp,
            level: 1,
            exp: 0,
            xpToNext: 100
        };

        // --- MUDANÇA AQUI: USA O PARTY MANAGER ---
        // Instancia o gerenciador (ele vai ler o registry atual, que deve estar vazio)
        const partyManager = new PartyManager(this);
        
        // Adiciona nosso herói recém-criado
        partyManager.addMember(heroData);

        // Feedback visual
        console.log("Grupo Inaugurado:", partyManager.getAllMembers());

        // Vai para a cena de Batalha (ou Mapa)
        this.scene.start('BattleScene');
    }
}