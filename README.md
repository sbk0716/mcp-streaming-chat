# MCP Streaming Chat

![MCP Streaming Chat](https://storage.googleapis.com/zenn-user-upload/599d8d43c22d-20250506.png)

## 概要

MCP Streaming Chatは、最新のModel Context Protocol（MCP）仕様（2025-03-26）を活用したストリーミングチャットアプリケーションです。このプロジェクトは、MCPのStreamable HTTPトランスポートを使用して、サーバーからクライアントへのリアルタイムなメッセージストリーミングを実現しています。

ユーザーがメッセージを送信すると、サーバーは応答を複数のチャンクに分割し、Server-Sent Events（SSE）を使用してクライアントに段階的に送信します。これにより、長文の応答でも、生成されたチャンクをリアルタイムで表示することができます。

## 主な機能

- **リアルタイムストリーミング**: サーバーからの応答をリアルタイムで表示
- **プログレスバー**: ストリーミング中の進捗状況を視覚的に表示
- **タイピングインジケーター**: ストリーミング中はタイピングインジケーターを表示
- **セッション管理**: MCPのセッション管理機能を使用して状態を保持
- **再開可能性（Resumability）**: 接続が切断された場合でも、最後に受信したイベントから再開可能
- **ストリーミングON/OFF切り替え**: ストリーミングモードのON/OFFを切り替え可能

## 技術スタック

### バックエンド
- [Express.js](https://expressjs.com/) - Webアプリケーションフレームワーク
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Model Context Protocolの実装
- [TypeScript](https://www.typescriptlang.org/) - 型安全なJavaScript
- [Zod](https://github.com/colinhacks/zod) - TypeScriptファーストのスキーマ検証

### フロントエンド
- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [React](https://reactjs.org/) - UIライブラリ
- [Tailwind CSS](https://tailwindcss.com/) - ユーティリティファーストCSSフレームワーク
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Model Context Protocolの実装

## プロジェクト構造

```
mcp-streaming-chat/
├── backend/           # バックエンドコード（Express.js）
│   ├── src/
│   │   ├── index.ts   # エントリーポイント
│   │   ├── server/    # サーバー設定
│   │   ├── tools/     # MCPツール実装
│   │   └── utils/     # ユーティリティ関数
│   └── ...
├── frontend/          # フロントエンドコード（Next.js）
│   ├── lib/           # ユーティリティとMCPクライアント
│   ├── src/
│   │   └── app/       # Next.jsアプリケーション
│   │       └── components/ # Reactコンポーネント
│   └── ...
└── docs/              # ドキュメント
```

## インストールと実行

### 前提条件

- Node.js 18.0.0以上
- npm 9.0.0以上

### インストール

1. リポジトリをクローン

```bash
git clone https://github.com/yourusername/mcp-streaming-chat.git
cd mcp-streaming-chat
```

2. バックエンドの依存関係をインストール

```bash
cd backend
npm install
```

3. フロントエンドの依存関係をインストール

```bash
cd frontend
npm install
```

### 実行

1. バックエンドサーバーを起動

```bash
cd backend
npm run dev
```

2. 別のターミナルでフロントエンドサーバーを起動

```bash
cd frontend
npm run dev
```

3. ブラウザで [http://localhost:8080](http://localhost:8080) にアクセス

## 開発

### バックエンド開発

バックエンドの詳細については、[backend/README.md](./backend/README.md) を参照してください。

### フロントエンド開発

フロントエンドの詳細については、[frontend/README.md](./frontend/README.md) を参照してください。

## ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

## 謝辞

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCPの仕様と実装を提供
- [Anthropic](https://www.anthropic.com/) - MCPの開発をリードしているチーム
