---
name: websearch
description: 网页搜索工具。使用 websearch CLI 通过 Exa AI MCP 端点搜索网页内容。触发场景：用户要求网页搜索、互联网搜索、查新闻、查资料、查教程、做主题调研、获取公开网页信息、需要结构化搜索结果。
---

# websearch

**封装** `websearch` **命令行工具，基于 Exa AI MCP 端点的网页搜索。**

## 核心能力

1. **网页搜索** - 查询公开网页与资讯内容，无需 API Key
2. **搜索类型** - 支持 auto（自动）、fast（快速）、deep（深度）三种模式
3. **多格式输出** - 支持 JSON、Markdown、表格
4. **开箱即用** - 无需配置，安装即可使用

## 工作流程

### 🔍 执行网页搜索

当用户表达搜索、查资料、查新闻、做调研意图时，尝试执行如下搜索命令：

```bash
websearch "关键词" --format json --count 10
```

视需要也可以使用如下常见用法：

```bash
websearch "人工智能" --count 10 --format json # 搜索关键词，返回前10条结果，格式为JSON
websearch "最新新闻" --format markdown # 搜索新闻，格式为Markdown便于阅读
websearch "机器学习教程" -c 5 -f table # 搜索教程，表格形式展示
websearch "深度研究报告" --type deep -c 10 # 深度搜索，返回更多结果
```

### 🛠️ 错误排查

如果执行失败，首先检查是否安装 `websearch`：

**Step 1: 检查是否安装 websearch**

```bash
command -v websearch
```

如果未安装，执行：

```bash
npm install -g @lyhue1991/websearch
```

或使用 npx 直接运行：

```bash
npx @lyhue1991/websearch "搜索关键词"
```

**Step 2: 网络问题排查**

如果遇到网络超时或 SSL 证书错误，可以尝试：

```bash
websearch "测试关键词" --insecure
```

### 📄 输出适合阅读的结果

当用户需要直接阅读或复制结果时：

```bash
websearch "Node.js" --format markdown
websearch "Python 教程" --count 10 --format table
```

### 🔬 深度搜索

当用户需要更全面的搜索结果时：

```bash
websearch "人工智能发展现状" --type deep --count 15
```

## 参数说明

| 参数 | 短参数 | 说明 |
|---|---|---|
| `query` | - | 搜索关键词，必填 |
| `--count <number>` | `-c` | 返回结果数量，范围 1-20，默认 8 |
| `--format <format>` | `-f` | 输出格式，支持 `json`、`markdown`、`table`，默认 json |
| `--type <type>` | `-t` | 搜索类型，支持 `auto`、`fast`、`deep`，默认 auto |
| `--insecure` | `-k` | 跳过 SSL 证书验证，适用于代理环境 |

## 注意事项

1. **优先用 JSON** - 需要进一步分析、提取字段、总结内容时，优先使用 `--format json`
2. **无需认证** - 基于 Exa AI 公开 MCP 端点，无需配置 API Key
3. **结果数量限制** - 最多返回 20 条结果，默认 8 条
4. **代理环境** - 在代理环境下遇到 SSL 问题，可使用 `--insecure` 参数
5. **超时处理** - 搜索请求超时时间为 25 秒，超时会返回错误提示

## 快速参考

```bash
# 查看帮助
websearch --help

# 基础搜索
websearch "人工智能" --format json

# 指定结果数量
websearch "TypeScript 教程" --count 5 --format json

# Markdown 格式输出
websearch "React 最佳实践" --format markdown

# 深度搜索
websearch "机器学习" --type deep --count 10 --format table

# 代理环境使用
websearch "测试关键词" --insecure

# 使用 npx 运行
npx @lyhue1991/websearch "搜索关键词"
```