# Sudoku/Game 领域对象设计说明

## 1. `Sudoku` / `Game` 的职责边界

- **Sudoku**  
  `Sudoku`（或 Board）负责持有、操作和序列化一个 9x9 的数独盘面。  
  其主要职责为：  
  - 存储和管理 grid 数组
  - 提供 `guess(move)` 方法修改指定格子值
  - 生成当前盘面的快照：`toJSON()`、`clone()`、`toString()`
  - 防止外部代码对 grid 做直接修改（所有输出均深拷贝）

- **Game**  
  `Game` 对象负责“一局游戏”的整体流程，包括：
  - 持有当前的 `Sudoku` 对象
  - 维护历史快照（实现 Undo/Redo 操作）
  - 封装当前交互入口，例如 `guess(move)`, `undo()`,`redo()`
  - 实现整局的序列化/反序列化，便于保存和恢复状态

两者职责清晰分离：  
**Sudoku 是盘面、Game 是流程和历史**，UI 与领域对象彻底隔离。

---

## 2. `Move` 是值对象还是实体对象？为什么？

**Move 是值对象。**

它只是一个单纯的数据包，仅包含 `row`, `col`, `value`，  
没有唯一标识、没有生命周期或复杂行为，不区分同内容的不同对象。  
只要内容一致就是同一个 move，这符合值对象定义，结构简单高效。

---

## 3. history 中存储的是什么？为什么？

**history/past 和 future 里都存储的是 Sudoku 盘面的 JSON快照（对象结构为 { grid: [...] })**

原因如下：
- 存快照比只存 move 更易实现正确 undo/redo，避免复杂的逆向操作，还能轻松支持 redo。
- 避免了浅拷贝带来的 bug，每次都能准确恢复到某一步的实际盘面。
- 配合 clone 与深拷贝保证没有历史污染。

当前设计为：
- `past`: 每步落子前的 Sudoku 状态快照（数组）
- `future`: undo 后 redo 所用快照
- `current`: 当前实际的 Sudoku 对象

---

## 4. 你的复制策略是什么？哪些地方需要深拷贝？

### 复制策略

- **外部输入（createSudoku时）**：对传入的 grid 做深拷贝，防止外部篡改影响内部状态。
- **getGrid()**：输出时再次深拷贝，防止 UI 层“拿到引用能改内部盘面”。
- **clone()**：生产一个全新的 Sudoku 实例，内部 grid 全新拷贝，历史互不影响。
- **Game 的历史栈**：每一步存储的都是完整的 Sudoku 状态(快照)，避免“浅拷贝历��污染每一步”。
- **toJSON()**：生成快照（plain object），不留引用。

### 如果误用浅拷贝的后果

比如克隆 sudoku 时浅拷贝，两个盘面共享同一个 grid 数组，就会出现“改了一个历史也跟着变，undo/redo 错误”——这是常见的大 bug。  
只有做到“每个快照/副本均为独立深拷贝”才能保证正确性。

---

## 5. 你的序列化 / 反序列化设计是什么？

- **Sudoku**：  
  - `toJSON()` 输出 `{ grid: [...] }`，只包含盘面，无引用。
  - `createSudokuFromJSON(json)` 以 `{ grid: [...] }` 恢复内部状态。
- **Game**：  
  - `toJSON()` 输出 `{ sudoku: {...}, past: [...], future: [...] }`，全部为 plain 对象数��。
  - `createGameFromJSON(json)` 可恢复完整状态（当前盘面、undo/redo历史），通过分层调用前述方法。

### 哪些字段被序列化？
- Sudoku: grid 全部内容
- Game: 当前 sudoku、历史快照 past、未来快照 future

### 没被序列化的
- 任何执行中的内部临时变量、方法等逻辑对象没序列化，只需数据。

### 恢复流程
- 逐一按 plain-object 恢复各个 sudoku 实例，历史用快照数组一一 createSudokuFromJSON 重建。

---

## 6. 你的外表化接口是什么？为什么这样设计？

- **toString()**（Sudoku/Game 均有）：  
  - Sudoku：输出多行字符串，每行为一行 9 个数字，以便调试/可读，避免 `[object Object]`。
  - 可选加分：进一步美化为带边框/分区的表格。

- **toJSON()**:  
  - Sudoku/Game 均输出标准 ECMAScript 可序列化结构，用于持久化或测试。

这个设计一方面方便调试（肉眼可看），同时为序列化（持久化/网络）打下基础，做到了清晰、无副作用、易扩展。

---

## 加分项说明

- **round-trip 测试**（已实现）：  
  自动测试已覆盖，从 sudoku/game 的 toJSON 到 fromJSON 能无损恢复。
- **history 结构说明完善**：  
  选择快照方案，利于正确性和 redo，设计文档有解释理由。
- **toString 接口**（如需加分可加强美化）。

---

## 总结

- Sudoku 与 Game 边界清晰，各司其职，符合 OO 分析。
- 复制与历史管理均采用深拷贝与快照，保证 undo/redo 高可靠性。
- 所有外表化/序列化接口明确、易于调试。
- 通过全部测试，加分点部分覆盖。

如有更优方案/改进点，欢迎老师指正。
