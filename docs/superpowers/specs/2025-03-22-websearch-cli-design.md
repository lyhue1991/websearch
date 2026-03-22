# Websearch CLI 设计文档

## 概述

一个基于 Exa AI MCP 端点的网页搜索命令行工具，无需 API Key，开箱即用。

## 项目信息

| 项目 | 值 |
|------|-----|
| 包名 | `@lyhue1991/websearch` |
| 命令 | `websearch` |
| 版本 | `0.1.0` |
| Node 版本 | >= 18 |

## CLI 接口

### 命令格式

```bash
websearch <query> [options]
```

### 参数定义

| 参数 | 短参数 | 类型 | 默认值 | 说明 |
|------|--------|------|--------|------|
| `--count` | `-c` | number | 8 | 结果数量 (1-20) |
| `--format` | `-f` | string | json | 输出格式: json / markdown / table |
| `--type` | `-t` | string | auto | 搜索类型: auto / fast / deep |
| `--help` | `-h` | - | - | 显示帮助 |
| `--version` | `-v` | - | - | 显示版本 |

### 使用示例

```bash
websearch "AI news 2025"
websearch "TypeScript tutorial" -c 5
websearch "React best practices" -f markdown
websearch "machine learning" -c 10 -f table --type deep
```

## 架构设计

### 项目结构

```
websearch/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts      # 入口 + CLI + 搜索逻辑
    └── types.ts      # 类型定义
```

### 核心流程

```
用户输入 query
    │
    ▼
参数解析验证
    │
    ▼
构建 MCP 请求
    │
    ▼
POST https://mcp.exa.ai/mcp
    │
    ▼
解析 SSE 响应
    │
    ▼
格式化输出
    │
    ▼
打印结果
```

## API 集成

### Exa AI MCP 端点

- **URL**: `https://mcp.exa.ai/mcp`
- **协议**: MCP over HTTP (JSON-RPC 2.0 + SSE)
- **认证**: 无需 API Key

### 请求格式

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "web_search_exa",
    "arguments": {
      "query": "搜索关键词",
      "type": "auto",
      "numResults": 8
    }
  }
}
```

### 响应格式

SSE 格式，解析 `data:` 前缀的 JSON：

```
data: {"result": {"content": [{"type": "text", "text": "..."}]}}
```

### 超时控制

- 默认超时: 25 秒
- 使用 AbortController 实现

## 输出格式

### JSON（默认）

```json
[
  {
    "title": "结果标题",
    "url": "https://example.com",
    "snippet": "内容摘要..."
  }
]
```

### Markdown

```markdown
## 1. 结果标题
[https://example.com](https://example.com)
内容摘要...

## 2. 结果标题
...
```

### Table

```
┌────────────────────────────┬──────────────────┬─────────────────────────────┐
│ 标题                       │ URL              │ 摘要                        │
├────────────────────────────┼──────────────────┼─────────────────────────────┤
│ 结果标题                   │ https://...      │ 内容摘要...                 │
└────────────────────────────┴──────────────────┴─────────────────────────────┘
```

## 错误处理

| 错误场景 | 处理方式 | 退出码 |
|---------|---------|--------|
| query 为空 | 提示用法 | 1 |
| count 超出范围 | 提示有效范围 (1-20) | 1 |
| format 无效 | 提示可选值 (json/markdown/table) | 1 |
| type 无效 | 提示可选值 (auto/fast/deep) | 1 |
| 网络超时 | 提示超时，请重试 | 1 |
| API 返回错误 | 显示错误信息 | 1 |
| 无结果 | 显示 "未找到相关结果" | 0 |

## 依赖

### 生产依赖

| 包 | 版本 | 用途 |
|---|------|------|
| commander | ^12.1.0 | CLI 参数解析 |
| chalk | ^5.4.1 | 终端颜色 |
| ora | ^8.2.0 | 加载动画 |
| cli-table3 | ^0.6.5 | 表格输出 |

### 开发依赖

| 包 | 版本 | 用途 |
|---|------|------|
| typescript | ^5.8.2 | TypeScript 编译 |
| tsx | ^4.19.3 | 开发运行 |
| @types/node | ^22.13.14 | Node.js 类型 |

## 参考

- [OpenCode websearch 实现](https://github.com/anomalyco/opencode/blob/main/packages/opencode/src/tool/websearch.ts)
- [bdsearch CLI 架构](https://github.com/lyhue1991/bdsearch)
- [Exa AI MCP 文档](https://exa.ai)