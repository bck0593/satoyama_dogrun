# Azure デプロイ手順（App Service + PostgreSQL + Blob + App Insights）

## 1. Azure リソース作成

1. Resource Group作成
2. Azure Database for PostgreSQL (Flexible Server) 作成
3. Storage Account + Blob Container 作成
4. Application Insights 作成
5. App Service Plan (Linux) 作成
6. Web App を2つ作成
   - `dogrun-api` (Python)
   - `dogrun-frontend` (Node)

## 2. バックエンド設定

`dogrun-api` の App Settings:

- `SECRET_KEY`
- `DEBUG=False`
- `ALLOWED_HOSTS=<api-app-name>.azurewebsites.net`
- `DATABASE_URL=postgres://...`
- `CORS_ALLOWED_ORIGINS=https://<frontend-app-name>.azurewebsites.net`
- `CSRF_TRUSTED_ORIGINS=https://<frontend-app-name>.azurewebsites.net`
- `LINE_CHANNEL_ID`
- `LINE_LOGIN_MOCK=False`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `APPINSIGHTS_CONNECTION_STRING`
- `AZURE_ACCOUNT_NAME`
- `AZURE_ACCOUNT_KEY`
- `AZURE_CONTAINER`

起動コマンド例:

```bash
python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn config.wsgi:application --bind=0.0.0.0:8000
```

## 3. フロントエンド設定

`dogrun-frontend` の App Settings:

- `NEXT_PUBLIC_API_BASE_URL=https://<api-app-name>.azurewebsites.net/api/v1`

Node起動:

```bash
npm run build && npm run start
```

（本リポジトリでは `pnpm` 前提。App Service の Oryx でも `pnpm-lock.yaml` を認識可能）

## 4. Stripe Webhook設定

Stripe Dashboard でWebhook endpointを作成:

- URL: `https://<api-app-name>.azurewebsites.net/api/v1/payments/stripe/webhook`
- イベント:
  - `checkout.session.completed`
  - `payment_intent.payment_failed`
  - `charge.refunded`

発行された署名シークレットを `STRIPE_WEBHOOK_SECRET` に設定。

## 5. Blob Storage設定

- `vaccine_proof_image` を Blob へ保存
- コンテナ例: `dogrun-media`
- Private運用の場合はSAS配布またはAPI経由配信

## 6. 監視設定

- Application Insights で以下をアラート化
  - 5xx率
  - 応答時間p95
  - `/payments/stripe/webhook` 失敗率
  - `/checkins/qr` 4xx急増

## 7. デプロイ方法

- GitHub Actions もしくは Azure DevOps を推奨
- 最小構成:
  1. backend test/lint
  2. frontend build
  3. backend deploy
  4. frontend deploy

## 8. 切り戻し運用

- App Service Deployment Slots を利用
- `staging` でマイグレーション検証後に swap
- DB破壊的変更は expand-and-contract 手順を採用
