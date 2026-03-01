# FC今治 Dogrun MVP

`dogrun.md` を基準に、Next.js + Django REST + PostgreSQL 構成で実装したMVPです。

## 起動

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/v1

## ローカル起動コマンド

### backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

- 上記はデフォルトで SQLite を使います（ローカル検証用）。
- PostgreSQLで起動する場合は `.env` の `DATABASE_URL` を `postgres://postgres:postgres@localhost:5432/dogrun` に変更し、別途DBを起動してください（例: `docker compose up -d db`）。

### frontend

```bash
cd frontend
pnpm install
pnpm dev
```

- `pnpm dev` は開発用出力先を `.next-dev` に分離しています（`pnpm build` の `.next` と競合させないため）。
- `pnpm dev` 実行時に `predev` で `.next-dev` を自動クリーンします（`Cannot find module './268.js'` 系の破損対策）。

## トラブルシュート

### frontend: `Cannot find module './268.js'` / `./846.js` / `/_next/static/* 404`

1. `next dev` を全停止（PowerShell: `Get-Process node | Stop-Process -Force`）
2. `cd frontend`
3. `pnpm clean:next`
4. `pnpm dev`

- 原因の多くは `.next` キャッシュ破損か `next dev` 多重起動です。
- `pnpm build` と `pnpm dev` を同時に動かすと競合しやすいので、同時実行しないでください。
- `Fast Refresh had to perform a full reload` の直後に一時的な `404` が出ることがあります。継続する場合は上の手順で再起動してください。

### backend: `failed to resolve host 'db'`

- `.env` の `DATABASE_URL` が Docker 向け (`@db:5432`) になっています。
- ローカル単体起動では `backend/.env` を以下のいずれかに変更してください。
  - SQLite: `DATABASE_URL=sqlite:///db.sqlite3`
  - ローカルPostgreSQL: `DATABASE_URL=postgres://postgres:postgres@localhost:5432/dogrun`

## 主要ドキュメント

- `docs/architecture.md`
- `docs/community-os-strategy.md`
- `docs/azure-deploy.md`

## 備考

- フロント旧構成は `frontend/app_legacy` に退避しています。
- LINEログインは `LINE_LOGIN_MOCK` で開発モードを切替可能です。
