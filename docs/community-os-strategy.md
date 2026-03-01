# FC今治ドッグラン Community OS 再設計

最終更新: 2026-03-01

## 1. プロダクト再定義

- 旧: 予約・受付・決済の効率化
- 新: 犬と人の共助コミュニティをデータで可視化し、運営判断とスポンサー価値を生む基盤

## 2. 中核データモデル

### Dog（会員犬プロフィール）

- `breed` は必須（空白入力を拒否）
- `breed_group` を追加（任意）
- `size_category`（small/medium/large）
- `gender`（male/female/unknown）
- `birth_date`

### Membership（会員ランク）

- `user` 1:1
- `tier`（regular/premium）
- `joined_at`

### CheckinLog（入退場ログ）

- `duration_minutes` を追加
- checkout時に滞在時間を計算保存（admin/manual/auto checkout）

### BreedDailyStats（日次集計キャッシュ）

- `date`
- `breed`
- `total_checkins`
- `unique_dogs`
- `total_duration_minutes`
- `(date, breed)` unique

## 3. API（戦略機能）

- `GET /api/v1/stats/current`
  - `total_dogs`, `large_dogs`, `small_dogs`, `medium_dogs`, `breeds` を返却
- `GET /api/v1/stats/breeds?period=daily|monthly|realtime`
  - `daily`: 日次キャッシュ
  - `monthly`: 日次キャッシュ合算
  - `realtime`: 現在チェックイン中データ
- `GET /api/v1/auth/me`
  - `membership_tier`, `membership_joined_at` を返却

## 4. バッチ運用

日次キャッシュ更新コマンド:

```bash
python manage.py rebuild_breed_daily_stats --date 2026-03-01
python manage.py rebuild_breed_daily_stats --days 30
```

推奨運用:

- 毎日 00:10 JST に前日分を更新
- 再集計が必要な場合は `--days` で遡及

## 5. スポンサー営業向けKPI

- 月間来場頭数（`sum(total_checkins)`）
- 犬種別構成比（犬種ごとの`count` / 総数）
- リピート率（会員単位の再来比率: 別途集計追加）
- 平均滞在時間（`total_duration_minutes / total_checkins`）
- 1頭あたり年間利用回数（犬ID単位: 別途年次集計追加）

## 6. フロント可視化

`/stats` ページに以下を実装:

- 今月の犬種ランキング
- 犬種構成比（円グラフ）
- 大型犬 / 小型・中型犬比率
- リアルタイム犬種（15秒ポーリング）
