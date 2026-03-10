# lib 模块说明

`src/lib/` 存放轻量、可复用、与具体业务解耦的基础工具。

## 当前文件

- `utils.ts`
  - 提供 `cn(...inputs)`，用于组合 `clsx` 与 `tailwind-merge`

## 使用场景

当组件中需要：

- 条件 class 拼接
- Tailwind class 去重

统一使用 `cn()`，避免在各处重复引入 `clsx` 和 `tailwind-merge`。
