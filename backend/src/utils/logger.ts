/**
 * ログメッセージを出力する関数
 * タイムスタンプ付きでログメッセージをコンソールに出力します
 *
 * @param message ログメッセージ
 * @param level ログレベル（'info', 'warn', 'error'のいずれか）
 */
export function logMessage(
  message: string,
  level: "info" | "warn" | "error" = "info",
): void {
  // ログ出力関数の定義 - 戻り値なし
  const timestamp = new Date().toISOString(); // 現在時刻をISO形式の文字列で取得 - 国際標準のタイムスタンプ形式
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`; // ログのプレフィックスを作成 - タイムスタンプとログレベルを大文字で表示

  switch (
    level // ログレベルに応じて適切なコンソールメソッドを使用
  ) {
    case "error": // エラーレベルの場合
      console.error(`${prefix} ${message}`); // エラーとして出力 - 赤色で表示される
      break;
    case "warn": // 警告レベルの場合
      console.warn(`${prefix} ${message}`); // 警告として出力 - 黄色で表示される
      break;
    default: // それ以外（info）の場合
      console.log(`${prefix} ${message}`); // 通常のログとして出力 - 標準色で表示される
  }
}
