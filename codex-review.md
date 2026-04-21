# con-oo-gao-xing-li - Review

## Review 结论

当前实现已经把 `Sudoku` / `Game` 接进了真实 Svelte 流程，开始游戏、输入、撤销/重做和界面刷新都有明确接点；但接入质量仍然是中等。主要问题不在“有没有接上”，而在领域语义和 UI 语义没有完全对齐：非法输入被吞掉却仍可能写入历史，冲突高亮这条业务链路事实上走不通，且 givens 仍由领域对象外的 store 维护，削弱了 OOD 完整性。

## 总体评价

| 维度 | 评价 |
| --- | --- |
| OOP | good |
| JS Convention | fair |
| Sudoku Business | fair |
| OOD | fair |

## 缺点

### 1. 失败落子仍会进入 Undo 历史

- 严重程度：core
- 位置：src/domain/game.js:40-44; src/node_modules/@sudoku/stores/grid.js:101-110
- 原因：`Game.guess()` 在真正调用 `this.current.guess(move)` 之前就先把当前快照压入 `past`。而 Svelte 适配层 `userGrid.set()` 会吞掉领域层抛出的异常，因此“改 givens”“冲突输入”等失败操作虽然不会改盘面，却会污染历史栈，导致 undo/redo 语义失真。

### 2. 冲突校验与冲突展示的业务语义相互打架

- 严重程度：core
- 位置：src/domain/sudoku.js:151-163; src/node_modules/@sudoku/stores/grid.js:97-110; src/components/Board/index.svelte:51
- 原因：`Sudoku.guess()` 直接拒绝带冲突的输入，适配层又把异常静默忽略；但界面同时维护了 `invalidCells` 和 `conflictingNumber` 高亮链路。结果是 UI 明明设计了“显示冲突格”的能力，正常用户输入却几乎不可能触发这条路径，业务反馈被截断。

### 3. givens 被复制到领域对象之外，形成第二数据源

- 严重程度：major
- 位置：src/node_modules/@sudoku/stores/grid.js:33-63; src/components/Board/index.svelte:48-51; src/domain/sudoku.js:94-96
- 原因：`Sudoku` 已经持有 `givens` 并提供 `getGivens()`，但真实渲染时 Board 仍依赖独立的 `puzzleGridStore` 来判断哪些格子是用户可填、哪些格子参与冲突高亮。这样 view 并没有完整消费领域对象导出的状态，而是把同一业务事实拆成两份状态维护，增加了一致性风险。

### 4. 跨层用字符串坐标且坐标顺序不一致

- 严重程度：major
- 位置：src/domain/sudoku.js:133-147; src/node_modules/@sudoku/stores/grid.js:25-31
- 原因：`Sudoku.validate()` 返回的是 `"row,col"` 字符串，Board 层消费的是 `"x,y"` / `"col,row"` 语义，适配层不得不专门翻转一次坐标。这个协议既不类型安全，也把 view 的坐标约定泄漏进了领域接口，属于典型的 stringly-typed 设计。

### 5. 领域层直接引用 `../node_modules` 路径，不符合常见 JS 模块习惯

- 严重程度：minor
- 位置：src/domain/sudoku.js:1
- 原因：在源码中硬编码 `../node_modules/@sudoku/constants.js` 对目录结构过于敏感，可移植性和可维护性都偏弱。按 JS 生态惯例更适合走正常的包名/别名解析，而不是把 `node_modules` 路径写进业务源码。

## 优点

### 1. Sudoku 封装边界清晰，防御性复制做得比较到位

- 位置：src/domain/sudoku.js:53-60; src/domain/sudoku.js:90-96; src/domain/sudoku.js:165-173
- 原因：构造、读取、克隆、序列化都避免直接暴露内部二维数组和 givens mask，能有效防止 UI 或外层逻辑意外篡改领域对象内部状态，这一点符合 OOP 封装原则。

### 2. 历史管理被放在 Game，而不是散落在组件里

- 位置：src/domain/game.js:20-58
- 原因：`Game` 统一持有当前 `Sudoku`、`past`、`future`，并提供 `guess/undo/redo/canUndo/canRedo`。这让撤销重做成为应用服务层职责，而不是 UI 事件处理器职责，职责边界总体是合理的。

### 3. 采用了 Svelte store adapter，而不是让组件直接改二维数组

- 位置：src/node_modules/@sudoku/stores/grid.js:42-64; src/node_modules/@sudoku/stores/grid.js:93-145
- 原因：适配层用 `currentGame` 持有领域对象，再把 `userGrid`、`invalidCells`、`canUndo`、`canRedo` 外表化为 store，修改后通过 `syncFromDomainGame()` 显式同步到响应式状态。这是符合本次作业推荐方向的接法。

### 4. 真实游戏流程已经改为通过服务/适配层进入领域对象

- 位置：src/components/Controls/Keyboard.svelte:10-25; src/components/Controls/ActionBar/Actions.svelte:13-28; src/node_modules/@sudoku/game.js:13-34; src/components/Modal/Types/Welcome.svelte:16-24
- 原因：开始新局、导入题目、键盘输入、提示、撤销、重做都不是直接改组件内数组，而是经过 `grid`/`userGrid`/`game` 这些入口转发到领域对象，说明接入并非只停留在测试代码中。

## 补充说明

- 本次结论仅基于静态阅读：重点审查了 `src/domain/*`、`src/node_modules/@sudoku/stores/grid.js`、`src/node_modules/@sudoku/game.js` 以及直接消费这些 store/服务的 Svelte 组件；没有运行测试，也没有实际启动页面验证运行时行为。
- 关于“失败操作进入历史”“冲突高亮链路不可达”等结论，来自对 `Game.guess()`、`Sudoku.guess()` 与 `userGrid.set()` 控制流的静态推导，而非运行期观测。
- 未扩展评审到无关目录；例如求解器、生成器和其他通用组件本身的实现质量，不作为本次结论依据。
