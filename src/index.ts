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

function formatResults(results: SearchResult[], format: OutputFormat): string {
  return JSON.stringify(results, null, 2);
}

run(process.argv);