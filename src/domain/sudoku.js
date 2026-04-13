import { BOX_SIZE, SUDOKU_SIZE } from '../node_modules/@sudoku/constants.js' // 从常量模块导入宫大小与棋盘大小。
const VALUE_MAX = 9 // 定义单元格允许的最大数字（标准数独为 9）。
function cloneGrid(grid) { // 定义深拷贝二维数字网格的工具函数。
  return grid.map(row => [...row]) // 逐行复制并展开每一行，避免外部修改影响内部状态。
} // 结束 cloneGrid 函数定义。
function cloneMask(mask) { // 定义深拷贝二维布尔掩码的工具函数。
  return mask.map(row => [...row]) // 逐行复制 givens 掩码，避免引用共享。
} // 结束 cloneMask 函数定义。
function assertInteger(value, name) { // 定义整数断言函数，用于参数校验。
  if (!Number.isInteger(value)) { // 如果传入值不是整数。
    throw new TypeError(`${name} must be an integer`) // 抛出类型错误，提示该参数必须为整数。
  } // 结束整数判断分支。
} // 结束 assertInteger 函数定义。
function assertGridShape(grid, name = 'grid') { // 定义网格形状断言，默认名称为 grid。
  if (!Array.isArray(grid) || grid.length !== SUDOKU_SIZE) { // 若不是数组或行数不是 9。
    throw new TypeError(`${name} must be a ${SUDOKU_SIZE}x${SUDOKU_SIZE} array`) // 抛出错误，说明必须是 9x9 二维数组。
  } // 结束第一层形状检查。
  for (let row = 0; row < SUDOKU_SIZE; row++) { // 遍历每一行，继续检查列结构。
    if (!Array.isArray(grid[row]) || grid[row].length !== SUDOKU_SIZE) { // 若当前行不是数组或长度不是 9。
      throw new TypeError(`${name}[${row}] must be an array of length ${SUDOKU_SIZE}`) // 抛出错误，定位到具体哪一行不符合要求。
    } // 结束单行形状检查。
  } // 结束全部行检查循环。
} // 结束 assertGridShape 函数定义。
function assertGridValues(grid, name = 'grid') { // 定义网格数值断言，检查每个格子值范围。
  for (let row = 0; row < SUDOKU_SIZE; row++) { // 外层循环遍历每一行。
    for (let col = 0; col < SUDOKU_SIZE; col++) { // 内层循环遍历每一列。
      const value = grid[row][col] // 读取当前格子的值。
      if (!Number.isInteger(value) || value < 0 || value > VALUE_MAX) { // 若值不是整数或不在 0~9 之间。
        throw new RangeError( // 抛出范围错误，说明值非法。
          `${name}[${row}][${col}] must be an integer between 0 and ${VALUE_MAX}`, // 给出具体位置与合法区间。
        ) // 结束错误信息构造。
      } // 结束单元格取值合法性检查。
    } // 结束列循环。
  } // 结束行循环。
} // 结束 assertGridValues 函数定义。
function buildGivensFromGrid(grid) { // 定义根据初始棋盘自动构造 givens 掩码的函数。
  return grid.map(row => row.map(value => value !== 0)) // 非 0 视为题目给定数字（true），0 视为空格（false）。
} // 结束 buildGivensFromGrid 函数定义。
function normalizeGivens(givens) { // 定义 givens 标准化函数。
  if (givens === undefined) return undefined // 若未提供 givens，则返回 undefined 交由调用方兜底处理。
  assertGridShape(givens, 'givens') // 校验 givens 也是 9x9 结构。
  return givens.map(row => row.map(cell => Boolean(cell))) // 将每个元素强制转为布尔值，统一类型。
} // 结束 normalizeGivens 函数定义。
class Sudoku { // 定义 Sudoku 类，封装数独棋盘操作。
  constructor(inputGrid, { givens } = {}) { // 构造函数：接收初始网格与可选 givens。
    assertGridShape(inputGrid, 'inputGrid') // 校验输入网格形状。
    assertGridValues(inputGrid, 'inputGrid') // 校验输入网格数值范围。
    this.grid = cloneGrid(inputGrid) // 存储输入网格的副本，避免外部引用污染内部状态。
    const normalizedGivens = normalizeGivens(givens) // 将传入 givens 标准化为布尔矩阵。
    this.givens = normalizedGivens ?? buildGivensFromGrid(this.grid) // 若未传 givens，则依据非 0 格自动推断 givens。
  } // 结束构造函数。
  static cloneGrid(grid) { // 提供类静态方法，暴露网格拷贝能力。
    return cloneGrid(grid) // 调用上方工具函数进行深拷贝。
  } // 结束静态 cloneGrid。
  static normalizeMove(move) { // 定义走子标准化与校验方法。
    if (!move || typeof move !== 'object') { // 若 move 不存在或不是对象。
      throw new TypeError('move must be an object') // 抛出类型错误。
    } // 结束 move 对象类型检查。
    const { row, col, value } = move // 从 move 中解构出行、列、值。
    assertInteger(row, 'row') // 校验 row 为整数。
    assertInteger(col, 'col') // 校验 col 为整数。
    assertInteger(value, 'value') // 校验 value 为整数。
    if (row < 0 || row >= SUDOKU_SIZE) { // 检查行号是否越界。
      throw new RangeError(`row must be between 0 and ${SUDOKU_SIZE - 1}`) // 行越界时抛出范围错误。
    } // 结束行范围检查。
    if (col < 0 || col >= SUDOKU_SIZE) { // 检查列号是否越界。
      throw new RangeError(`col must be between 0 and ${SUDOKU_SIZE - 1}`) // 列越界时抛出范围错误。
    } // 结束列范围检查。
    if (value < 0 || value > VALUE_MAX) { // 检查填入值是否在 0~9 之间。
      throw new RangeError(`value must be between 0 and ${VALUE_MAX}`) // 值越界时抛出范围错误。
    } // 结束值范围检查。
    return { row, col, value } // 返回已验证通过的标准化 move 对象。
  } // 结束静态 normalizeMove。
  getGrid() { // 提供读取棋盘的方法。
    return cloneGrid(this.grid) // 返回棋盘副本，防止调用方直接改内部数据。
  } // 结束 getGrid。
  getGivens() { // 提供读取 givens 掩码的方法。
    return cloneMask(this.givens) // 返回 givens 副本，防止外部篡改。
  } // 结束 getGivens。
  hasConflict(row, col, value) { // 判断在指定位置放置某值是否冲突。
    for (let i = 0; i < SUDOKU_SIZE; i++) { // 用一个循环同时检查同行与同列。
      if (i !== col && this.grid[row][i] === value) return true // 同行出现相同值且不是自身列，则冲突。
      if (i !== row && this.grid[i][col] === value) return true // 同列出现相同值且不是自身行，则冲突。
    } // 结束行列冲突检查。
    const startRow = Math.floor(row / BOX_SIZE) * BOX_SIZE // 计算所在 3x3 宫的起始行。
    const startCol = Math.floor(col / BOX_SIZE) * BOX_SIZE // 计算所在 3x3 宫的起始列。
    for (let r = startRow; r < startRow + BOX_SIZE; r++) { // 遍历所在宫的每一行。
      for (let c = startCol; c < startCol + BOX_SIZE; c++) { // 遍历所在宫的每一列。
        if ((r !== row || c !== col) && this.grid[r][c] === value) { // 若宫内其他位置已有相同值。
          return true // 发现宫冲突，立即返回 true。
        } // 结束宫内单元检查。
      } // 结束宫内列循环。
    } // 结束宫内行循环。
    return false // 未发现任何冲突，返回 false。
  } // 结束 hasConflict。
  isValidMove(move) { // 对外提供“该步是否合法”的安全判断接口。
    try { // 使用 try 捕获格式错误与范围错误。
      const { row, col, value } = Sudoku.normalizeMove(move) // 标准化并校验传入 move。
      if (this.givens[row][col] && value !== this.grid[row][col]) { // 若目标格是 givens 且尝试改成不同值。
        return false // 该操作非法，返回 false。
      } // 结束 givens 限制检查。
      if (value === 0) return true // 清空格子（填 0）在规则上允许。
      return !this.hasConflict(row, col, value) // 非 0 时要求无冲突，结果取反后返回。
    } catch { // 捕获任何校验异常。
      return false // 异常表示 move 非法，返回 false。
    } // 结束异常处理。
  } // 结束 isValidMove。
  validate() { // 校验当前整盘棋是否合法。
    const invalidCells = [] // 收集所有违规坐标（字符串形式 row,col）。
    for (let row = 0; row < SUDOKU_SIZE; row++) { // 遍历每一行。
      for (let col = 0; col < SUDOKU_SIZE; col++) { // 遍历每一列。
        const value = this.grid[row][col] // 读取当前格子值。
        if (value !== 0 && this.hasConflict(row, col, value)) { // 非空且存在冲突即为违规格子。
          invalidCells.push(`${row},${col}`) // 记录违规位置。
        } // 结束单元格合法性判断。
      } // 结束列循环。
    } // 结束行循环。
    return { // 返回整体校验结果对象。
      valid: invalidCells.length === 0, // 当违规列表为空时，整体为合法。
      invalidCells, // 附带全部违规坐标列表。
    } // 结束返回对象。
  } // 结束 validate。
  guess(move) { // 执行一次实际落子（会修改内部棋盘）。
    const { row, col, value } = Sudoku.normalizeMove(move) // 先标准化并校验 move。
    if (this.givens[row][col] && value !== this.grid[row][col]) { // 若试图修改题目给定格为其他值。
      throw new Error(`cell (${row}, ${col}) is a given and cannot be changed`) // 抛出错误阻止修改 givens。
    } // 结束 givens 修改限制。
    if (value !== 0 && this.hasConflict(row, col, value)) { // 若填入非 0 且会产生冲突。
      throw new Error(`move (${row}, ${col})=${value} conflicts with current board`) // 抛出错误提示冲突。
    } // 结束冲突检查。
    this.grid[row][col] = value // 校验通过后更新棋盘对应格子。
  } // 结束 guess。
  clone() { // 创建当前 Sudoku 实例的深拷贝。
    return new Sudoku(this.grid, { givens: this.givens }) // 使用当前 grid 与 givens 构造新对象。
  } // 结束 clone。
  toJSON() { // 将实例序列化为普通对象。
    return { // 返回可 JSON 化的数据结构。
      grid: cloneGrid(this.grid), // 导出棋盘副本。
      givens: cloneMask(this.givens), // 导出 givens 副本。
    } // 结束返回对象。
  } // 结束 toJSON。
  toString() { // 将棋盘渲染成带边框的文本。
    let out = '╔═══════╤═══════╤═══════╗\n' // 初始化顶部边框字符串。
    for (let row = 0; row < SUDOKU_SIZE; row++) { // 逐行生成文本内容。
      if (row !== 0 && row % BOX_SIZE === 0) { // 在每个宫分隔行插入横向分隔线。
        out += '╟───────┼───────┼───────╢\n' // 追加中间分隔边框。
      } // 结束分隔线判断。
      for (let col = 0; col < SUDOKU_SIZE; col++) { // 逐列拼接当前行文本。
        if (col === 0) { // 当前列是本行第一列。
          out += '║ ' // 添加左侧粗边框。
        } else if (col % BOX_SIZE === 0) { // 到达宫边界列。
          out += '│ ' // 添加宫间竖分隔符。
        } // 结束列边框判断。
        out += (this.grid[row][col] === 0 ? '·' : this.grid[row][col]) + ' ' // 空格显示为点，其余显示数字并补空格。
        if (col === SUDOKU_SIZE - 1) { // 若已到本行最后一列。
          out += '║' // 添加右侧粗边框。
        } // 结束右边框判断。
      } // 结束列循环。
      out += '\n' // 每行结束后追加换行。
    } // 结束行循环。
    out += '╚═══════╧═══════╧═══════╝' // 追加底部边框。
    return out // 返回完整棋盘字符串。
  } // 结束 toString。
  static fromJSON(json) { // 定义从 JSON 对象反序列化 Sudoku 的静态方法。
    if (!json || typeof json !== 'object') { // 若 json 不存在或不是对象。
      throw new TypeError('json must be an object') // 抛出类型错误提示入参不合法。
    } // 结束 JSON 入参检查。
    return new Sudoku(json.grid, { givens: json.givens }) // 用 json 中的 grid 与 givens 创建 Sudoku 实例。
  } // 结束静态 fromJSON。
} // 结束 Sudoku 类定义。
export function createSudoku(input) { // 导出工厂函数：从二维数组创建 Sudoku。
  return new Sudoku(input) // 返回新的 Sudoku 实例。
} // 结束 createSudoku。
export function createSudokuFromJSON(json) { // 导出工厂函数：从 JSON 恢复 Sudoku。
  return Sudoku.fromJSON(json) // 调用类静态方法完成反序列化。
} // 结束 createSudokuFromJSON。