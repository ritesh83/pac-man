import Ember from 'ember';
import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/component';
import Pac from '../models/pac';
import Level from '../models/level2';
import SharedStuff from '../mixins/shared-stuff';

export default Ember.Component.extend(KeyboardShortcuts, SharedStuff, {

    didInsertElement() {
        let level = Level.create();

        this.set('level', level);
        this.set('pac', Pac.create({
            level: level,
            x: level.get('startingPac.x'),
            y: level.get('startingPac.y')
        }));

        this.loop();
    },

    x: 1,
    score: 0,
    y: 2,

    walls: [
        {x: 1, y: 1},
        {x: 8, y: 5}
    ],

    drawWall(x, y) {
        let ctx = this.get('ctx');
        let squareSize = this.get('level.squareSize');
        ctx.fillStyle = '#000';
        ctx.fillRect(
            x * squareSize,
            y * squareSize,
            squareSize,
            squareSize
        );
    },

    drawPellet(x, y) {
        let radiusDivisor = 6;
        this.drawCircle(x, y, radiusDivisor, 'stopped');
    },

    drawGrid() {
        let ctx = this.get('ctx');
        ctx.fillStyle = '#000';

        let grid = this.get('level.grid');
        grid.forEach((row, rowIndex) => {
            row.forEach((cell, columnIndex) => {
                if(cell === 1) {
                    this.drawWall(columnIndex, rowIndex);
                }

                if(cell === 2) {
                    this.drawPellet(columnIndex, rowIndex);
                }
            });
        });
    },

    intent: 'down',

    keyboardShortcuts: {
        up() {
            this.set('pac.intent', 'up');
        },
        down() {
            this.set('pac.intent', 'down');
        },
        left() {
            this.set('pac.intent', 'left');
        },
        right() {
            this.set('pac.intent', 'right');
        }
    },

    clearScreen() {
        let ctx = this.get('ctx');
        ctx.clearRect(0, 0, this.get('level.pixelWidth'), this.get('level.pixelHeight'));
    },

    isMoving: false,

    loop() {
        this.get('pac').move();

        this.processAnyPellets();
        this.clearScreen();
        this.drawGrid();

        this.get('pac').draw();
        Ember.run.later(this, this.loop, 1000/60);
    },

    collidedWithBorder() {
        let x = this.get('x');
        let y = this.get('y');

        let screenHeight = this.get('level.height');
        let screenWidth = this.get('level.width');

        let pacOutOfBounds = x < 0 || y < 0 || x >= screenWidth || y >= screenHeight;

        return pacOutOfBounds;
    },

    collidedWithWall() {
        let x = this.get('x');
        let y = this.get('y');
        let grid = this.get('level.grid');

        return grid[y][x] === 1;
    },

    processAnyPellets() {
        let x = this.get('pac.x');
        let y = this.get('pac.y');
        let grid = this.get('level.grid');

        if(grid[y][x] === 2) {
            grid[y][x] = 0;
            this.incrementProperty('score');

            if(this.get('level').isComplete()) {
                this.incrementProperty('levelNumber');
                this.restart();
            }
        }
    },

    restart() {
        this.get('pac').restart();
        this.get('level').restart();
    }
});
