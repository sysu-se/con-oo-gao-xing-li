# 领域对象接入设计说明

## 作业目标与方案概览

这次要解决的核心问题是：领域对象不能只在测试中存在，必须进入真实 Svelte 交互链路并驱动 UI 更新。

我采用的是 Store Adapter 方案。

一句话架构结论：View 消费 grid store（adapter 暴露的响应式状态），用户操作通过 userGrid 方法进入 Game/Sudoku，领域变化再由 adapter 同步回 store 触发 UI 刷新。

## 领域对象改进说明（对应作业 A）

### Sudoku 的职责边界

- 持有盘面状态：grid 与 givens。
- 负责规则校验：normalizeMove、hasConflict、isValidMove、validate。
- 负责落子行为：guess。
- 负责外表化与快照：getGrid、getGivens、clone、toJSON、toString。

### Game 的职责边界

- 持有当前 Sudoku。
- 管理历史快照：past/future。
- 对外提供游戏动作：guess、undo、redo。
- 提供能力查询：canUndo、canRedo。
- 提供整局序列化：toJSON/fromJSON。

### 相比 HW1 的实质改进

- 把 givens（不可改格）内聚进 Sudoku，避免 UI 或外层逻辑绕过规则。
- 增加 validate 输出冲突列表，为 UI 高亮提供领域级证据。
- Game 增加 canUndo/canRedo 与序列化恢复，能够稳定支撑真实界面按钮状态和状态持久化。

### 为什么 HW1 的做法不足以支持真实接入

- 如果只有“可测试对象”而无 adapter，同步时机和 UI 状态投影分散在组件里，容易退化成组件直接改数组。
- 仅靠组件内逻辑维护 undo/redo，无法保证历史、校验、渲染来源统一。

### 新设计的 trade-off

- 优点：Domain 保持框架无关、职责清晰，Svelte 只消费 adapter 暴露的数据。
- 代价：需要手动维护一次 Domain -> store 的同步（syncFromDomainGame），出现“双层状态”（Domain 真相源 + UI 投影视图）。

## View 层如何消费领域对象（对应作业十.A）

### View 直接消费的是谁

View 不直接 new Game/Sudoku，而是消费 stores/grid 提供的 grid、userGrid、invalidCells、canUndo、canRedo。

### View 拿到的响应式数据

- userGrid：当前可见盘面。
- grid：题面 givens 对应盘面。
- invalidCells：冲突格坐标（已转成 Board 需要的 x,y 形式）。
- canUndo/canRedo：动作按钮可用性。
- gameWon（derived）：由 userGrid + invalidCells 计算。

### 用户操作如何进入领域对象接口

- 键盘/按钮输入 -> userGrid.set(pos, value) -> currentGame.guess({ row, col, value })。
- 提示 -> userGrid.applyHint(pos) -> currentGame.guess(...)。

### Undo/Redo 如何进入 Game

- 按钮点击 -> userGrid.undo()/redo() -> currentGame.undo()/redo()。

### 领域对象变化后 UI 为什么会更新

- 每次领域动作后都调用 syncFromDomainGame。
- 该函数执行 userGridStore.set、invalidCells.set、canUndo.set、canRedo.set。
- 组件通过 $store 订阅这些 store，因此会自动重渲染。

## 响应式机制说明（对应作业十.B）

### 依赖的 Svelte 3 机制

- store 与 $store 自动订阅（主要机制）。
- 顶层 let（如 Welcome 中 difficulty/sencode）。
- $: 响应式语句（如 hintsAvailable、buttonDisabled、gameWon derived 计算链）。
- 重新赋值/调用 store.set 触发更新。

### 响应式暴露给 UI 的状态

- grid、userGrid、invalidCells、canUndo、canRedo、gameWon、gamePaused 等 store 状态。

### 留在领域对象内部的状态

- Game.current、Game.past、Game.future。
- Sudoku.grid、Sudoku.givens 及冲突判定细节。

### 为什么直接改对象内部字段不可靠

- Svelte 不会感知普通对象内部字段变化；若不通过 store.set 或顶层变量重赋值，订阅者不会收到更新。

### 为什么直接改二维数组元素可能不触发预期刷新

- 例如直接改 grid[y][x] 只改变内部元素，数组引用不变；没有触发 store.set 时，依赖该 store 的组件不会按预期刷新。

### 如何避免间接依赖导致的 $: 不触发风险

- 把 UI 所需状态集中为显式 store（userGrid、invalidCells、canUndo、canRedo）。
- 每次领域动作后统一调用 syncFromDomainGame 写入这些 store，避免依赖隐藏在对象深层字段。

## 五条真实流程逐条证明（对应作业五.B）

### 1) 开始一局游戏

- startNew/startCustom 调用 grid.generate 或 grid.decodeSencode。
- 二者最终进入 resetWithPuzzle。
- resetWithPuzzle 创建 createSudoku(baseGrid) 与 createGame({ sudoku })，并立即 syncFromDomainGame。

### 2) 界面渲染

- Board 组件通过 $userGrid 渲染每个格子数值。
- givens 与用户输入区分来自 $grid 与 $userGrid 的对比。
- 冲突高亮来自 $invalidCells。

### 3) 用户输入

- Keyboard 的数字按键与删除键调用 userGrid.set($cursor, num)。
- userGrid.set 内部调用 currentGame.guess。

### 4) Undo/Redo

- Actions 按钮点击调用 userGrid.undo 与 userGrid.redo。
- 内部分别转发到 currentGame.undo 与 currentGame.redo。

### 5) 自动刷新

- 所有领域变更后统一执行 syncFromDomainGame。
- syncFromDomainGame 的 store.set 是 UI 更新触发点。

## 反例与不合格做法对照（对应作业七）

### 为什么“领域对象只在测试里用”不合格

因为真实界面链路不会经过领域规则，无法证明接入成立。

### 为什么“旧数组换名字”不合格

只改命名不改变调用链，本质仍是组件直接改状态，不是领域对象驱动。

### 为什么“关键逻辑写在组件里”不合格

会导致规则分散、历史分散、可测试性变差，也难以保证一致行为。

### 我的实现如何规避

- 关键动作入口集中在 Game/Sudoku 与 stores/grid adapter。
- 组件只发事件，不实现规则与历史。
- UI 渲染状态由 adapter 从领域对象同步生成。

## 可验证证据

### 代码证据

- 领域核心：src/domain/sudoku.js、src/domain/game.js、src/domain/index.js。
- adapter 与接入主链：src/node_modules/@sudoku/stores/grid.js。
- 开局入口：src/node_modules/@sudoku/game.js、src/components/Modal/Types/Welcome.svelte。
- 输入链路：src/components/Controls/Keyboard.svelte。
- Undo/Redo 链路：src/components/Controls/ActionBar/Actions.svelte。
- 渲染链路：src/components/Board/index.svelte。

### 行为证据

- 开始新局后棋盘重置且可操作。
- 输入数字后对应格即时更新，冲突格可高亮。
- 点击 Undo/Redo 后盘面与按钮可用状态同步变化。

### 测试证据

- 合同与导出：tests/hw1/01-contract.test.js。
- Sudoku 基础行为：tests/hw1/02-sudoku-basic.test.js。
- 深拷贝与 clone：tests/hw1/03-clone.test.js。
- 历史能力：tests/hw1/04-game-undo-redo.test.js。
- 序列化恢复：tests/hw1/05-serialization.test.js。

### 已知限制与后续改进

- 目前 Game.guess 先 push past 再执行当前 guess；若 guess 抛错会留下冗余历史，可改为“先验证成功再入栈”或失败时回滚。
- userGrid.set/applyHint 捕获异常后静默忽略，后续可增加错误反馈（toast/提示文本）。

## 结论

这次改造后，领域对象已成为真实流程核心：规则、历史、状态演进都通过 Game/Sudoku 完成，不再只是测试对象。

响应式正确性满足作业要求：UI 更新由 store.set 触发，且触发点集中、可追踪。

若迁移到 Svelte 5，最稳定的是 Domain 层（src/domain）；最可能改动的是 adapter 与组件响应式写法（stores 与 .svelte 绑定方式）。
