// MCP サーバーの基本クラスをインポート
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// Express フレームワークをインポート
import express from "express";
// リクエストが初期化リクエストかどうかを判定するヘルパー関数をインポート
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

// 自作モジュールのインポート
import { logMessage } from "./utils/logger";
import { tools } from "./tools";
import { transports, createTransport } from "./server/transport";

// MCP サーバーインスタンスを作成
const mcpServer = new McpServer(
  {
    name: "mcp-streaming-chat-server", // サーバーの名前を指定
    version: "1.0.0", // サーバーのバージョンを指定
  },
  { capabilities: { logging: {} } },
); // ロギング機能を有効化

// ツールを登録
import { diceToolDefinition } from "./tools/dice";
import { chatToolDefinition } from "./tools/chat";
import { chatStreamToolDefinition } from "./tools/chat-stream";

// サイコロツールを登録
mcpServer.tool(
  diceToolDefinition.name,
  diceToolDefinition.description,
  diceToolDefinition.parameters,
  diceToolDefinition.handler,
);

// チャットツールを登録
mcpServer.tool(
  chatToolDefinition.name,
  chatToolDefinition.description,
  chatToolDefinition.parameters,
  chatToolDefinition.handler,
);

// ストリーミングチャットツールを登録
mcpServer.tool(
  chatStreamToolDefinition.name,
  chatStreamToolDefinition.description,
  chatStreamToolDefinition.parameters,
  chatStreamToolDefinition.handler,
);

// HTTP サーバーのセットアップ - Express フレームワークを使用
const app = express(); // Expressアプリケーションインスタンスを作成
const cors = require("cors"); // CORSミドルウェアをインポート

// CORSの詳細設定
app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:3000"], // フロントエンドのオリジンを許可
    methods: ["GET", "POST", "DELETE", "OPTIONS"], // 許可するHTTPメソッド
    allowedHeaders: ["Content-Type", "Accept", "Mcp-Session-Id"], // 許可するヘッダー
    exposedHeaders: ["Mcp-Session-Id"], // クライアントに公開するヘッダー
    credentials: true, // クレデンシャルを許可
    maxAge: 86400, // プリフライトリクエストのキャッシュ時間（秒）
  }),
);

// OPTIONSリクエストに対するハンドラ
app.options("/mcp", (req, res) => {
  res.status(200).end(); // 200 OKを返して成功を示す
});

// JSONリクエストボディをパースするミドルウェアを追加
app.use(express.json());

// すべてのリクエストにAcceptヘッダーを追加するカスタムミドルウェア
app.use((req, res, next) => {
  if (!req.headers.accept) {
    // Acceptヘッダーが存在しない場合、JSONとSSE（Server-Sent Events）の両方を受け入れるように設定
    req.headers.accept = "application/json, text/event-stream";
  }
  next(); // 次のミドルウェアまたはルートハンドラに処理を渡す
});

// リクエストロギングミドルウェア
app.use((req, res, next) => {
  const clientIP =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  logMessage(`${req.method} ${req.url} - クライアントIP: ${clientIP}`);
  next();
});

// /mcp エンドポイントでの POST リクエストハンドラ
app.post("/mcp", async (req, res) => {
  try {
    // リクエストヘッダーから Mcp-Session-Id を取得
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport;

    // セッション処理の分岐
    if (sessionId && transports[sessionId]) {
      // 既存セッションの場合
      transport = transports[sessionId]; // 既存のトランスポートを再利用
      logMessage(`既存セッション使用: ${sessionId}`);
    } else if (
      // 新規セッション初期化の条件
      ((isInitializeRequest(req.body) || req.body.method === "initialize") &&
        !sessionId) ||
      req.body.method === "server/info"
    ) {
      logMessage(`新規セッション初期化: ${JSON.stringify(req.body)}`);

      // 新しいトランスポートを作成
      transport = createTransport();

      // 新しいトランスポートをMCPサーバーに接続
      await mcpServer.connect(transport);
      // リクエストを処理
      await transport.handleRequest(req, res, req.body);
      return; // 処理完了
    } else {
      // 無効なセッションの場合
      logMessage(`無効なセッションID: ${sessionId || "なし"}`, "warn");
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: No valid session ID provided",
        },
        id: null,
      });
      return; // 処理完了
    }

    // 既存セッションの処理
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    // エラーが発生した場合はログに出力
    logMessage(`MCPリクエスト処理エラー: ${error}`, "error");
    // レスポンスヘッダーがまだ送信されていない場合のみエラーレスポンスを返す
    if (!res.headersSent) {
      // HTTP 500エラー（サーバー内部エラー）とJSON-RPC 2.0形式のエラーレスポンスを返す
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

// /mcp エンドポイントでの DELETE リクエストハンドラ
app.delete("/mcp", async (req, res) => {
  // リクエストヘッダーからセッション ID を取得
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  // セッション ID のバリデーション
  if (!sessionId || !transports[sessionId]) {
    // 400 Bad Request エラーを返す
    logMessage(`無効なセッションID（DELETE）: ${sessionId || "なし"}`, "warn");
    res
      .status(400)
      .send(
        "Invalid or missing session ID. Please provide a valid session ID.",
      );
    return; // 処理を終了
  }

  // セッション終了処理開始のログ
  logMessage(`セッション終了処理開始: ${sessionId}`);
  try {
    // 該当するトランスポートを取得
    const transport = transports[sessionId];
    // トランスポートのhandleRequestメソッドにDELETEリクエストを渡す
    await transport.handleRequest(req, res);
  } catch (error) {
    // エラーが発生した場合
    logMessage(`トランスポート終了エラー: ${error}`, "error");
    // レスポンスがまだ送信されていない場合はエラーレスポンスを返す
    if (!res.headersSent) {
      res.status(500).send("Error closing transport"); // 500 Internal Server Error
    }
  }
});

// GET リクエストハンドラ - SSEストリームを開始する
app.get("/mcp", async (req, res) => {
  try {
    // リクエストヘッダーからセッションIDを取得
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    // セッションIDのバリデーション
    if (!sessionId || !transports[sessionId]) {
      // 400 Bad Request エラーを返す
      logMessage(`無効なセッションID（GET）: ${sessionId || "なし"}`, "warn");
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: No valid session ID provided",
        },
        id: null,
      });
      return;
    }

    // Last-Event-IDヘッダーを確認（再接続時）
    const lastEventId = req.headers["last-event-id"] as string | undefined;
    if (lastEventId) {
      logMessage(`Last-Event-IDヘッダーを検出: ${lastEventId}`, "info");
    }

    // 該当するトランスポートを取得
    const transport = transports[sessionId];

    // トランスポートのhandleRequestメソッドにGETリクエストを渡す
    logMessage(`SSEストリーム開始: セッションID ${sessionId}`, "info");
    await transport.handleRequest(req, res);
  } catch (error) {
    // エラーが発生した場合はログに出力
    logMessage(`SSEストリーム開始エラー: ${error}`, "error");
    // レスポンスヘッダーがまだ送信されていない場合のみエラーレスポンスを返す
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

// サーバーのポート番号を設定
const PORT = process.env.PORT || 3000;

// HTTP サーバーの起動
app.listen(PORT, () => {
  // サーバー起動成功時のログメッセージを出力
  logMessage(
    `MCP Streaming Chat Server is running on http://localhost:${PORT}/mcp`,
    "info",
  );
  logMessage(
    `アクティブセッション数: ${Object.keys(transports).length}`,
    "info",
  );
});

// SIGINT (Ctrl+Cなど) を受け取ったときのグレースフルシャットダウン処理
process.on("SIGINT", async () => {
  // シャットダウン開始のログメッセージを出力
  logMessage("サーバーシャットダウン開始...", "info");
  try {
    // 保持しているすべてのトランスポートを閉じる
    for (const sessionId in transports) {
      const transport = transports[sessionId];
      if (transport) {
        await transport.close(); // トランスポートを閉じる
        logMessage(`セッション終了: ${sessionId}`, "info");
      }
    }
  } catch (error) {
    // トランスポート終了中にエラーが発生した場合
    logMessage(`トランスポート終了エラー: ${error}`, "error");
  }
  // MCP サーバーを閉じる
  await mcpServer.close();
  // シャットダウン完了のログメッセージを出力
  logMessage("サーバーシャットダウン完了", "info");
  process.exit(0); // 終了コード0でプロセスを終了（正常終了）
});
