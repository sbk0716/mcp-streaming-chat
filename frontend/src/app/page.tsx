"use client"; // Next.jsのクライアントコンポーネントであることを宣言 - サーバーサイドではなくブラウザで実行される

// Next.jsのdynamic importを使用してコンポーネントを動的に読み込む - コード分割とレイジーローディングを実現
import dynamic from "next/dynamic";

// ChatClientコンポーネントをクライアントサイドでのみ読み込む - サーバーサイドレンダリング(SSR)を無効化
const ChatClient = dynamic(() => import("./components/ChatClient"), {
  ssr: false, // サーバーサイドレンダリングを無効化 - MCPクライアントはブラウザ環境でのみ動作するため
  loading: () => (
    <p className="text-center p-8">チャットクライアントを読み込み中...</p>
  ), // 読み込み中に表示するフォールバックUI
});

// ホームページコンポーネント - アプリケーションのメインページ
export default function Home() {
  return (
    // 最小高さを画面いっぱいに設定し、背景色を設定（ライト/ダークモード対応）
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 動的に読み込まれるChatClientコンポーネントを配置 */}
      <ChatClient />
    </div>
  );
}
