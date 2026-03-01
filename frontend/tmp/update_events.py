import json
from pathlib import Path

events = [
  {
    "id": "event-tgf-2025",
    "slug": "tiny-garden-festival-2025",
    "title": "TINY GARDEN FESTIVAL ASICS SATOYAMA STADIUM 2025",
    "summary": "10/25-26開催。里山スタジアムを会場に、キャンプとマーケットで楽しむ2日間のガーデンフェスティバル。",
    "body_md": "# 里山スタジアムで味わう特別なガーデンフェスティバル\n\n株式会社アーバンリサーチとFC今治が共催する《TINY GARDEN FESTIVAL ASICS SATOYAMA STADIUM 2025》は、\"小さな庭先で繰り広げられるガーデンパーティー\"をコンセプトにした2日間の野外イベントです。マーケットやワークショップ、里山の空気を感じるキャンプサイトまで、家族や仲間と過ごす豊かな時間をご用意しました。\n\n## 開催概要\n- 日時: 2025年10月25日（土）10:00〜26日（日）21:00（予定）\n- 会場: アシックス里山スタジアム（愛媛県今治市高橋ふれあいの丘1-3）\n- 参加費: マーケットエリア入場無料 / キャンプサイト 15,000円〜20,000円（税込）\n- 主催: FC. IMABARI & URBAN RESEARCH Co.,Ltd.\n\n## 見どころ\n### ペットと泊まれるキャンプサイト\nスタジアム北側ゴール裏のサイトはペットと一緒に宿泊が可能。プロのカメラマンによる宿泊者限定の記念撮影や、朝のピッチサイドアクティビティなど特典も充実しています。\n\n### 里山プラザサイトの追加販売\nしまなみの海と今治の街並みを一望できる里山プラザに、追加のフリーサイト（8m×8m）が登場。フォトスポットとして人気のエリアで、特別なキャンプ時間を過ごせます。\n\n### マーケット&ワークショップ\nアーバンリサーチのオフィシャルブースや地域の人気店が集うマーケット、親子で楽しめるワークショップ、夜は里山の小さな縁日など「衣・食・住・遊」のプログラムが勢揃い。\n\n## キャンプサイト料金（税込）\n- スタジアムサイト: 20,000円 / サイト（最大6名）\n- 里山プラザサイト: 15,000円 / サイト（最大6名）\n- 受付: 公式サイトにて事前予約制\n\n## 申込みについて\nアプリ内フォームから必要事項を入力のうえお申し込みください。ペット同伴の方は予防接種状況をご記入いただきます。スタッフ確認後、予約確定のご連絡を差し上げます。",
    "hero_image_url": "https://fcimabari-community.com/wp-content/uploads/2025/08/TGF25atIMABARI_KV02-1920-1280px.jpg",
    "start_at": "2025-10-25T10:00:00+09:00",
    "end_at": "2025-10-26T21:00:00+09:00",
    "provider_id": "tgf",
    "category": {"id": "c_festival", "name": "フェス", "slug": "festival"},
    "tags": [
      {"id": "tag-tgf", "name": "TGF", "slug": "tgf"},
      {"id": "tag-camping", "name": "キャンプ", "slug": "camp"},
      {"id": "tag-market", "name": "マーケット", "slug": "market"},
      {"id": "tag-pet", "name": "ペット", "slug": "pet"},
      {"id": "tag-workshop", "name": "ワークショップ", "slug": "workshop"}
    ],
    "venue": {
      "name": "アシックス里山スタジアム",
      "address": "愛媛県今治市高橋ふれあいの丘1-3",
      "lat": 34.0658,
      "lng": 132.9972
    },
    "application_type": "internal_form"
  },
  {
    "id": "event-tiny-garden-space",
    "slug": "tiny-garden-by-urban-research",
    "title": "TINY GARDEN by URBAN RESEARCH 誕生のお知らせ",
    "summary": "里山サロン裏庭が「TINY GARDEN by URBAN RESEARCH」としてリニューアル。地域に開かれた交流拠点づくりを進めます。",
    "body_md": "# 里山ジャルダンが新しい交流拠点に\n\nアシックス里山スタジアム内の里山サロン裏庭（里山ジャルダン）が、アーバンリサーチのネーミングライツ取得により《TINY GARDEN by URBAN RESEARCH》として生まれ変わりました。試合のない日にも人が集い、支え合い、つながっていく場所を目指した取り組みです。\n\n## 概要\n- 発表日: 2025年9月4日（木）\n- 場所: アシックス里山スタジアム 里山サロン裏庭\n- 施設概要: 多目的広場、遊具、イベント／休憩スペース\n\n## 取り組みの背景\n- 2021年から続くTINY GARDEN FESTIVALでの共創実績\n- 365日賑わうスタジアムを実現するための共働プロジェクト\n- 地域と来訪者が心豊かな時間を過ごせる場づくり\n\n## 今後の予定\n- 2025年秋、新しいシンボル空間をお披露目予定\n- URと連携したワークショップやマルシェを継続開催\n- 里山スタジアム発のコミュニティをさらに拡張\n\n## 申込みについて\nスペース活用の相談やイベント開催の希望がある方は、アプリ内フォームからお問い合わせください。担当スタッフより折り返しご連絡いたします。",
    "hero_image_url": "https://fcimabari-community.com/wp-content/uploads/2025/09/unnamed-1.png",
    "start_at": "2025-09-04T09:00:00+09:00",
    "end_at": "2025-09-04T18:00:00+09:00",
    "provider_id": "fcimabari",
    "category": {"id": "c_space", "name": "コミュニティスペース", "slug": "space"},
    "tags": [
      {"id": "tag-community", "name": "コミュニティ", "slug": "community"},
      {"id": "tag-naming", "name": "ネーミングライツ", "slug": "naming-rights"},
      {"id": "tag-urban-research", "name": "URコラボ", "slug": "urban-research"}
    ],
    "venue": {
      "name": "アシックス里山スタジアム 里山サロン裏庭",
      "address": "愛媛県今治市高橋ふれあいの丘1-3"
    },
    "application_type": "internal_form"
  },
  {
    "id": "event-asisato-trial-2025",
    "slug": "asisato-membership-trial-2025",
    "title": "アシさとクラブ 会員プログラム トライアル",
    "summary": "8/25〜11/30の期間限定で、ポイント制「アシさとトークン」とデジタルパスを試験導入。参加登録を募集しています。",
    "body_md": "# 会員プログラムを試験導入します\n\nアシさとクラブでは、2025年8月25日（月）〜11月30日（日）の期間で会員プログラムのトライアルを実施します。ウェルネス／エンジョイ／アスリートクラスの参加実績に応じてトークンを貯めたり、イベントごとにデザインが異なるデジタルパスを集めたりと、新しい楽しみ方をご体験ください。\n\n## トライアル内容\n### ① アシさとトークン\n- 各クラスやイベント参加、ゲーム結果に応じて付与\n- 貯めたトークンで有名アスリートイベントの優先・無料参加権やグッズをプレゼント\n- 会員全体の獲得数に応じたクラブパーティーを企画予定\n\n### ② アシさとデジタルパス\n- みちくさんぽ等のイベント申込みをアプリに一本化\n- 参加イベントごとに異なるパスデザインをコレクション\n- 従来のe-moshicom掲載も継続しながら段階的に移行\n\n## 仮会員登録について\n- 参加予定の方は専用フォームから仮会員登録をお願いします\n- 登録後はアプリをブックマークし、最新イベント情報をチェック\n- Instagram・LINEの公式アカウントでも随時情報を発信\n\n## 申込み方法\nアプリ内フォームに必要事項を入力して送信してください。折り返し、会員IDと利用開始手順をメールでご案内します。",
    "hero_image_url": "https://fcimabari-community.com/wp-content/uploads/2025/09/スクリーンショット-2025-09-01-163600.png",
    "start_at": "2025-08-25T09:00:00+09:00",
    "end_at": "2025-11-30T23:59:00+09:00",
    "provider_id": "asisato",
    "category": {"id": "c_program", "name": "クラブプログラム", "slug": "program"},
    "tags": [
      {"id": "tag-membership", "name": "会員募集", "slug": "membership"},
      {"id": "tag-token", "name": "トークン", "slug": "token"},
      {"id": "tag-digital-pass", "name": "デジタルパス", "slug": "digital-pass"}
    ],
    "venue": {
      "name": "アシさとクラブ（今治里山スタジアムほか）",
      "address": "愛媛県今治市高橋ふれあいの丘1-3"
    },
    "application_type": "internal_form"
  },
  {
    "id": "event-satoyama-workshop",
    "slug": "satoyama-playground-workshop",
    "title": "里山ジャルダン 遊具リニューアル ワークショップ",
    "summary": "9/6開催。丸太のペイントと木のコースターづくりで、里山ジャルダンの小さな遊具をみんなで再生します。",
    "body_md": "# 里山ジャルダンを手づくりで彩ろう\n\n里山サロン裏庭（里山ジャルダン）にある木製遊具をアップデートする参加型ワークショップです。アーバンリサーチとFC今治スタッフと一緒に、色鮮やかな丸太ペイントと木のコースターづくりに挑戦します。\n\n## 開催概要\n- 日時: 2025年9月6日（土）10:00〜15:00\n- 会場: アシックス里山スタジアム 里山ジャルダン\n- 参加費: 丸太ペイント 無料 / コースターづくり 550円（税込）\n- 定員: 各プログラム 先着制\n\n## プログラム\n### 丸太のペイントワークショップ\n- 時間: 10:00〜12:00 / 13:00〜14:30\n- 内容: 色あせた丸太をカラフルに塗装し、新しい遊具として蘇らせます\n- 仕上げ: プロの大工・設計士が仕上げた平均台としてお披露目予定\n\n### 木のコースターづくり\n- 時間: 10:00〜12:00 / 13:00〜15:00（随時受付）\n- 所要時間: 約15分（おひとり1点まで）\n- 内容: FC今治×URロゴの型紙を使い、好きな色でスプレー転写\n\n## 注意事項\n- 水性ペンキを使用しますので、汚れても良い服装でお越しください\n- 活動の様子を公式サイトやSNSで紹介する場合があります\n\n## 申込みについて\n事前申込みで参加枠を確保いただけます。空きがある場合は当日参加も可能です。フォーム送信後、詳細をメールでご案内します。",
    "hero_image_url": "https://fcimabari-community.com/wp-content/uploads/2025/08/IMG_9239-1024x768.jpg",
    "start_at": "2025-09-06T10:00:00+09:00",
    "end_at": "2025-09-06T15:00:00+09:00",
    "provider_id": "fcimabari",
    "category": {"id": "c_workshop", "name": "ワークショップ", "slug": "workshop"},
    "tags": [
      {"id": "tag-family", "name": "親子向け", "slug": "family"},
      {"id": "tag-diy", "name": "DIY", "slug": "diy"},
      {"id": "tag-ur-collab", "name": "UR連携", "slug": "ur-collab"}
    ],
    "venue": {
      "name": "アシックス里山スタジアム 里山ジャルダン",
      "address": "愛媛県今治市高橋ふれあいの丘1-3",
      "lat": 34.0658,
      "lng": 132.9972
    },
    "application_type": "internal_form"
  },
  {
    "id": "event-art-venture-2025",
    "slug": "art-venture-ehime-fes-2025",
    "title": "art venture ehime fes 2025 今治・里山ゾーン",
    "summary": "10/18〜11/3開催。今治エリア・里山ゾーンでの参加アーティストが決定。スタジアムを舞台にしたアート体験を準備中です。",
    "body_md": "# art venture ehime fes 2025 に今治・里山ゾーンが参加\n\n愛媛県と東京藝術大学が主催するアートコミュニケーションプロジェクト《art venture ehime fes 2025》において、アシックス里山スタジアムは今治市エリア・里山ゾーンとして作品展示とプログラムを展開します。\n\n## 開催概要\n- 期間: 2025年10月18日（土）〜11月3日（月・祝）\n- 会場: アシックス里山スタジアム（愛媛県今治市）ほか県内8ゾーン\n- 参加アーティスト: FC今治高等学校里山校 Music Class / 来島会 with 瀬戸内サーカスファクトリー / 五十嵐 裕美\n\n## プロジェクトについて\n- アートを介して地域課題に向き合い、新たな価値と関係性を生み出す県民参加型フェスティバル\n- 福祉・スポーツ・観光・食・まちづくりなど多分野と連携\n- 今治会場では里山ゾーンならではのインスタレーションやワークショップを予定\n\n## 今後の予定\n- ホームゲームや地域イベントと連動した企画を順次発表\n- 作品制作に参加できるプログラムも準備中（詳細は近日公開）\n\n## 申込みについて\nアートプログラムへの参加希望者は事前登録をお願いします。参加希望内容をフォームに記入いただき、各メニューの詳細決定後にご案内をお送りします。",
    "hero_image_url": "https://fcimabari-community.com/wp-content/uploads/2025/09/LINE_ALBUM_TGF0918KV_250918_1.jpg",
    "start_at": "2025-10-18T10:00:00+09:00",
    "end_at": "2025-11-03T18:00:00+09:00",
    "provider_id": "fcimabari",
    "category": {"id": "c_art", "name": "アート", "slug": "art"},
    "tags": [
      {"id": "tag-art", "name": "アート", "slug": "art"},
      {"id": "tag-fes", "name": "フェス", "slug": "fes"},
      {"id": "tag-satoyama", "name": "里山ゾーン", "slug": "satoyama"}
    ],
    "venue": {
      "name": "アシックス里山スタジアム",
      "address": "愛媛県今治市高橋ふれあいの丘1-3"
    },
    "application_type": "internal_form"
  },
  {
    "id": "event-belt-runs-workshop",
    "slug": "satoyama-belt-runs-workshop",
    "title": "Satoyama Belt runs ワークショップ",
    "summary": "8/24開催。アーティスト五十嵐裕美さんと一緒に、art venture ehime fes 2025で展示する作品づくりに参加しよう。",
    "body_md": "# Satoyama Belt runs ワークショップ\n\n10月に開催される《art venture ehime fes 2025》で展示される作品「Satoyama Belt runs」に、自分の描いたピースを組み込むワークショップです。アーティスト五十嵐裕美さんと一緒に、里山スタジアムを彩るアートを制作しましょう。\n\n## 開催概要\n- 日時: 2025年8月24日（日）\n  - 1回目 13:00〜14:00\n  - 2回目 14:30〜15:30\n- 会場: アシックス里山スタジアム（愛媛県今治市高橋ふれあいの丘1-3）\n- 対象: 年齢問わず（親子参加歓迎）\n- 定員: 各回10組（先着順・1組2名まで）\n- 参加費: 無料\n\n## 募集について\n- 受付締切: 2025年8月20日（水）17:00 ※先着順\n- 参加確定: 8月21日（木）までにメールでご連絡\n- 持ち物: 特になし（汚れても良い服装でご参加ください）\n\n## 個人情報の取扱い\n取得した情報はワークショップ運営・連絡・記録・アンケートのみに利用します。\n\n## 申込み方法\nフォームに希望回・参加人数・代表者情報をご記入ください。受付後、事務局から確認メールをお送りします。",
    "hero_image_url": "https://fcimabari-community.com/wp-content/uploads/2025/08/4E8567C7-3F5E-4F3D-A4C0-FA19CCD4E347-1024x606.jpg",
    "start_at": "2025-08-24T13:00:00+09:00",
    "end_at": "2025-08-24T15:30:00+09:00",
    "provider_id": "fcimabari",
    "category": {"id": "c_artworkshop", "name": "アートワークショップ", "slug": "art-workshop"},
    "tags": [
      {"id": "tag-art-workshop", "name": "アート制作", "slug": "art-making"},
      {"id": "tag-community-art", "name": "コミュニティアート", "slug": "community-art"},
      {"id": "tag-free", "name": "参加無料", "slug": "free"}
    ],
    "venue": {
      "name": "アシックス里山スタジアム",
      "address": "愛媛県今治市高橋ふれあいの丘1-3",
      "lat": 34.0658,
      "lng": 132.9972
    },
    "application_type": "internal_form"
  }
]

Path('src/mock/events.json').write_text(json.dumps(events, ensure_ascii=False, indent=2), encoding='utf-8')
print('Updated events dataset with', len(events), 'items')
