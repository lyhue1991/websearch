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