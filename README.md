# 艦これ艦娘育成支援 GoogleChrome拡張
艦これの艦娘育成を支援する Google Chrome 拡張（KanColle-YPS改造版）
* 開発サイト: https://github.com/yamagen75/KanColleRaiseSup
* 公開サイト: http://yamagen75.github.io/KanColleRaiseSup/

## インストール方法
Flash PlayerはChrome内蔵のほうを使用してください

1. ソースコード一式をダウンロードする
2. Google Chromeの拡張機能設定ページを開く(右肩の三本線→設定→左列の拡張機能)
3. 「デベロッパー モード」にチェックを入れる
4. 「パッケージ化されていない拡張機能を読み込む…」ボタンを押して、ダウンロードしてきたソースコード一式が含まれるディレクトリを指定する(これで拡張機能がインストールされます)

## 使い方
1. Google Chromeで艦これにログインする
2. Google Chromeの「デベロッパーツール」を起動する
 * **艦これのゲーム画面が表示された直後にデベロッパーツールを起動してください**
 * Opt+Cmd+I(Mac)，Windowsの場合、Ctrl+Shift+I または F12 キーを押して起動します
 * (右肩の三本線→その他のツール→デベロッパーツール)でも起動します
3. デベロッパーツールに「艦これ情報」のタブが追加されるのでクリックしてください
 * 「艦これ情報」のタブが追加されない場合には、艦これのゲーム画面でデベロッパーツールを起動し直してください
4. 艦これ情報の画面に「ゲーム情報の取得に成功しました」と表示されたら、このツールは使用可能です
 * 「ゲーム情報の取得に成功しました」と表示されない場合には、ブラウザをリロード(再読み込み)してください

### 「ゲーム情報の取得に成功しました」のメッセージ表示
![ゲーム情報の取得に成功しました](http://yamagen75.github.io/KanColleRaiseSup/SS/01.png)

## このツールの特徴
1. 艦娘のコンディション値(戦意高揚値)、次のレベルまでの経験値等を表示します
2. 艦娘保有数、装備保有数、未ロック艦数、未ロック艦装備アイテム数等を表示します
3. 全艦隊の一覧、全艦娘の一覧、未ロック艦、入渠,損傷艦、改修可能艦、建造艦等を表示します
4. 遂行中任務、遠征中一覧、キラキラ艦数、改修可能艦数、損傷艦数、修理中、建造中等を表示します
5. 装備アイテムの一覧(艦娘使用分、全装備)、ダブリ艦、改造可能艦等を表示します
6. あ号任務については、その内訳（出撃数、ボス勝利、ボス到達、S勝利）を表示します
7. 演習、遠征、入渠について、任務のチェック漏れを防ぐ為の通知を表示します
8. 戦闘画面では、敵味方艦隊のダメージ(撃沈、大破、中破、小破)と戦果を表示します
9. 戦闘後の補給や遠征帰還後、任務達成後等の資材増減を表示します
10. その他→艦娘一覧で保有艦娘の一覧をExcel等へコピー＆ペーストしやすい形で表示しています
11. DMMのヘッダーを非表示にする事が出来ます(表示させる事も可能です)
12. 艦これをブラウザのサブウィンドウで実行する事が出来ます

## このツールの動作画面サンプル
![任務他](http://yamagen75.github.io/KanColleRaiseSup/SS/02.png)
![全艦隊](http://yamagen75.github.io/KanColleRaiseSup/SS/03.png)
![艦隊１](http://yamagen75.github.io/KanColleRaiseSup/SS/04.png)
![艦隊２](http://yamagen75.github.io/KanColleRaiseSup/SS/05.png)
![全艦](http://yamagen75.github.io/KanColleRaiseSup/SS/06.png)
![未ロック艦](http://yamagen75.github.io/KanColleRaiseSup/SS/07.png)
![入渠](http://yamagen75.github.io/KanColleRaiseSup/SS/08.png)
![改装](http://yamagen75.github.io/KanColleRaiseSup/SS/09.png)
![工廠](http://yamagen75.github.io/KanColleRaiseSup/SS/10.png)
![戦闘](http://yamagen75.github.io/KanColleRaiseSup/SS/11.png)
![使用中装備](http://yamagen75.github.io/KanColleRaiseSup/SS/12.png)
![全装備](http://yamagen75.github.io/KanColleRaiseSup/SS/13.png)
![ダブリ艦＆改造可能艦](http://yamagen75.github.io/KanColleRaiseSup/SS/14.png)
![艦娘一覧コピー用](http://yamagen75.github.io/KanColleRaiseSup/SS/15.png)
![任務チェックメッセージ](http://yamagen75.github.io/KanColleRaiseSup/SS/16.png)

## 注意事項
* 修復要員、修復女神の装備表示は、修復発動後の変動に対応していない可能性があるので、表示を鵜呑みにすると危険です。大破進撃は自己責任でお願いします
* 装備の開発や艦娘の建造等で増えた装備アイテムが今まであった装備とは別でカウントされる場合があります(このような場合でも、艦隊を出撃させて母港へ戻った段階で装備アイテムのカウントが統一される事を確認しています)

## 仕組みなど
元々Google Chromeにあるネットワークをモニタリングする機能を使って、サーバから送られてくる各種情報を拾い、ツール画面に表示します。
完全にパッシブ動作で、ゲームサーバへのリクエスト送信はしません。自動実行機能もありません。
仕組み上、ゲーム画面の演出進行と、こちらの表示更新のタイミングは合いません。先に結果が表示されてしまいますがご容赦ください。

## 参考プロジェクト
下記の本家3を元にして自分が求めるユーザーインターフェイスの構築や機能追加をしました
* 本家  https://github.com/kageroh/cond_checker
* 本家2 https://github.com/t-f-m/cond_checker_mod 本家よりも少し機能追加されている
* 本家3 https://github.com/hkuno9000/KanColle-YPS 本家2よりもさらに機能追加がされている

艦これをサブウィンドウで実行する機能については下記を参考にしています
* https://twitter.com/mooooogle/status/395198479141588992

ユーザーインターフェイスの構築には下記プロジェクトやブログを参考にしています
* https://bitbucket.org/feiz/kancolle_inspector
* http://feiz.hateblo.jp/entry/2013/11/27/203704

ユーザーインターフェイス等のリソースに下記を使用しています
* FatCow http://www.fatcow.com/free-icons
* Bootstrap http://getbootstrap.com/
* Font Awesome http://fortawesome.github.io/Font-Awesome/

