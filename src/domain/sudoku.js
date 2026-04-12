import { BOX_SIZE, SUDOKU_SIZE } from '@sudoku/constants';

class Sudoku {
  constructor(inputGrid) {
    this.grid = Sudoku.cloneGrid(inputGrid)
  }

  static cloneGrid(grid) {
    return grid.map(row => [...row])
  }

  getGrid() {
    return Sudoku.cloneGrid(this.grid)
  }

  guess(move) {
    const { row, col, value } = move
    this.grid[row][col] = value
  }

  clone() {
    return new Sudoku(this.grid)
  }

  toJSON() {
    return { grid: Sudoku.cloneGrid(this.grid) }
  }

  toString() {
        let out = '╔═══════╤═══════╤═══════╗\n';

        for (let row = 0; row < SUDOKU_SIZE; row++) {
            if (row !== 0 && row % BOX_SIZE === 0) {
                out += '╟───────┼───────┼───────╢\n';
            }

            for (let col = 0; col < SUDOKU_SIZE; col++) {
                if (col === 0) {
                    out += '║ ';
                } else if (col % BOX_SIZE === 0) {
                    out += '│ ';
                }

                out += (this.grid[row][col] === 0 ? '·' : this.grid[row][col]) + ' ';

                if (col === SUDOKU_SIZE - 1) {
                    out += '║';
                }
            }

            out += '\n';
        }

    out += '╚═══════╧═══════╧═══════╝';
    return out;
  }

  static fromJSON(json) {
    return new Sudoku(json.grid)
  }
}

export function createSudoku(input) {
  return new Sudoku(input)
}

export function createSudokuFromJSON(json) {
  return Sudoku.fromJSON(json)
}