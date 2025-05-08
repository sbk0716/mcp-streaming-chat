import { z } from "zod"; // バリデーションライブラリZodをインポート - 入力パラメータの検証に使用
import { logMessage } from "../utils/logger"; // ロギング機能をインポート - 処理の記録に使用
import { generateResponseFromClientMessage } from "../utils/message-generator"; // メッセージ生成機能をインポート - 応答文の生成に使用

/**
 * ストリーミングチャットツールの実装
 * ユーザーからのメッセージに対して段階的に応答を生成します
 */
export const chatStreamToolDefinition = {
  // ストリーミングチャットツールの定義オブジェクト
  name: "chat_stream", // ツール名 - クライアントからの呼び出しに使用される識別子
  description: "質問に対して段階的に回答を返します（ストリーミング）", // ツールの説明 - クライアントに表示される説明文
  parameters: {
    // パラメータ定義 - ツールが受け付ける入力パラメータのスキーマ
    message: z.string().describe("ユーザーからの質問"), // messageパラメータ - 文字列型で必須
  },
  handler: async (args: { message: string }, context: any) => {
    // ハンドラ関数 - ツールの実際の処理を行う非同期関数
    const { message } = args; // 入力パラメータからメッセージを取得
    const { sendNotification } = context; // コンテキストから通知送信機能を取得

    // クライアントメッセージに基づいて応答を生成
    let generatedMessage = generateResponseFromClientMessage(message); // メッセージ生成関数を呼び出し
    generatedMessage = generatedMessage.replace(/\n+/g, " "); // 複数の改行を単一のスペースに置換 - 読みやすさ向上

    // ログ出力
    logMessage(
      `ストリーミングチャットツール実行: "${message}" => 応答生成開始`,
    ); // 処理開始をログに記録

    // メッセージをチャンクに分割（文章ごと）
    const chunks = generatedMessage.split(/(?<=\.|\。)/); // 句点（.または。）の後で分割 - 文単位でのストリーミングを実現
    const filteredChunks = chunks.filter((chunk) => chunk.trim().length > 0); // 空のチャンクを除外

    // 進捗率を計算
    const progress = Math.floor((1 / filteredChunks.length) * 100); // 最初のチャンクの進捗率を計算
    const isComplete = filteredChunks.length === 1; // チャンクが1つしかない場合は完了とみなす

    // 最初のチャンクをログに記録
    logMessage(
      `ストリーミングチャットツール: 最初のチャンク送信 (1/${filteredChunks.length})`,
    ); // 最初のチャンク送信をログに記録

    // 重要な変更点: 最初のチャンクも通知として送信
    // これにより、すべてのチャンクが同じ方法で処理される
    if (filteredChunks.length > 0) {
      // チャンクが存在する場合
      try {
        await sendNotification({
          // 通知を送信
          method: "notifications/message", // 通知メソッド - メッセージ通知を示す
          params: {
            // 通知パラメータ
            level: "info", // 通知レベル - 情報レベルの通知
            data: filteredChunks[0], // 通知データ - 最初のチャンクの内容
            metadata: {
              // メタデータ - クライアント側での処理に使用される追加情報
              streaming: !isComplete, // ストリーミング中かどうか - 完了していない場合はtrue
              progress: progress, // 進捗率 - パーセンテージ
              totalChunks: filteredChunks.length, // 総チャンク数
              currentChunk: 1, // 現在のチャンク番号
              isComplete: isComplete, // 完了したかどうか
            },
          },
        });
      } catch (err) {
        logMessage(`最初のチャンク通知送信エラー: ${err}`, "error"); // エラーをログに記録
      }
    }

    // 残りのチャンクを送信（2番目以降）
    const sleep = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms)); // スリープ関数 - 指定ミリ秒待機する

    for (let i = 1; i < filteredChunks.length; i++) {
      // 2番目以降のチャンクをループ処理
      // 自然な間隔でチャンクを送信
      await sleep(300); // 300ミリ秒待機 - 自然な読み上げ感を演出

      const chunkProgress = Math.floor(((i + 1) / filteredChunks.length) * 100); // 現在のチャンクの進捗率を計算
      const chunkIsComplete = i >= filteredChunks.length - 1; // 最後のチャンクかどうかを判定

      try {
        await sendNotification({
          // 通知を送信
          method: "notifications/message", // 通知メソッド - メッセージ通知を示す
          params: {
            // 通知パラメータ
            level: "info", // 通知レベル - 情報レベルの通知
            data: filteredChunks[i], // 通知データ - 現在のチャンクの内容
            metadata: {
              // メタデータ - クライアント側での処理に使用される追加情報
              streaming: !chunkIsComplete, // ストリーミング中かどうか - 最後のチャンクでない場合はtrue
              progress: chunkProgress, // 進捗率 - パーセンテージ
              totalChunks: filteredChunks.length, // 総チャンク数
              currentChunk: i + 1, // 現在のチャンク番号
              isComplete: chunkIsComplete, // 完了したかどうか
            },
          },
        });

        logMessage(
          `ストリーミングチャットツール: チャンク送信 (${i + 1}/${filteredChunks.length}) - ${chunkProgress}%`,
        ); // チャンク送信をログに記録
      } catch (err) {
        logMessage(`通知送信エラー: ${err}`, "error"); // エラーをログに記録
      }
    }

    // 最終的なレスポンスを返す
    // 重要な変更点: 空のコンテンツを返す
    // すべてのチャンクは通知として送信されるため、レスポンスは単なるプレースホルダー
    return {
      // MCPフォーマットのレスポンスを返す
      content: [
        // コンテンツ配列
        {
          type: "text" as const, // コンテンツタイプ - テキスト形式
          text: "", // テキスト内容 - 空文字列（すべての内容は通知として送信済み）
          metadata: {
            // メタデータ - クライアント側での処理に使用される追加情報
            streaming: false, // ストリーミング中かどうか - 完了したのでfalse
            progress: 100, // 進捗率 - 100%（完了）
            totalChunks: filteredChunks.length, // 総チャンク数
            currentChunk: filteredChunks.length, // 現在のチャンク番号 - 最後のチャンク
            isComplete: true, // 完了したかどうか - 完了したのでtrue
          },
        },
      ],
    };
  },
};
