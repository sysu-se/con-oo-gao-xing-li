import { BOX_SIZE, SUDOKU_SIZE } from '../node_modules/@sudoku/constants.js'

function cloneGrid(grid) {
  return grid.map(row => [...row])
}

function cloneMask(mask) {
  return mask.map(row => [...row])
}

function assertInteger(value, name) {
  if (!Number.isInteger(value)) {
    throw new TypeError(`${name} must be an integer`)
  }
}

function assertGridShape(grid, name = 'grid') {
  if (!Array.isArray(grid) || grid.length !== SUDOKU_SIZE) {
    throw new TypeError(`${name} must be a ${SUDOKU_SIZE}x${SUDOKU_SIZE} array`)
  }

  for (let row = 0; row < SUDOKU_SIZE; row++) {
    if (!Array.isArray(grid[row]) || grid[row].length !== SUDOKU_SIZE) {
      throw new TypeError(`${name}[${row}] must be an array of length ${SUDOKU_SIZE}`)
    }
  }
}

function assertGridValues(grid, name = 'grid') {
  for (let row = 0; row < SUDOKU_SIZE; row++) {
    for (let col = 0; col < SUDOKU_SIZE; col++) {
      const value = grid[row][col]
      if (!Number.isInteger(value) || value < 0 || value > SUDOKU_SIZE) {
        throw new RangeError(
          `${name}[${row}][${col}] must be an integer between 0 and ${SUDOKU_SIZE}`,
        )
      }
    }
  }
}

function buildGivensFromGrid(grid) {
  return grid.map(row => row.map(value => value !== 0))
}

function normalizeGivens(givens) {
  if (givens === undefined) return undefined
  assertGridShape(givens, 'givens')
  return givens.map(row => row.map(cell => Boolean(cell)))
}

class Sudoku {
  constructor(inputGrid, { givens } = {}) {
    assertGridShape(inputGrid, 'inputGrid')
    assertGridValues(inputGrid, 'inputGrid')

    this.grid = cloneGrid(inputGrid)
    const normalizedGivens = normalizeGivens(givens)
    this.givens = normalizedGivens ?? buildGivensFromGrid(this.grid)
  }

  static cloneGrid(grid) {
    return cloneGrid(grid)
  }

  static normalizeMove(move) {
    if (!move || typeof move !== 'object') {
      throw new TypeError('move must be an object')
    }

    const { row, col, value } = move

    assertInteger(row, 'row')
    assertInteger(col, 'col')
    assertInteger(value, 'value')

    if (row < 0 || row >= SUDOKU_SIZE) {
      throw new RangeError(`row must be between 0 and ${SUDOKU_SIZE - 1}`)
    }
    if (col < 0 || col >= SUDOKU_SIZE) {
      throw new RangeError(`col must be between 0 and ${SUDOKU_SIZE - 1}`)
    }
    if (value < 0 || value > SUDOKU_SIZE) {
      throw new RangeError(`value must be between 0 and ${SUDOKU_SIZE}`)
    }

    return { row, col, value }
  }

  getGrid() {
    return cloneGrid(this.grid)
  }

  getGivens() {
    return cloneMask(this.givens)
  }

  hasConflict(row, col, value) {
    for (let i = 0; i < SUDOKU_SIZE; i++) {
      if (i !== col && this.grid[row][i] === value) return true
      if (i !== row && this.grid[i][col] === value) return true
    }

    const startRow = Math.floor(row / BOX_SIZE) * BOX_SIZE
    const startCol = Math.floor(col / BOX_SIZE) * BOX_SIZE

    for (let r = startRow; r < startRow + BOX_SIZE; r++) {
      for (let c = startCol; c < startCol + BOX_SIZE; c++) {
        if ((r !== row || c !== col) && this.grid[r][c] === value) {
          return true
        }
      }
    }

    return false
  }

  isValidMove(move) {
    try {
      const { row, col, value } = Sudoku.normalizeMove(move)

      if (this.givens[row][col] && value !== this.grid[row][col]) {
        return false
      }

      if (value === 0) return true
      return !this.hasConflict(row, col, value)
    } catch {
      return false
    }
  }

  validate() {
    const invalidCells = []

    for (let row = 0; row < SUDOKU_SIZE; row++) {
      for (let col = 0; col < SUDOKU_SIZE; col++) {
        const value = this.grid[row][col]
        if (value !== 0 && this.hasConflict(row, col, value)) {
          invalidCells.push(`${row},${col}`)
        }
      }
    }

    return {
      valid: invalidCells.length === 0,
      invalidCells,
    }
  }

  guess(move) {
    const { row, col, value } = Sudoku.normalizeMove(move)

    if (this.givens[row][col] && value !== this.grid[row][col]) {
      throw new Error(`cell (${row}, ${col}) is a given and cannot be changed`)
    }

    if (value !== 0 && this.hasConflict(row, col, value)) {
      throw new Error(`move (${row}, ${col})=${value} conflicts with current board`)
    }

    this.grid[row][col] = value
  }

  clone() {
    return new Sudoku(this.grid, { givens: this.givens })
  }

  toJSON() {
    return {
      grid: cloneGrid(this.grid),
      givens: cloneMask(this.givens),
    }
  }

  toString() {
    let out = '╔═══════╤═══════╤═══════╗\n'

    for (let row = 0; row < SUDOKU_SIZE; row++) {
      if (row !== 0 && row % BOX_SIZE === 0) {
        out += '╟───────┼───────┼───────╢\n'
      }

      for (let col = 0; col < SUDOKU_SIZE; col++) {
        if (col === 0) {
          out += '║ '
        } else if (col % BOX_SIZE === 0) {
          out += '│ '
        }

        out += (this.grid[row][col] === 0 ? '·' : this.grid[row][col]) + ' '

        if (col === SUDOKU_SIZE - 1) {
          out += '║'
        }
      }

      out += '\n'
    }

    out += '╚═══════╧═══════╧═══════╝'
    return out
  }

  static fromJSON(json) {
    if (!json || typeof json !== 'object') {
      throw new TypeError('json must be an object')
    }

    return new Sudoku(json.grid, { givens: json.givens })
  }
}

export function createSudoku(input) {
  return new Sudoku(input)
}

export function createSudokuFromJSON(json) {
  return Sudoku.fromJSON(json)
}