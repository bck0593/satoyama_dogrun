# FC今治 里山ドッグラン システムアーキテクチャ

最終更新: 2026-02-28  
対象: MVP（本番運用品質）

## 0. 仕様ソースと前提

- 本ドキュメントは以下を統合した最新版設計書です。
  - 合意済み要件（会員管理 / 犬登録 / 予約 / 決済 / QRチェックイン / 利用状況可視化 / 管理画面）
  - 現行実装（`backend` / `frontend`）
  - 既存設計メモ（旧 `architecture.md`）
- コメント:
  - リポジトリ直下の `dogrun.md` 実ファイルは現時点で確認できないため、要件は合意済み仕様と現実装を基準化。

## 1. 目的と非機能目標

- 目的:
  - ドッグラン運営の受付・予約・決済・当日導線を一本化し、現場オペレーションを簡素化する。
- 非機能目標:
  - MVPで実運用可能
  - API/Frontend 分離
  - 将来のマイクロサービス分割可能な構造
  - Azure 本番配備前提

## 2. システム構成

```text
[Next.js Frontend] --HTTPS/JSON--> [Django REST API]
        |                                  |
        | JWT (Bearer)                     | ORM
        v                                  v
  Browser Storage                      PostgreSQL
        |
        +-- Stripe Checkout ---------> Stripe
        |
        +-- LINE Login (id_token) ---> LINE Verify API

Media: Azure Blob Storage
Logs/Monitoring: Application Insights
Deploy: Azure App Service (frontend / backend)
```

## 3. リポジトリ構成（現行）

```text
FCimabari_Dogrun/
├─ backend/
│  ├─ config/
│  │  ├─ settings.py
│  │  ├─ urls.py
│  │  └─ api_urls.py
│  ├─ apps/
│  │  ├─ accounts/
│  │  ├─ dogs/
│  │  ├─ reservations/
│  │  ├─ payments/
│  │  ├─ checkins/
│  │  ├─ stats/
│  │  └─ common/
│  ├─ tests/
│  ├─ scripts/
│  ├─ requirements.txt
│  └─ Dockerfile
├─ frontend/
│  ├─ app/
│  │  ├─ page.tsx
│  │  ├─ login/page.tsx
│  │  ├─ mypage/page.tsx
│  │  ├─ dog-registration/page.tsx
│  │  ├─ reservation/page.tsx
│  │  ├─ checkin/page.tsx
│  │  ├─ live-status/page.tsx
│  │  └─ admin/page.tsx
│  ├─ src/
│  │  ├─ components/
│  │  ├─ contexts/
│  │  ├─ hooks/
│  │  └─ lib/
│  ├─ app_legacy/      # UI参照元
│  └─ Dockerfile
├─ docker-compose.yml
└─ docs/
   ├─ architecture.md
   └─ azure-deploy.md
```

## 4. バックエンド設計

### 4.1 レイヤ

- API: DRF View/ViewSet
- Domain: `models.py` + `serializers.py` + `services.py`
- Infra: Django ORM, Storage backend, Stripe SDK, requests(LINE verify)

### 4.2 ドメインモデル（主要）

#### accounts

- `User`
  - `line_user_id` (unique)
  - `display_name`, `email`, `phone_number`
  - `no_show_count`, `suspended_until`
  - `is_suspended` プロパティで利用停止判定

#### dogs

- `Dog`
  - `owner`, `name`, `breed`, `weight_kg`, `size_category`
  - `birth_date`, `vaccine_expires_on`, `vaccine_proof_image`
  - `is_restricted_breed`, `is_active`, `notes`
- `RestrictedBreed`
  - 危険犬種マスタ

#### reservations

- `FacilityRule`（運用ルールのDB管理）
  - `open_time`, `close_time`, `slot_minutes`
  - `max_total_dogs_per_slot`, `max_large_dogs_per_slot`
  - `max_dogs_per_owner`
  - `allow_restricted_breeds`
  - `checkin_open_minutes_before`, `checkin_close_minutes_after_start`
  - `cancellation_refund_hours`
  - `max_no_show_before_suspension`, `suspension_days`
  - `base_fee_per_dog`
- `Reservation`
  - `date`, `start_time`, `end_time`, `party_size`
  - `status`:
    - `pending_payment`, `confirmed`, `checked_in`, `completed`, `cancelled`, `no_show`
  - `payment_status`:
    - `unpaid`, `paid`, `refunded`, `failed`
  - `qr_token`
- `ReservationDog`
  - 予約時点の犬スナップショット保持
- `NoShowRecord`
  - no-show発生記録

#### checkins

- `CheckinLog`
  - `action`: `check_in` / `check_out`
  - `source`: `qr` / `admin` など
  - `metadata` で監査情報保持

#### payments

- `PaymentRecord`
  - `checkout_session_id`, `payment_intent_id`
  - `amount`, `currency`, `status`, `refunded_amount`
  - `payload` (Webhook payload)

### 4.3 API一覧（`/api/v1`）

#### Auth

- `POST /auth/line`
- `GET /auth/me`
- `PATCH /auth/me`

#### Dogs

- `GET /dogs/`
- `POST /dogs/`
- `GET /dogs/{id}/`
- `PATCH /dogs/{id}/`
- `DELETE /dogs/{id}/`

#### Reservations

- `GET /reservations/`
- `POST /reservations/`
- `GET /reservations/{id}/`
- `PATCH /reservations/{id}/`
- `DELETE /reservations/{id}/`
- `POST /reservations/{id}/cancel/`
- `POST /reservations/{id}/mark_no_show/` (admin)
- `GET /reservations/availability?date=YYYY-MM-DD`

#### Payments

- `POST /payments/checkout-session`
- `POST /payments/stripe/webhook`
- `GET /payments/history`

#### Checkin

- `POST /checkins/qr`
- `POST /checkins/checkout` (admin)

#### Stats

- `GET /stats/current`

#### Admin

- `GET /admin/dashboard`
- `GET /admin/sales`
- `GET /admin/members/`
- `GET /admin/dogs/`
- `GET /admin/reservations/`
- `GET /admin/checkins/`
- `GET/POST/PATCH/DELETE /admin/restricted-breeds/`

## 5. フロントエンド設計

### 5.1 ページ（ユーザー側 必須）

- Top: `/`
- LINE Login: `/login`
- MyPage: `/mypage`
- Dog Registration: `/dog-registration`
- Reservation: `/reservation`
- QR Checkin: `/checkin`
- Live Status: `/live-status`

### 5.2 実装方針

- UIは `app_legacy` を参照しつつ、ロジックは再設計
- 状態管理:
  - `AuthProvider` + ページ単位 hooks
- APIアクセス:
  - `src/lib/api.ts` に集約
- 近年のリファクタリング反映:
  - 日付系ユーティリティ共通化
  - 予約表示ロジック共通化
  - 犬情報取得/ライブ状態取得の hooks 化

## 6. 主要業務ルール（ドッグラン特有）

- ワクチン期限チェック:
  - 犬登録時に期限検証
  - 予約時に「予約日で有効か」を再検証
- 犬サイズ制御:
  - 大型犬上限をスロット単位で制御
- 最大頭数制御:
  - スロット全体頭数上限を厳密チェック
- 危険犬種管理:
  - `RestrictedBreed` + `allow_restricted_breeds` ルール
- no-show対応:
  - no-show記録 + ユーザー停止期間付与

## 7. 重要フロー

### 7.1 LINEログイン

1. Frontend が LINE OAuth で `id_token` 取得（本番）
2. Backend `POST /auth/line`
3. LINE verify API で検証
4. JWT発行

開発モード:

- `LINE_LOGIN_MOCK=True` で `line_user_id` 指定ログイン

### 7.2 予約〜決済

1. 空き状況取得 `GET /reservations/availability`
2. 予約作成 `POST /reservations/`
3. Stripe Checkout セッション作成
4. Webhook で支払い結果反映
5. `Reservation.status/payment_status` を更新

### 7.3 QRチェックイン

1. 利用者が QR 読み取り
2. `POST /checkins/qr`
3. 権限・時刻・予約状態を検証
4. `checked_in` に遷移し `CheckinLog` 保存

### 7.4 リアルタイム利用数

- Backend:
  - `GET /stats/current`
  - `checked_in` かつ時間範囲内の予約を集計
- Frontend:
  - Polling（15秒〜30秒）で更新

## 8. セキュリティ設計

- 認証: JWT（SimpleJWT）
- 通信: HTTPS前提 (`SECURE_PROXY_SSL_HEADER`)
- Cookie: `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`
- HSTS: 本番有効
- 入力検証:
  - DRF Serializer validation
  - 犬画像: 5MB以下 / jpg,jpeg,png,webp
- Webhook:
  - `STRIPE_WEBHOOK_SECRET` が設定されている場合は署名検証を強制

## 9. 運用設計

- ログ:
  - Console logging
  - `APPINSIGHTS_CONNECTION_STRING` があれば AzureLogHandler 送信
- 監査:
  - `CheckinLog`
  - `PaymentRecord.payload`
- 監視推奨:
  - API 5xx率
  - Stripe webhook 失敗率
  - QR checkin 4xx増加

## 10. Azure本番構成

- App Service:
  - `dogrun-api` (Django)
  - `dogrun-frontend` (Next.js)
- Azure Database for PostgreSQL
- Azure Blob Storage
- Application Insights
- Key Vault（シークレット保管推奨）

詳細手順は `docs/azure-deploy.md` を参照。

## 11. 仕様との差分コメント（要対応）

以下は仕様に対して未実装または命名差異がある項目です。

1. API上は `mark_no_show` が `admin` ではなく `reservations/{id}/mark_no_show/` として公開（権限はadmin）
2. `max_small_dogs` / `max_large_dogs` は実装では `max_small_dogs_per_slot` / `max_large_dogs_per_slot`
3. 自動checkoutは定期バッチではなく、現状はAPIアクセス時の状態再計算で実行
4. `rain_closure_enabled` は手動トグル運用（気象連携の自動判定は未実装）
5. Stripe idempotencyはキー保存まで実装。重複イベント抑止ポリシーの厳密化は今後の運用課題

## 12. 次期バージョン方針

- ルールエンジン拡張:
  - `max_small_dogs`, 雨天中止、祝日特別枠
- チェックイン運用強化:
  - 自動checkoutバッチ
  - `qr_expires_at` 導入
- 決済強化:
  - idempotency key 保存
  - 返金業務フローのAPI化
- リアルタイム化:
  - polling から WebSocket/SSE へ移行
