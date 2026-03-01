# FC今治 里山ドッグラン アーキテクチャ
最終更新: 2026-03-01

## 1. プロダクトの目的
FC今治 里山ドッグランを、予約システムではなく「犬と人の共助コミュニティOS」として運用する。中核データは「誰のどの犬が、いつ入っていつ出たか」であり、犬種可視化はその一次データから一貫して生成する。

## 2. コア概念
- `Identity(Member)`
  - LINEで一意 (`line_user_id`)
  - 利用停止 (`suspended_until`)
  - 連絡先 (`display_name`, `email`, `phone_number`)
- `Dog`
  - 犬種、サイズ、ワクチン期限/承認状態
  - 入場可能性の判定基準を保持
- `Entry`
  - 1回の利用実体
  - `checked_in_at` / `checked_out_at`
  - 犬情報スナップショットを保持

`Reservation` は `Entry` を円滑に生成するための補助線として扱う。

## 3. ドメイン依存ルール
- `accounts`: 他appへ依存しない
- `dogs`: `accounts` のみ参照
- `reservations`: `accounts`, `dogs` を参照
- `checkins`: `accounts`, `dogs`, `reservations` を参照
- `payments`: `reservations` に依存するが、状態侵食は最小
- `stats`: 他appの業務テーブルを直接参照しない
  - 原則は集計テーブル/集計ビューを参照
  - 例外として realtime は `Entry` 一次データを参照

## 4. 状態遷移
### Reservation
- `pending_payment -> confirmed -> checked_in -> completed`
- 分岐: `cancelled`, `no_show`, `expired`

### Payment
- `created -> paid`
- 分岐: `failed`, `refunded`

### Entry
- `in -> out`
- 例外: `invalid`

## 5. 業務フロー
1. LINEログイン
2. 犬登録（ワクチン証明アップロード）
3. スタッフ承認（`vaccine_approval_status`）
4. 予約作成
5. 決済
6. QRプレビュー（事前判定）
7. QRチェックイン（Entry生成）
8. チェックアウト（Entry確定）
9. 統計生成（realtime + 日次）

## 6. データモデル方針
- `Entry` を入退場の一次ソースとする
  - `reservation_id` nullable (将来の当日受付対応)
  - 犬スナップショット (`dog_name_snapshot`, `breed_snapshot`, `size_category_snapshot`, `weight_kg_snapshot`)
- `CheckinLog` は監査イベントログとして保持
- 集計は `BreedDailyStats(date, breed, total_checkins, unique_dogs, total_duration_minutes)` を使用
- 一意制約
  - `BreedDailyStats`: `(date, breed)` unique

## 7. API（フロー起点）
### Checkin
- `GET /api/v1/checkins/qr/{token}/preview`
  - 予約内容、犬情報、時間窓、可否理由を返す
- `POST /api/v1/checkins/qr`
  - チェックイン実行（重複は 409）
- `POST /api/v1/checkins/checkout`
  - スタッフチェックアウト

### Stats
- `GET /api/v1/stats/current`
- `GET /api/v1/stats/breeds/realtime`
- `GET /api/v1/stats/breeds/daily?date=YYYY-MM-DD`
- `GET /api/v1/stats/breeds/monthly?month=YYYY-MM`
- 互換API: `GET /api/v1/stats/breeds?period=...`

## 8. 集計設計
- realtime
  - ソース: `Entry(status=in, checked_out_at is null)`
  - 用途: 現在の犬種構成、混雑表示
- daily/monthly
  - ソース: `BreedDailyStats`
  - 生成: 管理コマンド `rebuild_breed_daily_stats`

## 9. 運用設計（例外・監査・再実行）
- Stripe webhook
  - 冪等化を前提（`event_id` 永続化を次フェーズで追加）
- QR重複
  - 同一予約の再チェックインは `409 Conflict`
- 自動チェックアウト
  - 営業時間 + grace経過でバッチ確定
  - `Entry` と `CheckinLog` を同期更新
- 監査
  - `CheckinLog.metadata` / `PaymentRecord.payload` を保持
  - 管理操作は actor を `metadata` に残す

## 10. 実装順（バイブコーディング）
1. BreedMaster + 犬種入力揺れ対策
2. Entry中心化（checkin/outでEntry生成）
3. realtime統計をEntry基準に統一
4. 日次集計バッチの固定化
5. `/stats/breeds/*` API群
6. 可視化UIの拡張

## 11. 現在の到達点（2026-03-01）
- Entryモデル導入済み
- QR preview API導入済み
- realtime統計をEntry一次ソース化済み
- `/stats/breeds/realtime|daily|monthly` 導入済み

## 12. 次フェーズ
- `BreedMaster` 導入 (`Dog.breed_master` + `breed_raw`)
- Stripe webhook `event_id` 完全冪等化
- stats app を集計テーブル参照へさらに分離

## 13. 本番セキュリティ基準
- `DEPLOY_ENV=production` では fail-close で起動チェックする
  - `SECRET_KEY` 未設定/既定値は禁止
  - `DEBUG=True` 禁止
  - `LINE_LOGIN_MOCK=True` 禁止
  - `STRIPE_MOCK=False` なら `STRIPE_WEBHOOK_SECRET` 必須
  - `ALLOWED_HOSTS` / `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` の localhost 設定禁止
- 公開系APIは DRF throttle を適用
  - `auth_line`, `stripe_webhook`, `public_availability`, `public_stats`, `public_content`
