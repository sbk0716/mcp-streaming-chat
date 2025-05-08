# MCP Streaming Chat - フロントエンド

MCP Streaming Chatのフロントエンドは、Next.jsとReactを使用して実装されたWebアプリケーションです。このアプリケーションは、MCPのStreamable HTTPトランスポートを使用して、バックエンドサーバーと通信し、ストリーミングチャット機能を提供します。

## 技術スタック

- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [React](https://reactjs.org/) - UIライブラリ
- [Tailwind CSS](https://tailwindcss.com/) - ユーティリティファーストCSSフレームワーク
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Model Context Protocolの実装
- [TypeScript](https://www.typescriptlang.org/) - 型安全なJavaScript

## ディレクトリ構造

```
frontend/
├── lib/
│   └── mcp-client.ts           # MCPクライアント実装
├── public/                     # 静的ファイル
│   ├── file.svg                # アイコン
│   ├── globe.svg               # アイコン
│   ├── next.svg                # Next.jsロゴ
│   ├── vercel.svg              # Vercelロゴ
│   └── window.svg              # アイコン
├── src/
│   └── app/                    # Next.jsアプリケーション
│       ├── components/         # Reactコンポーネント
│       │   ├── ChatClient.tsx  # チャットクライアントコンポーネント
│       │   └── MCPClient.tsx   # MCPクライアントコンポーネント
│       ├── favicon.ico         # ファビコン
│       ├── globals.css         # グローバルCSS
│       ├── layout.tsx          # レイアウトコンポーネント
│       └── page.tsx            # メインページコンポーネント
├── .gitignore                  # Gitの除外ファイル設定
├── .prettierrc                 # Prettierの設定
├── eslint.config.mjs           # ESLintの設定
├── next.config.ts              # Next.jsの設定
├── package.json                # プロジェクト設定とスクリプト
├── package-lock.json           # 依存関係のロックファイル
├── postcss.config.mjs          # PostCSSの設定
├── README.md                   # このファイル
└── tsconfig.json               # TypeScriptの設定
```

## 主要コンポーネント

### MCPクライアント実装 (`lib/mcp-client.ts`)

MCPクライアントを初期化し、バックエンドサーバーと通信するためのユーティリティ関数を提供します。

```typescript
// MCPクライアントの初期化
export async function initializeClient() {
  // クライアントインスタンスを作成
  client = new Client({
    name: "mcp-streaming-chat-frontend",
    version: "1.0.0",
  });

  // トランスポートを作成
  transport = new StreamableHTTPClientTransport(new URL(SERVER_URL), {
    sessionId, // 既存のセッションIDがあれば使用
    requestInit: {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream", // JSONとSSEの両方を受け入れる
      },
      credentials: "include",
      mode: "cors",
    },
  });

  // サーバーに接続
  await client.connect(transport);

  // ...
}

// ストリーミングチャットメッセージを送信
export async function sendStreamingChatMessage(
  message: string,
  onChunkReceived: (text: string, metadata: any) => void,
) {
  // ...

  // 通知ハンドラを設定
  mcpClient.setNotificationHandler(
    LoggingMessageNotificationSchema,
    (notification) => {
      const text = notification.params.data as string;
      const metadata = notification.params.metadata || {};

      // コールバック関数を呼び出してチャンクを通知
      onChunkReceived(text, metadata);
    },
  );

  // ...
}
```

### チャットクライアントコンポーネント (`src/app/components/ChatClient.tsx`)

チャットインターフェースを提供するReactコンポーネントです。メッセージの送信、受信、表示、プログレスバーの表示などの機能を実装しています。

```tsx
export default function ChatClient() {
  // 状態変数の定義
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");

  // ...

  // チャットメッセージを送信する関数
  const handleSendMessage = async () => {
    // ...

    // ストリーミングチャットメッセージを送信
    await sendStreamingChatMessage(
      userMessage.text,
      (text: string, metadata: any) => {
        // 各チャンクを受信したときのコールバック
        setMessages((prevMessages) => {
          // メッセージを更新
          // ...
        });
      },
    );

    // ...
  };

  // UIのレンダリング
  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* ヘッダー部分 */}
      {/* メッセージ表示エリア */}
      {/* メッセージ入力エリア */}
    </div>
  );
}
```

## UI/UXの特徴

### リアルタイムストリーミング表示

サーバーからのストリーミングチャンクをリアルタイムで表示します。各チャンクが受信されるたびに、メッセージが更新されます。

### プログレスバーとタイピングインジケーター

ストリーミング中の進捗状況を視覚的に表示するプログレスバーと、タイピング中であることを示すタイピングインジケーターを実装しています。

```tsx
{
  /* プログレスバー */
}
{
  message.isStreaming && message.progress !== undefined && (
    <div className="w-full bg-gray-200 h-1 mt-2 rounded-full overflow-hidden">
      <div
        className="bg-blue-500 h-1 rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${message.progress}%` }}
      ></div>
    </div>
  );
}

{
  /* タイピングインジケーター */
}
{
  message.isStreaming && (
    <span className="ml-1 inline-block w-2 h-4 bg-transparent border-r-2 border-current animate-pulse"></span>
  );
}
```

### 接続状態の視覚的フィードバック

現在の接続状態（接続済み、接続中、再接続中、切断）を視覚的にフィードバックします。

```tsx
<div
  className={`px-3 py-1 rounded-full text-sm font-medium ${
    connectionState === "connected"
      ? "bg-green-100 text-green-800"
      : connectionState === "connecting"
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800"
  }`}
>
  {connectionState === "connected"
    ? "接続済み"
    : connectionState === "connecting"
      ? "接続中..."
      : connectionState === "reconnecting"
        ? "再接続中..."
        : "切断"}
</div>
```

### レスポンシブデザイン

Tailwind CSSを使用して、さまざまな画面サイズに対応するレスポンシブデザインを実装しています。

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
# 開発サーバーを起動（Turbopackを使用）
npm run dev

# プロジェクトをビルド
npm run build

# 本番サーバーを起動
npm run start

# ESLintでコードをチェック
npm run lint

# ESLintでコードをチェックして修正
npm run lint:fix

# Prettierでコードをフォーマット
npm run format

# Prettierでコードのフォーマットをチェック
npm run format:check
```
