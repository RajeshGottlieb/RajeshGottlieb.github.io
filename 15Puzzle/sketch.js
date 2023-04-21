// 15 Puzzle

const fontsize = 48;

//const canvasColor = '#c7b183';
const canvasColor = '#d3d3d3';
const normalTileColor = '#FFE4C4';
const solvedTileColor = '#bcd4b6';
let tileColor = normalTileColor;
const tileBorderColor = '#000000';
const textColor = '#000000';

let grid = [[null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null]];

let boardBorder = 5;
let boardSideLength;
let boardX;
let boardY;
let tileWidth;
let span;

let moveCount = 0;

// One of the 15 Tiles one the grid within one Cell or between two Cells.
// Tiles move - Cells don't. 
class Tile {
    constructor(number, cell) {
        this.number = number;
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
        translate(this.cell.col * tileWidth, this.cell.row * tileWidth);

        // Draw the tile rectangle
        fill(tileColor);
        stroke(tileBorderColor);
        strokeWeight(5);
        rect(0, 0, tileWidth-2, tileWidth-2, 20);

        // Draw the tile number
        fill(textColor);
        stroke(textColor);
        strokeWeight(1);
        text(this.number, tileWidth / 2, tileWidth / 2);

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
                cell.tile = new Tile(number, tileWidth, tileWidth, cell);
            }

            grid[row][col] = cell;
        //  console.log("grid[" + row + "][" + col + "] = " + cell.toString());
            ++number;
        }
    }

    return grid;
}

// Is the puzzle Solved?
function isSolved() {
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
    col = int((mouseX - boardX) / tileWidth);
    row = int((mouseY - boardY) / tileWidth);
//  print("col=" + col + " row=" + row);
    if (row >= 0 && row < 4 && col >= 0 && col < 4)
        click(row, col);
}

function setup() {
    print("windowWidth=" + windowWidth + " windowHeight=" + windowHeight);

    const targetAspectRatio = 16 / 9; // most cell phones have an aspect ration of 16:9
    print("targetAspectRatio=" + targetAspectRatio);

    let aspectRatio = windowHeight / windowWidth;
    print("aspectRatio=" + aspectRatio);

    let canvasWidth;
    let canvasHeight;

    if (aspectRatio < targetAspectRatio) {
        // shrink the width to acheive the targetAspectRatio
        canvasHeight = windowHeight;
        canvasWidth = int(9 * windowHeight / 16);
    } else {
        // shrink the height to acheive the targetAspectRatio
        canvasWidth = windowWidth;
        canvasHeight = int(16 * canvasWidth / 9);
    }

    print("canvasWidth=" + canvasWidth + " canvasHeight=" + canvasHeight);
    print("canvasHeight/canvasWidth=" + canvasHeight/canvasWidth);

    boardSideLength = int(canvasWidth - 2 * boardBorder);
    tileWidth = int(boardSideLength / 4)
    print("boardSideLength=" + boardSideLength + " tileWidth=" + tileWidth);

    boardBorder = (canvasWidth - boardSideLength) / 2;
    boardX = boardBorder;
    boardY = (canvasHeight - boardSideLength) / 2; // centered vertically
    print("boardX=" + boardX + " boardY=" + boardY);
    createCanvas(canvasWidth, canvasHeight);

    //  createCanvas(windowWidth, windowHeight);
    span = createSpan("Moves: 100");
    // center vertically in the space above the board
    let spanX = boardBorder * 2;
    let spanY = int((canvasHeight - canvasWidth) / 4 - span.height / 2);
    span.position(spanX, spanY);

    let button = createButton("New Game");
    // center horizontally and vertically in the space below the board
    let buttonX = canvasWidth / 2 - button.width / 2;
    let buttonY = int(canvasHeight - (canvasHeight - canvasWidth) / 4 - button.height / 2);
    button.position(buttonX, buttonY);
    button.mouseClicked(newGameButtonClicked);

    textSize(fontsize);
    textAlign(CENTER, CENTER);

    grid = initGrid();
    newGameButtonClicked();
}

function draw() {
    // clear the canvas background
    background(canvasColor);

    // draw the grid background
    fill("#000000");
    rect(boardX, boardY, boardSideLength, boardSideLength, 18);

    let solved = isSolved();

    tileColor = solved ? solvedTileColor : normalTileColor;

    push();
    translate(boardX + boardBorder/2, boardY + boardBorder/2);

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

    pop();

    let spanHtml = solved ? "<b>Solved!</b> " : "";
    spanHtml += "Moves: " + moveCount;
    span.html(spanHtml);
}
