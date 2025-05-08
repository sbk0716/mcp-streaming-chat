import { faker } from "@faker-js/faker/locale/ja"; // 日本語ロケールのFakerライブラリをインポート - ダミーデータ生成に使用

/**
 * クライアントメッセージに基づいて応答を生成する関数
 * クライアントのメッセージを解析し、適切なfaker.js関数を使用して応答を生成します
 *
 * @param clientMessage クライアントから送信されたメッセージ
 * @returns 生成された応答メッセージ
 */
export function generateResponseFromClientMessage(
  clientMessage: string,
): string {
  // 応答生成関数の定義 - 文字列を返す
  // クライアントメッセージを小文字に変換して検索しやすくする
  const lowerCaseMessage = clientMessage.toLowerCase(); // 大文字小文字を区別せずにキーワード検索するため小文字に変換

  // メッセージの長さに基づいて応答の長さを調整
  const responseLength = Math.min(Math.max(clientMessage.length / 10, 1), 5); // 入力の長さに比例した応答長を計算（最小1、最大5）

  // キーワードに基づいてテーマを選択
  let response = ""; // 応答文を格納する変数を初期化

  // 挨拶に関するキーワード
  if (
    lowerCaseMessage.includes("こんにちは") || // 「こんにちは」を含む場合
    lowerCaseMessage.includes("hello") || // 「hello」を含む場合
    lowerCaseMessage.includes("hi") || // 「hi」を含む場合
    lowerCaseMessage.includes("おはよう") || // 「おはよう」を含む場合
    lowerCaseMessage.includes("こんばんは") // 「こんばんは」を含む場合
  ) {
    // 挨拶を返す
    response = `${clientMessage}！${faker.person.firstName()}です。${faker.person.bio()}`; // 挨拶に対して名前と自己紹介を返す
  }
  // 質問に関するキーワード
  else if (
    lowerCaseMessage.includes("?") || // 半角クエスチョンマークを含む場合
    lowerCaseMessage.includes("？") || // 全角クエスチョンマークを含む場合
    lowerCaseMessage.includes("ですか") || // 「ですか」を含む場合
    lowerCaseMessage.includes("何") || // 「何」を含む場合
    lowerCaseMessage.includes("誰") || // 「誰」を含む場合
    lowerCaseMessage.includes("どこ") || // 「どこ」を含む場合
    lowerCaseMessage.includes("いつ") || // 「いつ」を含む場合
    lowerCaseMessage.includes("なぜ") || // 「なぜ」を含む場合
    lowerCaseMessage.includes("どうして") // 「どうして」を含む場合
  ) {
    // 質問に対する回答を生成
    response = `「${clientMessage}」という質問ですね。${faker.lorem.paragraph(Math.ceil(responseLength))}`; // 質問に対してランダムな段落を生成
  }
  // 食べ物に関するキーワード
  else if (
    lowerCaseMessage.includes("食べ物") || // 「食べ物」を含む場合
    lowerCaseMessage.includes("料理") || // 「料理」を含む場合
    lowerCaseMessage.includes("レストラン") || // 「レストラン」を含む場合
    lowerCaseMessage.includes("食事") || // 「食事」を含む場合
    lowerCaseMessage.includes("おいしい") // 「おいしい」を含む場合
  ) {
    // 食べ物に関する応答を生成
    response = `食べ物といえば、${faker.commerce.productName()}が好きです。${faker.commerce.productDescription()}`; // 商品名と商品説明を使って食べ物の話題を生成
  }
  // 天気に関するキーワード
  else if (
    lowerCaseMessage.includes("天気") || // 「天気」を含む場合
    lowerCaseMessage.includes("雨") || // 「雨」を含む場合
    lowerCaseMessage.includes("晴れ") || // 「晴れ」を含む場合
    lowerCaseMessage.includes("気温") // 「気温」を含む場合
  ) {
    // 天気に関する応答を生成
    const weather = faker.helpers.arrayElement([
      "晴れ",
      "曇り",
      "雨",
      "雪",
      "霧",
    ]); // ランダムな天気を選択
    const temp = faker.number.int({ min: 0, max: 35 }); // 0〜35度のランダムな気温を生成
    response = `今日の天気は${weather}で、気温は${temp}度です。${faker.lorem.sentence()}`; // 天気と気温を含む応答を生成
  }
  // 技術に関するキーワード
  else if (
    lowerCaseMessage.includes("技術") || // 「技術」を含む場合
    lowerCaseMessage.includes("プログラミング") || // 「プログラミング」を含む場合
    lowerCaseMessage.includes("コード") || // 「コード」を含む場合
    lowerCaseMessage.includes("開発") || // 「開発」を含む場合
    lowerCaseMessage.includes("エンジニア") // 「エンジニア」を含む場合
  ) {
    // 技術に関する応答を生成
    response = `技術についてですね。${faker.hacker.phrase()}。${faker.lorem.paragraph(Math.ceil(responseLength))}`; // ハッカー用語とランダムな段落を組み合わせて技術的な応答を生成
  }
  // デフォルトの応答
  else {
    // クライアントメッセージを引用して応答
    response = `「${clientMessage}」について考えてみました。${faker.lorem.paragraphs(Math.ceil(responseLength), " ")}`; // 入力を引用し、ランダムな段落を生成
  }

  return response; // 生成した応答を返す
}
