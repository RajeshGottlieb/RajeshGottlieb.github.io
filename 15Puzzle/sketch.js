// 15 Puzzle

let fontsize = 40;

const tileFillColor = '#FFE4C4';
const tileBorderColor = '#000000';
const textColor = '#000000';

let tileWidth;
let tileHeight;

let grid = [[null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null]];
let movesSpan = null;
let moveCount = 0;

// One of the 15 Tiles one the grid within one Cell or between two Cells.
// Tiles move - Cells don't. 
class Tile {
    constructor(number, width, height, cell) {
        this.number = number;
        this.width = width;
        this.height = height;
        this.cell = cell;
    }

    toString() {
        return "Tile(number=" + this.number + ")";
    }

    update() {
        // TODO should I animate the movement?
    }

    draw() {
        push();
        translate(this.cell.col * this.width, this.cell.row * this.height);

        // Draw the tile rectangle
        fill(tileFillColor);
        stroke(tileBorderColor);
        strokeWeight(5);
        rect(0, 0, this.width, this.height, 20);

        // Draw the tile number
        fill(textColor);
        stroke(textColor);
        strokeWeight(1);
        text(this.number, this.width / 2, this.height / 2);

        pop();
    }
}

// One of the fixed cells on the grid.
// Cells don't move - Tiles do.
class Cell {
    constructor(row, col) {
        this.row = row; // grid x offset from left (0-COLS)
        this.col = col;
        this.tile = null;
    }

    toString() {
        let tileString = (this.tile == null) ? "null" : this.tile.toString();
        return "Cell(row=" + this.row + ", col=" + this.col + ", tile=" + tileString + ")";
    }
}

// put a Cell in each grid element with Tiles in the first 15 Cells
function initGrid() {

    let number = 1;

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {

            let cell = new Cell(row, col);

            // 15 Tiles
            if (number < 16) {
                cell.tile = new Tile(number, tileWidth, tileHeight, cell);
            }

            grid[row][col] = cell;
        //  console.log("grid[" + row + "][" + col + "] = " + cell.toString());
            ++number;
        }
    }

    return grid;
}

// Is the puzzle completed?
function isCompleted() {
    let number = 1;

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {

            let cell = grid[row][col];

            if (number < 16) {
                if (cell.tile == null || cell.tile.number != number) {
                    return false;
                }
            }
            ++number;
        }
    }
    return true;
}

// find the moveable cells - all Cells on the same row or col as the emptyCell
function getMoveableCells() {
    let emptyCell = getEmptyCell();
    let moveableCells = [];
    // Cells on same col as emptyCell
    for (let row = 0; row < grid.length; ++row) {
        if (row != emptyCell.row) {
            moveableCells.push(grid[row][emptyCell.col])
        }
    }
    // Cells on same row as emptyCell
    for (let col = 0; col < grid[0].length; ++col) {
        if (col != emptyCell.col) {
            moveableCells.push(grid[emptyCell.row][col])
        }
    }
    return moveableCells;
}

// Generate row/col values for a random move on a moveable tile
// @return [ row, col ]
function randomMove() {
    let moveableCells = getMoveableCells();
    if (moveableCells.length > 0) {
        let i = int(Math.random() * moveableCells.length)
        let cell = moveableCells[i];
        return [ cell.row, cell.col ];
    }
}

// Start a new game
function newGameButtonClicked() {
    // shuffle the tiles with random moves
    for (let i = 0; i < 1000; ++i) {
        let [ row, col ] = randomMove();
        click(row, col);
    }
    // reset the move counter
    moveCount = 0;
}

// Return the empty Cell in the grid
function getEmptyCell() {
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            let cell = grid[row][col];
            if (cell.tile == null) {
                return cell;
            }
        }
    }
}

function click(row, col) {
    let clickedCell = grid[row][col];
//  console.log("clickedCell.row = " + clickedCell.row + " clickedCell.col = " + clickedCell.col);
    let emptyCell = getEmptyCell();
//  console.log("emptyCell.row = " + emptyCell.row + " emptyCell.col = " + emptyCell.col);

    // array of Cells starting with the emptyCell and ending with the Cell clicked on
    let movingCells = [];

    if (clickedCell.col == emptyCell.col) {
        // vertical movemnent - same col as emptyCell
        if (clickedCell.row < emptyCell.row) {
            // move down
            for (let i = emptyCell.row; i >= clickedCell.row; --i) {
                movingCells.push(grid[i][col]);
            }
        } else if (row > emptyCell.row) {
            // move up
            for (let i = emptyCell.row; i <= clickedCell.row; ++i) {
                movingCells.push(grid[i][col]);
            }
        }
    } else if (clickedCell.row == emptyCell.row) {
        // horizontal movement - same row as emptyCell
        if (clickedCell.col < emptyCell.col) {
            // move right
            for (let j = emptyCell.col; j >= clickedCell.col; --j) {
                movingCells.push(grid[row][j]);
            }
        } else if (clickedCell.col > emptyCell.col) {
            // move left
            for (let j = emptyCell.col; j <= clickedCell.col; ++j) {
                movingCells.push(grid[row][j]);
            }
        }
    }

    if (movingCells.length > 1) {
        // swap tiles between each pair of cells in movingCells[]
        for (let i = 0; i < movingCells.length - 1; ++i) {
            let swap_tile = movingCells[i].tile;
            movingCells[i].tile = movingCells[i+1].tile;
            movingCells[i+1].tile = swap_tile;
        }
        // tell the moved tiles what cell they are now in
        for (let i = 0; i < movingCells.length; ++i) {
            let cell = movingCells[i];
            if (cell.tile != null) {
                cell.tile.cell = cell;
            }
        }

        ++moveCount;
    }
}

function preload() {
    // load font?
}

function mouseReleased() {
//  console.log("mouseX = " + mouseX + " mouseY = " + mouseY);
    col = int(mouseX / (width / grid[0].length));
    row = int(mouseY / (height / grid.length));
    click(row, col);
}

function setup() {

    let shortSide = (windowWidth < windowHeight) ? windowWidth : windowHeight;
    shortSide = int(shortSide / 4) * 4;
    if (shortSide > 400) {
        shortSide = 400;
    }
    let canvasWidth = shortSide;
    let canvasHeight = shortSide;
//  createCanvas(400, 400);
    createCanvas(canvasWidth, canvasHeight);
    createP();
//  createSpan("windowWidth=" + windowWidth + " windowHeight=" + windowHeight);
//  createP();
//  createSpan("shortSide=" + shortSide);
//  createP();
    
    movesSpan = createSpan("Moves: " + moveCount);
    createP();

    let newGameButton = createButton("New Game");
    newGameButton.mouseClicked(newGameButtonClicked);
    // could put button on canvas
//  newGameButton.position(100, 100);
//  newGameButton.size(100, 100);

    tileWidth = width / 4;
    tileHeight = height / 4;

    // Set text characteristics
    //textFont(font);
    textSize(fontsize);
    textAlign(CENTER, CENTER);

    grid = initGrid();
    newGameButtonClicked();
}

function draw() {
    // clear the background
    background(0);

    // loop through each cell in the grid displaying tiles
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            let cell = grid[row][col];
            if (cell.tile != null) {
                cell.tile.update();
                cell.tile.draw();
            }
        }
    }

    let completedStr = isCompleted() ? "<b>COMPLETED!</b> " : "";
    movesSpan.html(completedStr + "Moves: " + moveCount);
}
