# oo-gao-xing-li - Review

## Review 结论

代码已经抽出了 Sudoku 和 Game 两个核心对象，基础的快照式 Undo/Redo 骨架也存在，但当前设计在反序列化恢复、对象封装边界和数独业务规则建模上都有明显缺口，整体更像“矩阵包装器 + 历史快照容器”，距离高质量的领域对象设计还有差距。

## 总体评价

| 维度 | 评价 |
| --- | --- |
| OOP | fair |
| JS Convention | fair |
| Sudoku Business | poor |
| OOD | fair |

## 缺点

### 1. Game 的反序列化没有真正恢复历史状态

- 严重程度：core
- 位置：src/domain/game.js:7-10,49-56
- 原因：createGameFromJSON() 传入了 history，但 createGame() 只接收 sudoku 并重新把 past/future 初始化为空数组，导致从 JSON 恢复后的游戏丢失 Undo/Redo 历史。这样会直接破坏“保存/恢复后继续撤销重做”的核心业务，也说明序列化协议与对象构造协议没有对齐。

### 2. Game 暴露了可变的 Sudoku 实例，破坏会话对象边界

- 严重程度：major
- 位置：src/domain/game.js:13-19
- 原因：getSudoku() 返回的是当前 live Sudoku 对象本身，而 createGame() 也直接持有外部传入的 sudoku 引用。调用方如果绕过 game.guess() 直接对 sudoku.guess() 进行修改，就不会记录历史、也不会清空 redo，导致 Game 作为“UI 与领域层主入口”的职责失效。这是典型的封装泄漏。

### 3. Sudoku 没有承担数独领域规则校验职责

- 严重程度：major
- 位置：src/domain/sudoku.js:12-14
- 原因：guess() 只是无条件写入 grid[row][col]，没有检查坐标范围、数值范围、行列宫冲突，也没有任何局面校验接口。按作业要求，Sudoku 应承担局面校验能力；按数独业务，领域对象至少应能表达当前局面是否合法或提供校验方法。现在的实现只是在存二维数组，业务语义过弱。

### 4. 领域模型没有区分 givens、玩家输入和局面状态

- 严重程度：major
- 位置：src/domain/sudoku.js:5-28
- 原因：当前 Sudoku 只持有一个 grid，无法表达哪些格子是题面固定数、哪些格子可编辑，也无法表达完成态、冲突态等业务状态。这会使“是否允许改写初始题面”“是否已完成一局”这类核心业务问题在模型内无处落脚，说明对象建模还停留在数据容器层。

### 5. 工厂函数和反序列化入口缺少输入约束校验

- 严重程度：minor
- 位置：src/domain/sudoku.js:5-6,27-28
- 原因：createSudoku() 和 createSudokuFromJSON() 默认信任输入一定是合法 9x9 grid，既不校验维度，也不校验元素是否合法。这不符合常见 JS 领域对象的 fail-fast 惯例，错误会延后到运行时的任意位置才暴露。

## 优点

### 1. 对 grid 做了防御性复制，避免了直接共享二维数组

- 位置：src/domain/sudoku.js:1-3,9-10,18-19
- 原因：cloneGrid() 在创建、读取和序列化时都复制了每一行，避免调用方直接拿到内部 grid 后原地修改，这一点对二维数组这种容易出现浅拷贝问题的数据结构是必要的。

### 2. Undo/Redo 的状态机骨架清晰

- 位置：src/domain/game.js:16-20,21-38
- 原因：guess() 先保存过去快照、再修改当前局面，并在新输入后清空 future；undo()/redo() 也使用 past/future 双栈切换当前状态。这套流程在静态阅读上是自洽的，符合常见撤销重做模型。

### 3. Game 的序列化显式包含当前局面和历史栈

- 位置：src/domain/game.js:39-44
- 原因：toJSON() 没有只保存当前 Sudoku，而是把 sudoku、past、future 一并导出，说明作者已经意识到“游戏会话”和“单个局面”不是同一个层次，这个方向是正确的。

### 4. 统一导出接口与作业要求对齐

- 位置：src/domain/index.js:1-9
- 原因：index.js 暴露了 createSudoku、createSudokuFromJSON、createGame、createGameFromJSON 四个工厂函数，接口边界清楚，便于测试和 UI 调用。

### 5. Sudoku 提供了基本可读的文本外表化

- 位置：src/domain/sudoku.js:21-23
- 原因：toString() 至少会输出当前 9x9 网格内容，而不是退化成默认的 [object Object]，满足了最基本的调试可读性要求。

## 补充说明

- 本次结论仅基于对 src/domain/sudoku.js、src/domain/game.js、src/domain/index.js 的静态阅读，未运行测试，也未审查 UI 层和其他目录。
- 关于 Undo/Redo、序列化/反序列化是否完整可用的判断，来自静态代码路径分析，而非实际执行结果。
- 关于“是否符合数独游戏业务”的判断，主要依据作业要求中“Sudoku 应提供局面校验能力”和数独常见领域约束；当前代码中未看到这些规则被显式建模。
- 未审查 DESIGN.md，因此不对设计文档是否自洽给出结论。
