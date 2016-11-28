import Ember from 'ember';
import KeyboardShortcuts from 'ember-keyboard-shortcuts/mixins/component';
import Pac from '../models/pac';
import Level from '../models/level';
import Level2 from '../models/level2';
import SharedStuff from '../mixins/shared-stuff';
import Ghost from '../models/ghost';

export default Ember.Component.extend(KeyboardShortcuts, SharedStuff, {

    levels: [Level, Level2],

    levelNumber: 1,

    loadNewLevel() {
        let levelIndex = (this.get('levelNumber') - 1) % this.get('levels.length');
        let levelClass = this.get('levels')[levelIndex];
        return levelClass.create();
    },

    didInsertElement() {
        this.startNewLevel();
        this.loop();
    },

    startNewLevel() {
        let level = this.loadNewLevel();
        level.restart();
        this.set('level', level);

        let pac = Pac.create({
            level: level,
            x: level.get('startingPac.x'),
            y: level.get('startingPac.y')
        });
        this.set('pac', pac);

        let ghosts = level.get('startingGhosts').map((startingPosition) => {
            return Ghost.create({
                level: level,
                x: startingPosition.x,
                y: startingPosition.y,
                pac: pac
            });
        });

        this.set('ghosts', ghosts);
    },

    x: 1,
    score: 0,
    y: 2,

    lives: 3,

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
        this.get('ghosts').forEach((ghost) => {
            ghost.move();
        });

        this.processAnyPellets();
        this.clearScreen();
        this.drawGrid();

        this.get('pac').draw();
        this.get('ghosts').forEach((ghost)=> {
            ghost.draw();
        });

        if (this.collidedWithGhost()) {
            this.decrementProperty('lives');
            this.restart();
        }

        Ember.run.later(this, this.loop, 1000/60);
    },

    collidedWithGhost() {
        return this.get('ghosts').any((ghost) => {
            return this.get('pac.x') === ghost.get('x') && this.get('pac.y') === ghost.get('y');
        });
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
                this.startNewLevel();
            }
        }
    },

    restart() {
        if (this.get('lives') <= 0) {
            this.set('score', 0);
            this.set('lives', 3);
            this.set('levelNumber', 1);
            this.startNewLevel();
        }
        this.get('pac').restart();
        this.get('ghosts').forEach(ghost => ghost.restart());
    }
});
