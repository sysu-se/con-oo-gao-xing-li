## HW 问题收集

列举在HW 1、HW1.1过程里，你所遇到的2\~3个通过自己学习已经解决的问题，和2\~3个尚未解决的问题与挑战

### 已解决

1. “订阅”是什么意思？subscribe是什么东西？
   1. 上下文：copilot说：“store 是“可订阅的状态容器”。它至少有 subscribe 方法，常见类型有：”
   2. 解决手段：继续询问copilot
2. sotre的职责是什么？
   1. 解决手段：继续询问copilot
3. 各种语法的疑惑，js有些代码看不太懂
   1. 解决手段：让copilot用agent模式在相应位置写详细注释，辅助网页搜索相关知识理解。
   

### 未解决

1. 为什么 `try/catch` 静默忽略异常是否合理？
   1. 上下文：`grid.js` 中 `userGrid.set` 和 `applyHint` 里对 `currentGame.guess` 都是 `try/catch` 后忽略异常。
   2. 尝试解决手段：询问copilot但是未能理解
   

2. 频繁 clone 会不会有性能开销？在这个项目规模下有没有必要做优化？
   1. 上下文: `game.js`
`getSudoku` 返回的是 `current.clone()`。
   1. 尝试解决手段：询问copilot但是未能理解

1. `notes` 模式下为何先改候选再写 `userGrid.set(..., 0)`？
   1. 上下文：`Keyboard.svelte` 中数字输入、删除输入最终都走 `userGrid.set`。
   2. 尝试解决手段：询问copilot但是未能理解