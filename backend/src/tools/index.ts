import { diceToolDefinition } from "./dice"; // サイコロツールの定義をインポート - ランダムな数値を生成するツール
import { chatToolDefinition } from "./chat"; // チャットツールの定義をインポート - 非ストリーミング形式のチャットツール
import { chatStreamToolDefinition } from "./chat-stream"; // ストリーミングチャットツールの定義をインポート - 段階的に応答を返すツール

/**
 * すべてのツール定義をエクスポート
 * サーバー初期化時にMCPサーバーに登録するために使用
 */
export const tools = [
  diceToolDefinition,
  chatToolDefinition,
  chatStreamToolDefinition,
]; // 利用可能なすべてのツールを配列として定義 - 一括登録に便利
