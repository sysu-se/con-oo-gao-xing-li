import { createSudokuFromJSON } from './sudoku.js'
import { BOX_SIZE, SUDOKU_SIZE } from '../node_modules/@sudoku/constants.js'

class Game {
  constructor(sudoku, history = { past: [], future: [] }) {
    this.current = sudoku
    this.past = structuredClone(history.past ?? [])
    this.future = structuredClone(history.future ?? [])
  }

  snapshotOf(sudoku) {
    return sudoku.toJSON()
  }

  getSudoku() {
    return this.current
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
    return new Game(
      createSudokuFromJSON(json.sudoku),
      {
        past: json.past ?? [],
        future: json.future ?? [],
      },
    )
  }
}

export function createGame({ sudoku, history = { past: [], future: [] } }) {
  return new Game(sudoku, history)
}

export function createGameFromJSON(json) {
  return Game.fromJSON(json)
}