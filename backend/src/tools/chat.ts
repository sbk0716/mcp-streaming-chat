import { z } from "zod"; // バリデーションライブラリZodをインポート - 入力パラメータの検証に使用
import { logMessage } from "../utils/logger"; // ロギング機能をインポート - 処理の記録に使用
import { generateResponseFromClientMessage } from "../utils/message-generator"; // メッセージ生成機能をインポート - 応答文の生成に使用

/**
 * チャットツールの実装
 * ユーザーからのメッセージに対して応答を生成します
 * ストリーミングOFFでもSSE形式を使用するように修正
 */
export const chatToolDefinition = {
  // 通常チャットツールの定義オブジェクト
  name: "chat", // ツール名 - クライアントからの呼び出しに使用される識別子
  description: "質問に対して回答を返します", // ツールの説明 - クライアントに表示される説明文
  parameters: {
    // パラメータ定義 - ツールが受け付ける入力パラメータのスキーマ
    message: z.string().describe("ユーザーからの質問"), // messageパラメータ - 文字列型で必須
  },
  handler: async (args: { message: string }, context: any) => {
    // ハンドラ関数 - ツールの実際の処理を行う非同期関数
    // 入力からメッセージを取得
    const clientMessage = args.message; // 入力パラメータからメッセージを取得
    const { sendNotification } = context; // コンテキストから通知送信機能を取得

    // クライアントメッセージに基づいて応答を生成
    const generatedMessage = generateResponseFromClientMessage(clientMessage); // メッセージ生成関数を呼び出し

    // ログ出力
    logMessage(
      `チャットツール実行: "${clientMessage}" => 応答生成完了（${generatedMessage.length}文字）`,
    ); // 処理完了をログに記録 - 生成されたメッセージの長さも含む

    // 非ストリーミングでもSSE形式で通知を送信（DevToolsで確認できるように）
    try {
      await sendNotification({
        // 通知を送信
        method: "notifications/message", // 通知メソッド - メッセージ通知を示す
        params: {
          // 通知パラメータ
          level: "info", // 通知レベル - 情報レベルの通知
          data: generatedMessage, // 通知データ - 生成されたメッセージ全体
          metadata: {
            // メタデータ - クライアント側での処理に使用される追加情報
            streaming: false, // ストリーミング中かどうか - 非ストリーミングなのでfalse
            progress: 100, // 進捗率 - 100%（完了）
            totalChunks: 1, // 総チャンク数 - 非ストリーミングなので1
            currentChunk: 1, // 現在のチャンク番号 - 非ストリーミングなので1
            isComplete: true, // 完了したかどうか - 完了したのでtrue
          },
        },
      });
      logMessage(`チャットツール: SSE通知送信完了`); // 通知送信完了をログに記録
    } catch (err) {
      logMessage(`通知送信エラー: ${err}`, "error"); // エラーをログに記録
    }

    // chat_streamと同様に空のコンテンツを返す
    // すべての内容は通知として送信されるため、レスポンスは単なるプレースホルダー
    return {
      // MCPフォーマットのレスポンスを返す
      content: [
        // コンテンツ配列
        {
          type: "text" as const, // コンテンツタイプ - テキスト形式
          text: "", // 空のテキストを返す - すべての内容は通知として送信済み
          metadata: {
            // メタデータ - クライアント側での処理に使用される追加情報
            streaming: false, // ストリーミング中かどうか - 非ストリーミングなのでfalse
            progress: 100, // 進捗率 - 100%（完了）
            totalChunks: 1, // 総チャンク数 - 非ストリーミングなので1
            currentChunk: 1, // 現在のチャンク番号 - 非ストリーミングなので1
            isComplete: true, // 完了したかどうか - 完了したのでtrue
          },
        },
      ],
    };
  },
};
