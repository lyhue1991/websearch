# @lyhue1991/websearch

基于 Exa AI MCP 端点的网页搜索命令行工具，无需 API Key，开箱即用。

## 安装

```bash
npm install -g @lyhue1991/websearch
```

或使用 npx：

```bash
npx @lyhue1991/websearch "search query"
```

## 使用

```bash
websearch <query> [options]
```

### 参数

| 参数 | 短参数 | 类型 | 默认值 | 说明 |
|------|--------|------|--------|------|
| `--count` | `-c` | number | 8 | 结果数量 (1-20) |
| `--format` | `-f` | string | json | 输出格式: json / markdown / table |
| `--type` | `-t` | string | auto | 搜索类型: auto / fast / deep |
| `--insecure` | `-k` | boolean | false | 跳过 SSL 证书验证 |
| `--help` | `-h` | - | - | 显示帮助 |
| `--version` | `-v` | - | - | 显示版本 |

### 示例

```bash
# 基础搜索
websearch "AI news 2025"

# 指定结果数量
websearch "TypeScript tutorial" -c 5

# Markdown 格式输出
websearch "React best practices" -f markdown

# 深度搜索
websearch "machine learning" -c 10 -f table --type deep

# 跳过 SSL 证书验证（适用于代理环境）
websearch "test query" --insecure
```

### 输出格式

#### JSON（默认）

```json
[
  {
    "title": "结果标题",
    "url": "https://example.com",
    "snippet": "内容摘要..."
  }
]
```

#### Markdown

```markdown
## 1. 结果标题
[https://example.com](https://example.com)
内容摘要...
```

#### Table

```
┌────────────────────────────┬──────────────────┬─────────────────────────────┐
│ 标题                       │ URL              │ 摘要                        │
├────────────────────────────┼──────────────────┼─────────────────────────────┤
│ 结果标题                   │ https://...      │ 内容摘要...                 │
└────────────────────────────┴──────────────────┴─────────────────────────────┘
```

## License

MIT