# Websearch CLI 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建一个基于 Exa AI MCP 端点的网页搜索 CLI 工具，无需 API Key，支持 json/markdown/table 三种输出格式。

**Architecture:** 极简单文件架构，index.ts 包含 CLI 定义、API 调用、输出格式化；types.ts 包含类型定义。使用原生 fetch 调用 Exa AI MCP 端点，解析 SSE 响应。

**Tech Stack:** TypeScript, Node.js >= 18, commander, chalk, ora, cli-table3

---

## 文件结构

```
/Users/liangyun/Codes/websearch/
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript 配置
├── README.md              # 使用文档
└── src/
    ├── types.ts           # 类型定义
    └── index.ts           # 入口 + CLI + 搜索逻辑
```

---

### Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`

- [ ] **Step 1: 初始化 npm 项目**

```bash
cd /Users/liangyun/Codes/websearch && npm init -y
```

Expected: 生成 package.json

- [ ] **Step 2: 修改 package.json 配置**

编辑 `package.json`：

```json
{
  "name": "@lyhue1991/websearch",
  "version": "0.1.0",
  "description": "基于 Exa AI 的网页搜索命令行工具，无需 API Key",
  "type": "module",
  "bin": {
    "websearch": "dist/index.js"
  },
  "files": [
    "dist"
  ],
  "engines": {
    "node": ">=18"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx src/index.ts"
  },
  "keywords": [
    "websearch",
    "exa",
    "cli"
  ],
  "license": "MIT",
  "publishConfig": {
    "access": "public"
  },
  "dependencies": {
    "chalk": "^5.4.1",
    "cli-table3": "^0.6.5",
    "commander": "^12.1.0",
    "ora": "^8.2.0"
  },
  "devDependencies": {
    "@types/node": "^22.13.14",
    "tsx": "^4.19.3",
    "typescript": "^5.8.2"
  }
}
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: 安装依赖**

```bash
cd /Users/liangyun/Codes/websearch && npm install
```

Expected: 安装成功，生成 node_modules 和 package-lock.json

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tsconfig.json
git commit -m "chore: init project with dependencies"
```

---

### Task 2: 类型定义

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: 创建类型定义文件**

创建 `src/types.ts`：

```typescript
export type OutputFormat = 'json' | 'markdown' | 'table';
export type SearchType = 'auto' | 'fast' | 'deep';

export interface SearchOptions {
  query: string;
  count: number;
  format: OutputFormat;
  type: SearchType;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet?: string;
}

export interface McpRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: {
    name: string;
    arguments: {
      query: string;
      type: SearchType;
      numResults: number;
    };
  };
}

export interface McpResponse {
  jsonrpc: string;
  result?: {
    content: Array<{
      type: string;
      text: string;
    }>;
  };
}

export class CliError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = 'CliError';
    this.exitCode = exitCode;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add type definitions"
```

---

### Task 3: CLI 入口与参数解析

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: 创建 CLI 框架**

创建 `src/index.ts`：

```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import {
  type SearchOptions,
  type OutputFormat,
  type SearchType,
  type SearchResult,
  type McpRequest,
  type McpResponse,
  CliError
} from './types.js';

const API_URL = 'https://mcp.exa.ai/mcp';
const DEFAULT_COUNT = 8;
const MAX_COUNT = 20;
const TIMEOUT_MS = 25000;

function parseCount(value: string): number {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 1 || num > MAX_COUNT) {
    throw new CliError(`count 必须是 1 到 ${MAX_COUNT} 之间的整数。`);
  }
  return num;
}

function parseFormat(value: string): OutputFormat {
  const normalized = value.toLowerCase() as OutputFormat;
  if (!['json', 'markdown', 'table'].includes(normalized)) {
    throw new CliError(`不支持的输出格式: ${chalk.yellow(value)}，可选值为 json、markdown、table。`);
  }
  return normalized;
}

function parseType(value: string): SearchType {
  const normalized = value.toLowerCase() as SearchType;
  if (!['auto', 'fast', 'deep'].includes(normalized)) {
    throw new CliError(`不支持的搜索类型: ${chalk.yellow(value)}，可选值为 auto、fast、deep。`);
  }
  return normalized;
}

async function run(argv: string[]): Promise<void> {
  const program = new Command();

  program
    .name('websearch')
    .description('基于 Exa AI 的网页搜索命令行工具')
    .version('0.1.0')
    .argument('<query>', '搜索关键词')
    .option('-c, --count <number>', '返回结果数量 (1-20)', parseCount, DEFAULT_COUNT)
    .option('-f, --format <format>', '输出格式 (json/markdown/table)', parseFormat, 'json')
    .option('-t, --type <type>', '搜索类型 (auto/fast/deep)', parseType, 'auto')
    .action(async (query: string, options: { count: number; format: OutputFormat; type: SearchType }) => {
      const searchOptions: SearchOptions = {
        query: query.trim(),
        count: options.count,
        format: options.format,
        type: options.type
      };

      if (!searchOptions.query) {
        throw new CliError('搜索关键词不能为空。');
      }

      await executeSearch(searchOptions);
    });

  try {
    await program.parseAsync(argv);
  } catch (error) {
    handleError(error);
  }
}

function handleError(error: unknown): never {
  if (error instanceof CliError) {
    process.stderr.write(`${error.message}\n`);
    process.exit(error.exitCode);
  }

  if (error instanceof Error) {
    process.stderr.write(`${error.message}\n`);
  } else {
    process.stderr.write('发生未知错误。\n');
  }

  process.exit(1);
}

// 占位函数，后续 Task 实现
async function executeSearch(options: SearchOptions): Promise<void> {
  console.log('搜索功能待实现', options);
}

run(process.argv);
```

- [ ] **Step 2: 测试 CLI 帮助**

```bash
cd /Users/liangyun/Codes/websearch && npm run dev -- --help
```

Expected: 显示帮助信息

- [ ] **Step 3: 测试参数验证**

```bash
cd /Users/liangyun/Codes/websearch && npm run dev -- "test query" -c 25
```

Expected: 错误提示 "count 必须是 1 到 20 之间的整数"

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: add CLI framework with argument parsing"
```

---

### Task 4: API 调用实现

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: 实现 executeSearch 函数**

替换 `src/index.ts` 中的占位函数，添加完整的搜索逻辑：

```typescript
async function executeSearch(options: SearchOptions): Promise<void> {
  const spinner = options.format !== 'json' && process.stderr.isTTY
    ? ora({ text: '正在搜索...', stream: process.stderr }).start()
    : undefined;

  try {
    const results = await searchWeb(options);
    spinner?.stop();
    const output = formatResults(results, options.format);
    process.stdout.write(`${output}\n`);
  } catch (error) {
    spinner?.fail('搜索失败');
    throw error;
  }
}

async function searchWeb(options: SearchOptions): Promise<SearchResult[]> {
  const request: McpRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'web_search_exa',
      arguments: {
        query: options.query,
        type: options.type,
        numResults: options.count
      }
    }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify(request),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new CliError(`搜索错误 (${response.status}): ${errorText}`);
    }

    const responseText = await response.text();
    return parseMcpResponse(responseText);
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new CliError('搜索请求超时，请稍后重试。');
    }

    throw error;
  }
}

function parseMcpResponse(responseText: string): SearchResult[] {
  const lines = responseText.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data: McpResponse = JSON.parse(line.substring(6));

      if (data.result?.content?.[0]?.text) {
        return parseSearchResults(data.result.content[0].text);
      }
    }
  }

  return [];
}

function parseSearchResults(text: string): SearchResult[] {
  const results: SearchResult[] = [];

  // Exa 返回的格式是标题、URL、摘要的文本块
  // 格式类似：
  // Title: xxx
  // URL: xxx
  // Content: xxx
  //
  // Title: xxx
  // ...

  const blocks = text.split(/\n\n+/);

  for (const block of blocks) {
    const titleMatch = block.match(/Title:\s*(.+)/);
    const urlMatch = block.match(/URL:\s*(.+)/);
    const contentMatch = block.match(/Content:\s*([\s\S]+?)(?=\n[A-Z][a-z]+:|$)/);

    if (titleMatch && urlMatch) {
      results.push({
        title: titleMatch[1].trim(),
        url: urlMatch[1].trim(),
        snippet: contentMatch?.[1]?.trim()
      });
    }
  }

  return results;
}
```

- [ ] **Step 2: 测试搜索功能**

```bash
cd /Users/liangyun/Codes/websearch && npm run dev -- "TypeScript tutorial" -c 3 -f json
```

Expected: 返回 JSON 格式的搜索结果

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: implement Exa AI MCP search"
```

---

### Task 5: 输出格式化

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: 实现 formatResults 函数**

在 `src/index.ts` 中添加格式化函数：

```typescript
function formatResults(results: SearchResult[], format: OutputFormat): string {
  if (format === 'json') {
    return JSON.stringify(results, null, 2);
  }

  if (results.length === 0) {
    return '未找到相关结果。';
  }

  if (format === 'markdown') {
    return results
      .map((result, index) => {
        const lines = [`## ${index + 1}. ${result.title}`, `[${result.url}](${result.url})`];
        if (result.snippet) {
          lines.push(result.snippet);
        }
        return lines.join('\n');
      })
      .join('\n\n');
  }

  // table format
  const table = new Table({
    head: ['标题', 'URL', '摘要'],
    wordWrap: true,
    colWidths: [30, 40, 50]
  });

  for (const result of results) {
    const snippet = result.snippet
      ? result.snippet.length > 50
        ? result.snippet.substring(0, 50) + '...'
        : result.snippet
      : '';
    const title = result.title.length > 28
      ? result.title.substring(0, 28) + '...'
      : result.title;
    table.push([title, result.url, snippet]);
  }

  return table.toString();
}
```

- [ ] **Step 2: 测试 markdown 格式**

```bash
cd /Users/liangyun/Codes/websearch && npm run dev -- "AI news 2025" -c 3 -f markdown
```

Expected: 返回 Markdown 格式的搜索结果

- [ ] **Step 3: 测试 table 格式**

```bash
cd /Users/liangyun/Codes/websearch && npm run dev -- "React hooks" -c 3 -f table
```

Expected: 返回表格格式的搜索结果

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: add output formatting (json/markdown/table)"
```

---

### Task 6: 构建与测试

**Files:**
- Modify: `package.json` (add test script)

- [ ] **Step 1: 构建项目**

```bash
cd /Users/liangyun/Codes/websearch && npm run build
```

Expected: 生成 dist/ 目录

- [ ] **Step 2: 测试构建产物**

```bash
cd /Users/liangyun/Codes/websearch && node dist/index.js "test" -c 1
```

Expected: 正常执行搜索

- [ ] **Step 3: 测试全局链接**

```bash
cd /Users/liangyun/Codes/websearch && npm link
```

Expected: 创建全局 websearch 命令

- [ ] **Step 4: 测试全局命令**

```bash
websearch "hello world" -c 1 -f json
```

Expected: 正常执行搜索

- [ ] **Step 5: Commit**

```bash
git add dist/
git commit -m "build: compile TypeScript"
```

---

### Task 7: 文档

**Files:**
- Create: `README.md`

- [ ] **Step 1: 创建 README.md**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```

---

### Task 8: 发布准备

- [ ] **Step 1: 确保 .gitignore**

```bash
cd /Users/liangyun/Codes/websearch && echo -e "node_modules/\ndist/\n*.log\n.DS_Store" > .gitignore
```

- [ ] **Step 2: 最终构建测试**

```bash
cd /Users/liangyun/Codes/websearch && npm run build && node dist/index.js "test search" -c 2 -f json
```

Expected: 正常返回搜索结果

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: add gitignore"
```

- [ ] **Step 4: 发布到 npm（可选）**

```bash
npm login
npm publish
```

Expected: 发布成功

---

## 完成检查

- [ ] `websearch <query>` 基础搜索正常
- [ ] `websearch <query> -c 5` 参数生效
- [ ] `websearch <query> -f markdown` 输出格式正确
- [ ] `websearch <query> -f table` 表格显示正常
- [ ] `websearch <query> --type deep` 搜索类型生效
- [ ] 错误提示清晰友好
- [ ] README 文档完整