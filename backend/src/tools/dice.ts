import { z } from "zod"; // バリデーションライブラリZodをインポート - 入力パラメータの検証に使用
import { logMessage } from "../utils/logger"; // ロギング機能をインポート - 処理の記録に使用

/**
 * サイコロツールの実装
 * 指定された面数のサイコロを振った結果を返します
 */
export const diceToolDefinition = {
  // サイコロツールの定義オブジェクト
  name: "dice", // ツール名 - クライアントからの呼び出しに使用される識別子
  description: "サイコロを振った結果を返します", // ツールの説明 - クライアントに表示される説明文
  parameters: {
    // パラメータ定義 - ツールが受け付ける入力パラメータのスキーマ
    sides: z.number().min(1).default(6).describe("サイコロの面の数"), // sidesパラメータ - 数値型、最小値1、デフォルト値6
  },
  handler: async (args: { sides: number }, _context: any) => {
    // ハンドラ関数 - ツールの実際の処理を行う非同期関数
    // 入力から面の数を取得、未指定の場合はデフォルト値6を使用
    const sides = args.sides; // 入力パラメータからサイコロの面数を取得
    // 1からsidesまでのランダムな整数を生成（サイコロを振る処理）
    const result = Math.floor(Math.random() * sides) + 1; // 乱数生成とフロア関数で整数値を得る

    // ログ出力
    logMessage(`サイコロツール実行: ${sides}面サイコロ => ${result}`); // 実行結果をログに記録

    // MCP形式のレスポンスを返す
    return {
      // MCPフォーマットのレスポンスを返す
      content: [
        // コンテンツ配列
        {
          type: "text" as const, // コンテンツタイプ - テキスト形式
          text: result.toString(), // テキスト内容 - 数値を文字列に変換して返す
        },
      ],
    };
  },
};
