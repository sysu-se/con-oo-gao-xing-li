import { createSudokuFromJSON } from './sudoku.js'
<<<<<<< HEAD

function isSudokuLike(value) {
  return Boolean(
    value &&
      typeof value.getGrid === 'function' &&
      typeof value.guess === 'function' &&
      typeof value.clone === 'function' &&
      typeof value.toJSON === 'function',
  )
}

function normalizeHistory(history = {}) {
  return {
    past: Array.isArray(history.past) ? structuredClone(history.past) : [],
    future: Array.isArray(history.future) ? structuredClone(history.future) : [],
  }
}
=======
>>>>>>> b818f42ca6a343188964f83a8bf3364d40db4c88

class Game {
  constructor(sudoku, history = { past: [], future: [] }) {
    if (!isSudokuLike(sudoku)) {
      throw new TypeError('sudoku must be a Sudoku-like object')
    }

    this.current = sudoku.clone()
    const normalized = normalizeHistory(history)
    this.past = normalized.past
    this.future = normalized.future
  }

  snapshotOf(sudoku) {
    return sudoku.toJSON()
  }

  getSudoku() {
    return this.current.clone()
  }

  guess(move) {
    this.past.push(this.snapshotOf(this.current))
    this.current.guess(move)
    this.future = []
  }

  undo() {
    if (this.past.length === 0) return
    this.future.push(this.snapshotOf(this.current))
    const prev = this.past.pop()
    this.current = createSudokuFromJSON(prev)
  }

  redo() {
    if (this.future.length === 0) return
    this.past.push(this.snapshotOf(this.current))
    const next = this.future.pop()
    this.current = createSudokuFromJSON(next)
  }

  canUndo() {
    return this.past.length > 0
  }

  canRedo() {
    return this.future.length > 0
  }

  toJSON() {
    return {
      sudoku: this.snapshotOf(this.current),
      past: structuredClone(this.past),
      future: structuredClone(this.future),
    }
  }

  static fromJSON(json) {
    if (!json || typeof json !== 'object') {
      throw new TypeError('json must be an object')
    }
    if (!json.sudoku) {
      throw new TypeError('json.sudoku is required')
    }

    return new Game(
      createSudokuFromJSON(json.sudoku),
      normalizeHistory({ past: json.past, future: json.future }),
    )
  }
}

export function createGame({ sudoku, history = { past: [], future: [] } } = {}) {
  return new Game(sudoku, history)
}

export function createGameFromJSON(json) {
  return Game.fromJSON(json)
}
