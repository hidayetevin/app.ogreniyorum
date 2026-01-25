import { GAME_CONFIG, COLORS, Z_INDEX } from '@constants/index';

/**
 * ParentGate - Math-based security to prevent children from accessing parent panel
 */
export class ParentGate extends Phaser.GameObjects.Container {
    private background: Phaser.GameObjects.Graphics;
    private overlay: Phaser.GameObjects.Graphics;
    private questionText: Phaser.GameObjects.Text;
    private answerButtons: Phaser.GameObjects.Container[] = [];
    private correctAnswer: number = 0;
    private attempts: number = 0;
    private maxAttempts: number = 3;
    private onSuccess: () => void;
    private onFail: () => void;

    constructor(
        scene: Phaser.Scene,
        onSuccess: () => void,
        onFail: () => void
    ) {
        super(scene, 0, 0);

        this.onSuccess = onSuccess;
        this.onFail = onFail;

        // Full screen overlay
        this.overlay = scene.add.graphics();
        this.overlay.fillStyle(0x000000, 0.7);
        this.overlay.fillRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
        this.add(this.overlay);

        // Panel background
        const panelWidth = 500;
        const panelHeight = 400;
        const panelX = (GAME_CONFIG.WIDTH - panelWidth) / 2;
        const panelY = (GAME_CONFIG.HEIGHT - panelHeight) / 2;

        this.background = scene.add.graphics();
        this.background.fillStyle(parseInt(COLORS.CARD_BACK.replace('#', ''), 16), 1);
        this.background.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 16);
        this.background.lineStyle(4, parseInt(COLORS.PRIMARY.replace('#', ''), 16), 1);
        this.background.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 16);
        this.add(this.background);

        // Title
        const titleText = scene.add.text(
            GAME_CONFIG.WIDTH / 2,
            panelY + 40,
            '🔒 EBEVEYN PANELİ',
            {
                fontSize: '32px',
                color: COLORS.WARNING,
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold',
            }
        );
        titleText.setOrigin(0.5);
        this.add(titleText);

        // Instruction
        const instructionText = scene.add.text(
            GAME_CONFIG.WIDTH / 2,
            panelY + 90,
            'Lütfen soruyu cevaplayın:',
            {
                fontSize: '20px',
                color: COLORS.TEXT_LIGHT,
                fontFamily: 'Arial, sans-serif',
            }
        );
        instructionText.setOrigin(0.5);
        this.add(instructionText);

        // Question text
        this.questionText = scene.add.text(
            GAME_CONFIG.WIDTH / 2,
            panelY + 150,
            '',
            {
                fontSize: '36px',
                color: COLORS.TEXT_LIGHT,
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold',
            }
        );
        this.questionText.setOrigin(0.5);
        this.add(this.questionText);

        // Generate question
        this.generateQuestion();

        // Cancel button
        this.createCancelButton(GAME_CONFIG.WIDTH / 2, panelY + panelHeight - 60);

        this.setDepth(Z_INDEX.MODAL);
        this.setVisible(false);

        // Add to scene
        scene.add.existing(this);
    }

    /**
     * Generates a random math question
     */
    private generateQuestion(): void {
        const operations = ['+', '-'];
        const operation = operations[Math.floor(Math.random() * operations.length)];

        let num1: number;
        let num2: number;

        if (operation === '+') {
            num1 = Math.floor(Math.random() * 10) + 1; // 1-10
            num2 = Math.floor(Math.random() * 10) + 1; // 1-10
            this.correctAnswer = num1 + num2;
        } else {
            // For subtraction, ensure positive result
            num1 = Math.floor(Math.random() * 10) + 5; // 5-14
            num2 = Math.floor(Math.random() * num1) + 1; // 1 to num1
            this.correctAnswer = num1 - num2;
        }

        this.questionText.setText(`${num1} ${operation} ${num2} = ?`);

        // Create answer buttons
        this.createAnswerButtons();
    }

    /**
     * Creates answer buttons with correct and wrong answers
     */
    private createAnswerButtons(): void {
        // Clear existing buttons
        this.answerButtons.forEach(btn => btn.destroy());
        this.answerButtons = [];

        // Generate 3 unique answers (1 correct, 2 wrong)
        const answers: number[] = [this.correctAnswer];

        while (answers.length < 3) {
            const wrongAnswer = this.correctAnswer + (Math.floor(Math.random() * 5) - 2);
            if (wrongAnswer !== this.correctAnswer && wrongAnswer > 0 && !answers.includes(wrongAnswer)) {
                answers.push(wrongAnswer);
            }
        }

        // Shuffle answers
        answers.sort(() => Math.random() - 0.5);

        // Create buttons
        const buttonY = GAME_CONFIG.HEIGHT / 2 + 80;
        const spacing = 120;
        const startX = GAME_CONFIG.WIDTH / 2 - spacing;

        answers.forEach((answer, index) => {
            const button = this.createAnswerButton(
                startX + index * spacing,
                buttonY,
                answer
            );
            this.answerButtons.push(button);
        });
    }

    /**
     * Creates a single answer button
     */
    private createAnswerButton(x: number, y: number, answer: number): Phaser.GameObjects.Container {
        const container = this.scene.add.container(x, y);

        const bg = this.scene.add.graphics();
        bg.fillStyle(parseInt(COLORS.PRIMARY.replace('#', ''), 16), 1);
        bg.fillRoundedRect(-40, -30, 80, 60, 8);
        container.add(bg);

        const text = this.scene.add.text(0, 0, answer.toString(), {
            fontSize: '28px',
            color: COLORS.TEXT_LIGHT,
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
        });
        text.setOrigin(0.5);
        container.add(text);

        // Make interactive
        bg.setInteractive(
            new Phaser.Geom.Rectangle(-40, -30, 80, 60),
            Phaser.Geom.Rectangle.Contains
        );

        bg.on('pointerdown', () => {
            this.checkAnswer(answer);
        });

        bg.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(parseInt(COLORS.SECONDARY.replace('#', ''), 16), 1);
            bg.fillRoundedRect(-40, -30, 80, 60, 8);
        });

        bg.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(parseInt(COLORS.PRIMARY.replace('#', ''), 16), 1);
            bg.fillRoundedRect(-40, -30, 80, 60, 8);
        });

        this.add(container);
        return container;
    }

    /**
     * Creates cancel button
     */
    private createCancelButton(x: number, y: number): void {
        const container = this.scene.add.container(x, y);

        const bg = this.scene.add.graphics();
        bg.fillStyle(parseInt(COLORS.ACCENT.replace('#', ''), 16), 1);
        bg.fillRoundedRect(-60, -25, 120, 50, 8);
        container.add(bg);

        const text = this.scene.add.text(0, 0, 'İptal', {
            fontSize: '20px',
            color: COLORS.TEXT_LIGHT,
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
        });
        text.setOrigin(0.5);
        container.add(text);

        bg.setInteractive(
            new Phaser.Geom.Rectangle(-60, -25, 120, 50),
            Phaser.Geom.Rectangle.Contains
        );

        bg.on('pointerdown', () => {
            this.hide();
            this.onFail();
        });

        this.add(container);
    }

    /**
     * Checks if the answer is correct
     */
    private checkAnswer(answer: number): void {
        if (answer === this.correctAnswer) {
            // Correct!
            this.hide();
            this.onSuccess();
        } else {
            // Wrong answer
            this.attempts++;

            if (this.attempts >= this.maxAttempts) {
                // Too many attempts, close
                this.hide();
                this.onFail();
            } else {
                // Generate new question
                this.generateQuestion();

                // Shake animation
                this.scene.tweens.add({
                    targets: this,
                    x: 10,
                    duration: 50,
                    yoyo: true,
                    repeat: 3,
                    onComplete: () => {
                        this.x = 0;
                    },
                });
            }
        }
    }

    /**
     * Shows the parent gate
     */
    public show(): void {
        this.attempts = 0;
        this.generateQuestion();
        this.setVisible(true);
    }

    /**
     * Hides the parent gate
     */
    public hide(): void {
        this.setVisible(false);
    }

    /**
     * Cleanup
     */
    public override destroy(fromScene?: boolean): void {
        this.overlay.destroy();
        this.background.destroy();
        this.answerButtons.forEach(btn => btn.destroy());
        super.destroy(fromScene);
    }
}
