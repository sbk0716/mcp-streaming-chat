import { randomUUID } from "node:crypto"; // UUIDを生成するためのNode.js組み込み関数をインポート
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"; // MCPのHTTPトランスポート実装をインポート
import { InMemoryEventStore } from "@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js"; // イベント保存用のインメモリストレージをインポート
import { logMessage } from "../utils/logger"; // ロギング機能をインポート

// セッション ID ごとに StreamableHTTPServerTransport インスタンスを保持するオブジェクト
export const transports: {
  [sessionId: string]: StreamableHTTPServerTransport;
} = {}; // キーがセッションID、値がトランスポートインスタンスのオブジェクト

// イベントストアを作成 - セッション状態とストリーミングイベントを保持するためのストレージ
export const eventStore = new InMemoryEventStore(); // メモリ内にイベントを保存するインスタンスを作成

/**
 * 新しいトランスポートを作成する関数
 * セッション初期化時に呼び出される
 *
 * @returns 新しく作成されたトランスポートインスタンス
 */
export function createTransport(): StreamableHTTPServerTransport {
  // StreamableHTTPServerTransportを返す関数を定義
  const transport = new StreamableHTTPServerTransport({
    // 新しいトランスポートインスタンスを作成
    sessionIdGenerator: () => randomUUID(), // セッションIDとしてランダムUUIDを生成する関数 - セキュアなセッション識別子を提供
    eventStore, // セッション状態を保持するイベントストア - 上で作成したインメモリストアを使用
    enableJsonResponse: false, // SSE形式のレスポンスを使用（明示的に指定） - JSONレスポンスを無効化
    onsessioninitialized: (sessionId) => {
      // セッション初期化完了時のコールバック関数
      // セッションが初期化されたときのコールバック - セッションIDが生成された後に呼ばれる
      logMessage(`セッション初期化完了: ${sessionId}`); // セッション初期化完了をログに記録
      transports[sessionId] = transport; // セッションIDとトランスポートの対応関係を保存 - 後で再利用するために保存
    },
  });

  // トランスポートがクローズされたときのハンドラを設定 - リソース解放のため
  transport.onclose = () => {
    // クローズイベント発生時に実行される関数
    const sid = transport.sessionId; // クローズされるトランスポートのセッションID - 現在のセッションIDを取得
    if (sid && transports[sid]) {
      // セッションIDが存在し、対応するトランスポートが存在する場合
      logMessage(`トランスポート終了: ${sid}`); // トランスポート終了をログに記録
      delete transports[sid]; // トランスポートをオブジェクトから削除 - メモリリークを防止
    }
  };

  return transport; // 作成したトランスポートインスタンスを返す
}
