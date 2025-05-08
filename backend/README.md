# MCP Streaming Chat - バックエンド

MCP Streaming Chatのバックエンドは、Express.jsとMCP SDKを使用して実装されたサーバーアプリケーションです。このサーバーは、MCPのStreamable HTTPトランスポートを使用して、クライアントとの通信を行います。

## 技術スタック

- [Express.js](https://expressjs.com/) - Webアプリケーションフレームワーク
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Model Context Protocolの実装
- [TypeScript](https://www.typescriptlang.org/) - 型安全なJavaScript
- [Zod](https://github.com/colinhacks/zod) - TypeScriptファーストのスキーマ検証
- [Faker.js](https://fakerjs.dev/) - テストデータ生成ライブラリ

## ディレクトリ構造

```
backend/
├── src/
│   ├── index.ts                # エントリーポイント
│   ├── server/                 # サーバー設定
│   │   └── transport.ts        # MCPトランスポート設定
│   ├── tools/                  # MCPツール実装
│   │   ├── chat.ts             # 通常チャットツール
│   │   ├── chat-stream.ts      # ストリーミングチャットツール
│   │   ├── dice.ts             # サイコロツール
│   │   └── index.ts            # ツールエクスポート
│   └── utils/                  # ユーティリティ関数
│       ├── logger.ts           # ロギングユーティリティ
│       └── message-generator.ts # メッセージ生成ユーティリティ
├── .gitignore                  # Gitの除外ファイル設定
├── .prettierrc                 # Prettierの設定
├── eslint.config.mjs           # ESLintの設定
├── package.json                # プロジェクト設定とスクリプト
├── package-lock.json           # 依存関係のロックファイル
├── README.md                   # このファイル
└── tsconfig.json               # TypeScriptの設定
```

## 主要コンポーネント

### トランスポート設定 (`src/server/transport.ts`)

MCPのStreamable HTTPトランスポートを設定するコンポーネントです。セッション管理、イベントストア、SSEストリーミングなどの機能を提供します。

```typescript
// トランスポートの作成例
export function createTransport(): StreamableHTTPServerTransport {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(), // セッションIDとしてランダムUUIDを生成
    eventStore, // セッション状態を保持するイベントストア
    enableJsonResponse: false, // SSE形式のレスポンスを使用
    onsessioninitialized: (sessionId) => {
      logMessage(`セッション初期化完了: ${sessionId}`)
      transports[sessionId] = transport // セッションIDとトランスポートの対応関係を保存
    },
  })

  // ...

  return transport
}
```

### ツール実装

#### チャットツール (`src/tools/chat.ts`)

通常のチャットツールを実装しています。ユーザーからのメッセージに対して応答を生成し、SSE形式で返します。

```typescript
export const chatToolDefinition = {
  name: 'chat',
  description: '質問に対して回答を返します',
  parameters: {
    message: z.string().describe('ユーザーからの質問'),
  },
  handler: async (args: { message: string }, context: any) => {
    // メッセージを生成して返す
    // ...
  },
}
```

#### ストリーミングチャットツール (`src/tools/chat-stream.ts`)

ストリーミングチャットツールを実装しています。ユーザーからのメッセージに対して応答を生成し、複数のチャンクに分割してSSE形式で段階的に返します。

```typescript
export const chatStreamToolDefinition = {
  name: 'chat_stream',
  description: '質問に対して段階的に回答を返します（ストリーミング）',
  parameters: {
    message: z.string().describe('ユーザーからの質問'),
  },
  handler: async (args: { message: string }, context: any) => {
    // メッセージを生成し、チャンクに分割して段階的に返す
    // ...
  },
}
```

#### サイコロツール (`src/tools/dice.ts`)

サイコロツールを実装しています。指定された面数のサイコロを振り、結果を返します。

```typescript
export const diceToolDefinition = {
  name: 'dice',
  description: 'サイコロを振って結果を返します',
  parameters: {
    sides: z.number().int().min(1).describe('サイコロの面数'),
  },
  handler: async (args: { sides: number }, _context: any) => {
    // サイコロを振って結果を返す
    // ...
  },
}
```

### ユーティリティ関数

#### ロギングユーティリティ (`src/utils/logger.ts`)

ログメッセージを出力するためのユーティリティ関数を提供します。

```typescript
export function logMessage(message: string, level: LogLevel = 'info') {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`)
}
```

#### メッセージ生成ユーティリティ (`src/utils/message-generator.ts`)

チャットメッセージを生成するためのユーティリティ関数を提供します。

```typescript
export function generateResponseFromClientMessage(clientMessage: string): string {
  // クライアントメッセージに基づいて応答を生成
  // ...
}
```

## 開発環境のセットアップ

### 前提条件

- Node.js 18.0.0以上
- npm 9.0.0以上

### インストール

```bash
# 依存関係をインストール
npm install
```

### 利用可能なスクリプト

```bash
# 開発サーバーを起動（ファイル変更を監視）
npm run dev

# TypeScriptをコンパイル
npm run build

# ESLintでコードをチェック
npm run lint

# ESLintでコードをチェックして修正
npm run lint:fix

# Prettierでコードをフォーマット
npm run format

# Prettierでコードのフォーマットをチェック
npm run format:check
```

### 一般的な問題と解決策

1. **サーバーが起動しない**

   - Node.jsとnpmのバージョンが要件を満たしているか確認
   - 依存関係が正しくインストールされているか確認
   - ポート3000が他のアプリケーションで使用されていないか確認

2. **クライアントからの接続エラー**

   - CORSの設定が正しいか確認
   - クライアントとサーバーのMCP SDKのバージョンが互換性があるか確認

3. **ストリーミングが機能しない**
   - ブラウザがSSEをサポートしているか確認
   - ネットワーク接続が安定しているか確認
   - サーバーのログでエラーを確認