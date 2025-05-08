"use client"; // Next.jsのクライアントコンポーネントであることを宣言 - サーバーサイドではなくブラウザで実行される

// React関連のフックをインポート - コンポーネントの状態管理と副作用処理に使用
import { useState, useEffect, useRef } from "react";
// MCPクライアント関連の関数をインポート - サーバーとの通信を担当
import {
  initializeClient, // MCPクライアントを初期化する関数
  getSessionId, // 現在のセッションIDを取得する関数
  terminateSession, // セッションを終了する関数
  sendChatMessage, // チャットメッセージを送信する関数
  sendStreamingChatMessage, // ストリーミングチャットメッセージを送信する関数
} from "../../../lib/mcp-client"; // 相対パスでMCPクライアントライブラリをインポート

// 接続状態の型定義
type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

// メッセージの型定義 - チャットメッセージの構造を定義
interface Message {
  id: string; // メッセージの一意の識別子
  text: string; // メッセージの内容
  sender: "user" | "bot"; // メッセージの送信者（ユーザーまたはボット）
  timestamp: Date; // メッセージの送信時刻
  isStreaming?: boolean; // ストリーミング中かどうか
  progress?: number; // ストリーミングの進捗率（0-100）
  totalChunks?: number; // 全チャンク数
  currentChunk?: number; // 現在のチャンク番号
}

// 接続状態コンポーネント - 現在の接続状態を視覚的に表示
function ConnectionStatus({ state }: { state: ConnectionState }) {
  // 接続状態に応じたスタイルとテキストを定義
  let statusText = "";
  let statusClass = "";
  let statusIcon = null;

  // 接続状態に応じてスタイルとテキストを設定
  switch (state) {
    case "connecting":
      statusText = "接続中...";
      statusClass =
        "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100";
      statusIcon = (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-yellow-800 dark:text-yellow-100"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      );
      break;
    case "connected":
      statusText = "接続済み";
      statusClass =
        "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100";
      statusIcon = (
        <svg
          className="h-4 w-4 mr-2 text-green-800 dark:text-green-100"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          ></path>
        </svg>
      );
      break;
    case "reconnecting":
      statusText = "再接続中...";
      statusClass =
        "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100";
      statusIcon = (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-orange-800 dark:text-orange-100"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      );
      break;
    case "disconnected":
      statusText = "切断されました";
      statusClass = "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100";
      statusIcon = (
        <svg
          className="h-4 w-4 mr-2 text-red-800 dark:text-red-100"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      );
      break;
  }

  // 接続状態を表示
  return (
    <div
      className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusClass}`}
    >
      {statusIcon}
      {statusText}
    </div>
  );
}

// チャットクライアントコンポーネント - MCPサーバーとのチャット対話を行うUIを提供
export default function ChatClient() {
  // 状態変数の定義 - ReactのuseStateフックを使用してコンポーネントの状態を管理
  const [sessionId, setSessionId] = useState<string | undefined>(); // 現在のセッションID
  const [messages, setMessages] = useState<Message[]>([]); // チャットメッセージの履歴
  const [inputMessage, setInputMessage] = useState(""); // 入力中のメッセージ
  const [loading, setLoading] = useState(false); // 読み込み中状態
  const [error, setError] = useState<string | null>(null); // エラーメッセージ
  const [useStreaming, setUseStreaming] = useState(true); // ストリーミングモードの使用有無（デフォルトでオン）
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting"); // 接続状態

  // メッセージ表示エリアへの参照 - 新しいメッセージが追加されたときに自動スクロールするために使用
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // セッションIDの状態を更新する関数 - 現在のセッション状態をUIに反映
  const updateSessionStatus = () => {
    const currentSessionId = getSessionId(); // MCPクライアントライブラリからセッションIDを取得
    setSessionId(currentSessionId); // 状態を更新してUIに反映

    // セッションIDの有無に応じて接続状態を更新
    if (currentSessionId) {
      setConnectionState("connected");
    } else {
      setConnectionState("disconnected");
    }
  };

  // コンポーネントマウント時にクライアントを初期化 - ページ読み込み時に一度だけ実行
  useEffect(() => {
    // 非同期初期化関数 - MCPクライアントの初期化処理を実行
    const initialize = async () => {
      setLoading(true); // 読み込み中状態をtrueに設定
      setError(null); // エラー状態をクリア
      setConnectionState("connecting"); // 接続状態を「接続中」に設定

      try {
        await initializeClient(); // MCPクライアントを初期化
        updateSessionStatus(); // セッション状態を更新

        // 初期メッセージを追加 - ユーザーに使い方を説明するウェルカムメッセージ
        setMessages([
          {
            id: Date.now().toString(),
            text: "こんにちは！何か質問があればどうぞ。ストリーミングモードがデフォルトで有効になっています。",
            sender: "bot",
            timestamp: new Date(),
          },
        ]);

        // 接続状態を「接続済み」に設定
        setConnectionState("connected");

        // 接続成功のログ出力
        console.log("MCP Client initialized successfully");
      } catch (err) {
        // エラーが発生した場合はエラーメッセージを設定
        setError(
          `初期化エラー: ${err instanceof Error ? err.message : String(err)}`,
        );
        setConnectionState("disconnected"); // 接続状態を「切断」に設定
        console.error("MCP Client initialization error:", err);
      } finally {
        setLoading(false); // 読み込み中状態をfalseに設定
      }
    };

    initialize(); // 初期化関数を実行

    // コンポーネントのアンマウント時にクリーンアップ処理を実行
    return () => {
      // 必要に応じてクリーンアップ処理を追加
      console.log("ChatClient component unmounted");
    };
  }, []); // 空の依存配列を指定して初回レンダリング時のみ実行

  // 新しいメッセージが追加されたときに自動スクロールする効果
  useEffect(() => {
    // メッセージ表示エリアの末尾へスクロール
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]); // messagesが変更されたときに実行

  // チャットメッセージを送信する関数 - 送信ボタンクリック時やEnterキー押下時に実行
  const handleSendMessage = async () => {
    // 入力値のバリデーション - 空のメッセージをチェック
    if (!inputMessage.trim()) {
      return; // 空のメッセージの場合は処理を終了
    }

    // ユーザーメッセージをメッセージ履歴に追加
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    // 入力フィールドをクリア
    setInputMessage("");

    setLoading(true); // 読み込み中状態をtrueに設定
    setError(null); // エラー状態をクリア

    try {
      if (useStreaming) {
        // ストリーミングモードの場合

        // ボットの応答用のプレースホルダーを追加
        const placeholderMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "考え中...",
          sender: "bot",
          timestamp: new Date(),
          isStreaming: true,
          progress: 0,
        };
        setMessages((prevMessages) => [...prevMessages, placeholderMessage]);

        // ストリーミングチャットメッセージを送信
        await sendStreamingChatMessage(
          userMessage.text,
          (
            text: string,
            metadata: {
              progress?: number;
              totalChunks?: number;
              currentChunk?: number;
              isComplete?: boolean;
              streaming?: boolean;
            },
          ) => {
            // 各チャンクを受信したときのコールバック
            setMessages((prevMessages) => {
              const updatedMessages = [...prevMessages];
              const lastMessage = updatedMessages[updatedMessages.length - 1];

              if (lastMessage && lastMessage.isStreaming) {
                // 最後のメッセージを更新
                updatedMessages[updatedMessages.length - 1] = {
                  ...lastMessage,
                  // 「考え中...」の場合は上書き、それ以外の場合は追加
                  // currentChunkが1の場合は最初のチャンク
                  text:
                    lastMessage.text === "考え中..." ||
                    metadata.currentChunk === 1
                      ? text
                      : lastMessage.text + text,
                  progress: metadata.progress || 0,
                  totalChunks: metadata.totalChunks || 1,
                  currentChunk: metadata.currentChunk || 1,
                  isStreaming:
                    metadata.streaming !== false && !metadata.isComplete,
                };
              }

              return updatedMessages;
            });
          },
        );
      } else {
        // 通常モードの場合（ストリーミングOFF）
        // ボットの応答用のプレースホルダーを追加
        const placeholderMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: "考え中...",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, placeholderMessage]);

        // 非ストリーミングチャットメッセージを送信（コールバック関数を渡す）
        const response = await sendChatMessage(
          userMessage.text,
          (text: string, metadata: any) => {
            // 最終的な応答を受信したときのコールバック
            setMessages((prevMessages) => {
              const updatedMessages = [...prevMessages];
              const lastMessage = updatedMessages[updatedMessages.length - 1];

              if (
                lastMessage &&
                lastMessage.sender === "bot" &&
                lastMessage.text === "考え中..."
              ) {
                // 「考え中...」のプレースホルダーを更新
                updatedMessages[updatedMessages.length - 1] = {
                  ...lastMessage,
                  text: text,
                };
              }

              return updatedMessages;
            });
          },
        );

        // 応答がコールバックで処理されなかった場合のフォールバック
        // 注意: chat.tsが空のテキストを返すように変更されたため、
        // responseが空の場合はコールバックで処理されたと見なす
        if (response && response.trim() !== "") {
          setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];

            // 最後のメッセージがまだプレースホルダーの場合のみ更新
            if (
              lastMessage &&
              lastMessage.sender === "bot" &&
              lastMessage.text === "考え中..."
            ) {
              const updatedMessages = [...prevMessages];
              updatedMessages[updatedMessages.length - 1] = {
                ...lastMessage,
                text: response,
              };
              return updatedMessages;
            }

            return prevMessages;
          });
        }
      }

      // 処理完了のログ出力
      console.log(`Message sent successfully. Streaming mode: ${useStreaming}`);
    } catch (err) {
      // エラーが発生した場合はエラーメッセージを設定
      setError(
        `メッセージ送信エラー: ${err instanceof Error ? err.message : String(err)}`,
      );
      console.error("Message sending error:", err);

      // エラーメッセージをボットメッセージとして表示
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `エラーが発生しました: ${err instanceof Error ? err.message : String(err)}`,
        sender: "bot",
        timestamp: new Date(),
      };

      // ストリーミングモードの場合は、プレースホルダーを置き換える
      if (useStreaming) {
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          // 最後のメッセージがストリーミング中のものであれば置き換え、そうでなければ追加
          if (
            updatedMessages.length > 0 &&
            updatedMessages[updatedMessages.length - 1].isStreaming
          ) {
            updatedMessages[updatedMessages.length - 1] = errorMessage;
            return updatedMessages;
          } else {
            return [...prevMessages, errorMessage];
          }
        });
      } else {
        // 通常モードの場合は単純に追加
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      }
    } finally {
      setLoading(false); // 読み込み中状態をfalseに設定
    }
  };

  // セッションを終了する関数 - ボタンクリック時に実行
  const handleTerminateSession = async () => {
    setLoading(true); // 読み込み中状態をtrueに設定
    setError(null); // エラー状態をクリア
    setConnectionState("disconnected"); // 接続状態を「切断」に設定

    try {
      await terminateSession(); // MCPサーバーとのセッションを終了
      updateSessionStatus(); // セッション状態を更新

      // セッション終了メッセージをボットメッセージとして表示
      const systemMessage: Message = {
        id: Date.now().toString(),
        text: "セッションが終了しました。新しい会話を始めるには、ページを再読み込みしてください。",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, systemMessage]);

      // セッション終了のログ出力
      console.log("Session terminated successfully");
    } catch (err) {
      // エラーが発生した場合はエラーメッセージを設定
      setError(
        `セッション終了エラー: ${err instanceof Error ? err.message : String(err)}`,
      );
      console.error("Session termination error:", err);
    } finally {
      setLoading(false); // 読み込み中状態をfalseに設定
    }
  };

  // Enterキーが押されたときにメッセージを送信する関数 - テキストエリアでのキー押下時に実行
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enterキーが押され、かつShiftキーが押されていない場合、かつIME変換中でない場合
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault(); // デフォルトの改行動作を防止
      handleSendMessage(); // メッセージ送信処理を実行
    }
  };

  // コンポーネントのレンダリング - UIの構造を定義
  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* ヘッダー部分 */}
      <div className="p-4">
        {/* ページタイトル */}
        <h1 className="text-3xl font-bold mb-4 text-center">
          MCP ストリーミングチャット
        </h1>

        {/* セッション情報セクション - 現在のセッション状態を表示 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center">
            {/* 接続状態表示 - 接続状態に応じて色とアイコンを変更 */}
            <ConnectionStatus state={connectionState} />

            {/* セッションID表示 - セッションの有無に応じて色を変更 */}
            <div
              className={`p-2 rounded-md ${
                sessionId
                  ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100" // セッションがある場合は緑色
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {sessionId
                ? `セッション: ${sessionId.substring(0, 8)}...`
                : "セッションなし"}
            </div>

            {/* ストリーミングモード切り替えスイッチ */}
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                ストリーミング:
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useStreaming}
                  onChange={() => setUseStreaming(!useStreaming)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* セッション終了ボタン - セッションがない場合や読み込み中は無効化 */}
            <button
              onClick={handleTerminateSession} // クリック時にセッション終了処理を実行
              disabled={!sessionId || loading} // セッションがない場合や読み込み中は無効化
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 text-sm rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              セッション終了
            </button>
          </div>
        </div>
      </div>

      {/* チャットメッセージ表示エリア - メッセージの履歴を表示（可変高さ） */}
      <div className="flex-grow overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-md mx-4 mb-2">
        <div className="h-full overflow-y-auto p-4">
          {/* メッセージがない場合の表示 */}
          {messages.length === 0 && !loading && (
            <div className="flex items-center justify-center h-full text-gray-500">
              メッセージはありません
            </div>
          )}

          {/* 読み込み中の表示 */}
          {loading && messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-500">
              読み込み中...
            </div>
          )}

          {/* メッセージ一覧 - 各メッセージを送信者に応じて異なるスタイルで表示 */}
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white" // ユーザーメッセージは青色
                      : message.isStreaming
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 relative" // ストリーミング中のメッセージは相対位置指定
                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200" // ボットメッセージはグレー
                  }`}
                >
                  {/* メッセージ本文 - 改行を保持して表示 */}
                  <p className="whitespace-pre-wrap">
                    {message.text}
                    {/* ストリーミング中のメッセージにはタイピングインジケーターを表示 */}
                    {message.isStreaming && (
                      <span className="typing-indicator ml-1 inline-block w-2 h-4 bg-transparent border-r-2 border-current animate-pulse"></span>
                    )}
                  </p>

                  {/* ストリーミング中のメッセージにはプログレスバーを表示 */}
                  {message.isStreaming && message.progress !== undefined && (
                    <div className="w-full bg-gray-200 dark:bg-gray-600 h-1 mt-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-1 rounded-full transition-all duration-300 ease-in-out"
                        style={{ width: `${message.progress}%` }}
                      ></div>
                    </div>
                  )}

                  {/* ストリーミング中のメッセージには進捗情報を表示 */}
                  {message.isStreaming &&
                    message.currentChunk !== undefined &&
                    message.totalChunks !== undefined && (
                      <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                        {message.currentChunk}/{message.totalChunks} チャンク (
                        {message.progress !== undefined ? message.progress : 0}
                        %)
                      </p>
                    )}

                  {/* メッセージのタイムスタンプ - 小さく薄い色で表示 */}
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === "user"
                        ? "text-blue-200" // ユーザーメッセージのタイムスタンプは薄い青色
                        : "text-gray-500 dark:text-gray-400" // ボットメッセージのタイムスタンプは薄いグレー
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}{" "}
                    {/* 時刻のみ表示 */}
                  </p>
                </div>
              </div>
            ))}

            {/* 自動スクロール用の参照ポイント - 新しいメッセージが追加されたときにここまでスクロール */}
            <div ref={messagesEndRef} />

            {/* 読み込み中の表示（メッセージ送信中） */}
            {loading &&
              messages.length > 0 &&
              !messages[messages.length - 1].isStreaming && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-gray-800 dark:text-gray-200">
                    <div className="flex space-x-2">
                      <div
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* エラーメッセージ表示エリア - エラーがある場合のみ表示 */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-md">
          <p className="font-medium">エラーが発生しました</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* メッセージ入力エリア - ユーザーがメッセージを入力して送信するUI（画面下部に固定） */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mx-4 mb-4">
        <div className="flex space-x-2">
          {/* メッセージ入力フィールド - 複数行入力可能なテキストエリア */}
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown} // Enterキーでメッセージを送信
            placeholder="メッセージを入力してください..."
            className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
            rows={2} // 2行分の高さを確保
            disabled={loading || !sessionId} // 読み込み中またはセッションがない場合は無効化
          />

          {/* メッセージ送信ボタン - 読み込み中またはセッションがない場合は無効化 */}
          <button
            onClick={handleSendMessage} // クリック時にメッセージ送信処理を実行
            disabled={loading || !sessionId || !inputMessage.trim()} // 読み込み中、セッションがない、または空のメッセージの場合は無効化
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            送信
          </button>
        </div>

        {/* 送信ヒント - Enterキーでの送信方法を説明 */}
        <p className="text-xs text-gray-500 mt-1">
          Enterキーで送信、Shift+Enterで改行
        </p>
      </div>
    </div>
  );
}
