# MY FINANCE OS: Claude Code Master Brief (v2.1)

Save this file in the repo as `docs/DESIGN.md`. Save Section 1 (Operating Rules) also as `CLAUDE.md` in the repo root. Then run the Week 0 prompt (Section 16) first. Never run all weeks at once.

---

## 0. Who you are working for and what to build

The owner is a single Korean university student. The app UI is in Korean. Code, comments, commit messages, and docs are in English. All user-facing strings go in a Korean message file (i18n), never hard-coded in components.

Build a **private, single-user personal financial research platform**:

1. Collect Korean and global market data every 30 minutes in the background, with or without the app open.
2. Collect and classify economic news, extract keywords, link news to instruments and sectors.
3. Let the owner write an **independent daily market journal**, then compare it with an AI-written report. The AI never edits the owner's text.
4. Record every forecast (owner and AI) in a locked, structured format and score it automatically against real prices.
5. Read the owner's Toss Securities holdings (read-only) and show exposure and rule-compliance checks against the owner's own written **investment policy**.

The product is a judgment-training and rule-compliance tool. It is **not** a stock-picking or trading product.

---

## 1. Operating Rules (put these in `CLAUDE.md`)

1. The design file is `docs/DESIGN.md`. If you want to deviate, explain why and wait for approval.
2. **Never** place, modify, or cancel any order, and never move money. The Toss client may only call allow-listed read endpoints (Section 7.4).
3. Never print, log, commit, or paste keys, tokens, cookies, or full account numbers. The owner enters secrets directly in the Supabase and Vercel dashboards. If you need a secret, ask for the variable name only.
4. Never fabricate prices, news, filings, or financial statements. Test data must be labeled `DEMO` in the UI and must never be written to the production database.
5. If data cannot be fetched, do not fill with 0 or a previous value. Store nothing and show "unavailable" (미제공) in the UI.
6. Do not sign up for paid services or add paid dependencies. Report cost and purpose first.
7. Do not add tables, routes, or dependencies that are not in this design without asking.
8. Do not claim anything is done unless you ran it and verified it. Mark unverified items as "UNVERIFIED".
9. Every personal-data table gets RLS and an access-denial test in the same migration.
10. Store timestamps in UTC (`timestamptz`), money as `numeric`. Never use `float` for money.
11. Work one week at a time. At the start of each week, show a plan and wait for approval.
12. Never call a stock "buy", "sell", "recommended", or give a target price anywhere (UI, AI output, logs). Use "forecast", "scenario", "check item".

---

## 2. Verified environment facts (as of 2026-11-12) and unknowns

**Verified**
- Toss Securities Open API went GA in Aug 2026. Public sources say it offers stock info, own-account info, orders, conditional orders, and real-time quotes, with LLM integration. Unofficial SDK docs say: REST only (no WebSocket), current price for up to 200 symbols per call, candles up to 200 bars, KRW/USD FX, KR/US market calendar, account list, holdings, open/closed orders, buying power, sellable quantity, fee rates. The holdings response has no purchase date.
- Vercel Hobby cron: once per day only. Pro: per minute.
- Supabase free plan: 500 MB DB, 500K edge function invocations per month, edge function wall time 150 s, CPU 2 s, 256 MB memory, free projects pause after 7 days of inactivity, no automatic backups. `pg_cron` + `pg_net` can call edge functions on schedule.
- The owner's connected accounts showed: Supabase with 2 paused projects (unrelated), Vercel with 0 projects visible. There is **no existing MY FINANCE OS project**. Create new ones.

**Unknown (resolve in Week 0, do not assume)**
- What the owner's "existing Toss connection" in Claude Code actually is (Toss Securities Open API key? MCP server? skill? script?).
- Whether the Toss console allows read-only scopes or IP allow-listing.
- Whether Toss returns index values, and its rate limits.
- Whether the owner will open a Korea Investment & Securities account (needed for KR index, sector, investor-flow data).
- Whether new Supabase and Vercel projects can be created under current plan limits.
- Source of 10+ months of historical month-end closes for core ETFs.

---

## 3. Architecture

```
Browser (phone / tablet / laptop)
  -> Vercel: Next.js (App Router) + TypeScript. Public anon key + session cookie only.
       -> Supabase Auth (signup disabled, one allowed email, TOTP MFA)
       -> Supabase Postgres (RLS on all personal tables)
       -> Supabase Edge Functions (Deno): ingestion, AI calls, evaluation. All secrets live here.
            ^ pg_cron + pg_net (every 30 min, per job)
            -> Toss Securities API (read-only allow-list)
            -> KIS Open API (optional)
            -> FRED, ECOS (BoK), OpenDART
            -> News RSS feeds
            -> Claude API
```

- No separate server in the 30-day phase. Only if a job exceeds edge limits, move it to a worker later.
- Browser never calls brokers, data providers, or the AI directly.
- Charts: TradingView Lightweight Charts. Font: Pretendard. Light and dark themes.

---

## 4. Product scope by phase

| Feature | 30-day private test | Closed beta | Later |
| --- | --- | --- | --- |
| KR + US indices, FX, rates, commodities dashboard | build | keep | keep |
| JP, CN, HK, EU indices | daily close only | keep | intraday review |
| News ingest, dedupe, event grouping, AI classification | build | keep | keep |
| Keyword trends | daily, weekly | add monthly | keep |
| Sector performance and rotation | build (KR sectors; US via sector ETFs) | keep | keep |
| AI daily report | build | one shared generation | keep |
| Owner journal editor with independent-analysis protection | build | keep | keep |
| AI vs owner comparison | build | keep | keep |
| Forecast log and auto scoring | build | keep | per-model comparison |
| Personal news library (URL save, memo) | build | keep | keep |
| Toss holdings (read-only) | build | per-user connection after ToS check | keep |
| Policy engine (policy, weights, monthly signal, check items, trade plan) | minimal, Week 4 | only after legal review | backtests |
| Household ledger | net-worth manual entry only | CSV import, budgets | AI spending analysis |
| Stock research (financials, technicals) | up to 10 watchlist items | expand | expand |
| Weekly review | build | keep | keep |
| Monthly review | no | build | keep |
| Sign-up, multi-user | **never in this phase** | build | keep |
| Investor-profile questionnaire, SNS publishing, subscriptions | no | no | after legal review |

**Never build in any phase:** order placement or modification, auto transfers, auto trading, public community features, numbers without source.

**30-day pass criteria (proposed, owner may edit):**

| Metric | Target | How measured |
| --- | --- | --- |
| Ingestion success rate | >= 95% of scheduled runs | `ingestion_runs` success / scheduled |
| AI report claims without source link | < 5% | automatic check on save |
| Scored forecasts | >= 40 each for owner and AI | `prediction_evaluations` count |
| Days with an owner-written journal | >= 15 of 20 trading days | `daily_reports` where author = user |
| AI cost | <= USD 5 per month | `ai_runs.cost_usd` sum |
| Policy written and one monthly check item closed | yes | `investment_policies`, `policy_checks` |

Note: 40 scored forecasts give roughly +/- 15 percentage points of uncertainty on a hit rate. The 30-day conclusion is "the loop runs reliably", not "the AI is accurate".

---

## 5. Data providers and adapter contract

All providers sit behind adapters. The rest of the app only sees the common format.

| Provider | Data | Notes |
| --- | --- | --- |
| Toss Securities Open API | KR/US quotes, candles, FX, market calendar, account holdings | Read-only allow-list. Confirm endpoints in Week 0 |
| KIS Open API (optional) | KR indices, sector indices, investor flows, advancers/decliners, overseas indices | 20 requests/s on live accounts. Needs a KIS account |
| FRED | US Treasury yields, VIX, oil, CPI, jobs, some index closes | Free key. Daily data, lagged |
| ECOS (Bank of Korea) | KR policy rate, KTB yields, FX | Free key |
| OpenDART | Disclosures, financial statements | 20,000 calls per day per key. Responses have date only, no time |
| RSS feeds | News title, link, summary, publisher, published time | Per-feed terms. Never store full article body |

**Do not use the Naver Search API as a news source.** Its revised terms reportedly restrict AI answer generation and cap server retention at 21 days.

Mapping rules:
- KR index and sector from KIS. If no KIS account, use index-tracking ETF prices and label `is_proxy = true` with an "ETF proxy" tag in the UI.
- US indices via index ETFs from Toss. US sectors via 11 sector ETFs.
- Commodities via commodity ETFs (intraday) or FRED (daily).
- Investor flows and breadth: KIS only. Otherwise "unavailable".
- Consensus forecasts for economic releases: no free source. Manual entry only. Never invent.

Common format (TypeScript):

```ts
type Quote = {
  sourceCode: 'toss' | 'kis' | 'fred' | 'ecos';
  sourceSymbol: string;
  price: number;
  currency: 'KRW' | 'USD' | 'JPY' | 'CNY' | 'HKD' | 'EUR' | 'PT';
  asOf: string;      // provider-stated time, UTC ISO
  fetchedAt: string; // our fetch time, UTC ISO
  delayed: boolean;
  volume?: number;
  tradedValue?: number;
};

interface MarketDataAdapter {
  code: string;
  getQuotes(symbols: string[]): Promise<Quote[]>;
  getDailyBars(symbol: string, from: string, to: string): Promise<DailyBar[]>;
  getCalendar?(market: 'KR' | 'US', month: string): Promise<CalendarDay[]>;
}
```

Display rules: every number shows its as-of time and source. Data states: `live` (market open and fetched within 45 min), `closed`, `stale` (market open but no update for over 45 min), `unavailable`.

---

## 6. Ingestion pipeline

Each job runs independently; a failure never affects another. Cron is in UTC. The function checks the market calendar and exits as `skipped` when the market is closed (handles US daylight saving).

| Job | KST schedule | Cron (UTC) | What it does |
| --- | --- | --- | --- |
| `quotes-kr` | weekdays 09:00-15:30, every 30 min | `0,30 0-6 * * 1-5` | KR indices, sectors, watchlist quotes |
| `quotes-us` | weekday nights 22:00-06:30, every 30 min | `0,30 13-21 * * 1-5` | US index/sector/commodity ETFs, watchlist |
| `fx` | weekdays every 30 min | `0,30 * * * 1-5` | USD/KRW |
| `news-ingest` | daily every 30 min | `5,35 * * * *` | RSS fetch, dedupe, event grouping |
| `news-enrich` | daily every 30 min | `10,40 * * * *` | AI classification, keyword and entity linking |
| `dart-watch` | weekdays 09:15-18:45 | `15,45 0-9 * * 1-5` | Watchlist disclosures |
| `kr-close` | weekdays 16:10 | `10 7 * * 1-5` | Daily bars, flows, breadth, sector snapshot, keyword daily |
| `holdings-sync` | weekdays 16:15 and next day 06:30 | `15 7 * * 1-5`, `30 21 * * 1-5` | Toss holdings snapshot |
| `evaluate-kr` | weekdays 16:20 | `20 7 * * 1-5` | Score matured KR forecasts |
| `ai-daily-report` | weekdays 16:30 | `30 7 * * 1-5` | Generate AI daily report |
| `global-close` | Tue-Sat 07:30 | `30 22 * * 1-5` | US/global closes, rates, FX, commodities, macro releases |
| `evaluate-global` | Tue-Sat 07:45 | `45 22 * * 1-5` | Score matured US/global forecasts |
| `weekly-review` | Sat 10:00 | `0 1 * * 6` | Weekly review draft |
| `maintenance` | Mon 03:00 | `0 18 * * 0` | Purge old intraday bars, refresh calendar, check DB size |
| `monthly-signal` | last trading day after close | schedule from calendar | 10-month moving-average state per core asset |
| `policy-check` | after holdings sync, twice daily | after `holdings-sync` | Weight drift, limits, forbidden products, turnover |

Execution order for every job:
1. `pg_cron` calls the function via `net.http_post` with header `x-cron-secret` (secret stored in Supabase Vault).
2. Verify secret; read kill switches from `app_settings`; exit if set.
3. Insert into `ingestion_runs` with unique (`job_code`, `scheduled_for`). If it already exists, exit (duplicate).
4. Check `market_calendar`; if closed, record `skipped` and exit.
5. Call provider: 10 s timeout, retry twice after 1 s and 4 s.
6. Validate: price > 0, `asOf` not in the future, change vs previous < 30%. Otherwise mark `suspect` and do not surface.
7. Upsert on natural keys (quotes: instrument + bar time; news: URL hash).
8. Write run result (status, rows, short error summary; never secrets).
9. Three consecutive failures create a `system_alerts` row shown on the dashboard.

News processing: strip tracking params and SHA-256 the URL; skip duplicates; group articles with title similarity (`pg_trgm`) >= 0.6 within 24 h into one `news_events` row; store only title, link, summary, publisher, timestamps; AI classifies in batches; AI-proposed instrument names are accepted only if they match `instrument_aliases`.

Keyword states (computed in code): new (first seen <= 3 days), surge (today >= 3x 7-day average and >= 5 mentions), persistent (>= 5 of last 7 days), fading (7-day average < 0.5x previous 7 days), resurgent (absent >= 14 days then >= 3/day), long-term theme (>= 20 of last 30 days).

Sector rotation (computed in code): relative strength = sector return minus market index return. Leading: 1M > 0 and 1W > 0. Improving: 1M <= 0 and 1W > 0. Weakening: 1M > 0 and 1W <= 0. Lagging: both <= 0.

---

## 7. Database

### 7.1 Common rules
- UTC `timestamptz`; trading day as `date`; money as `numeric`.
- Every externally sourced row has `source_code`, `as_of`, `fetched_at`.
- Personal tables have `user_id uuid not null default auth.uid()` and RLS enabled; `anon` has no grants.
- Shared market and news tables: authenticated read-only; writes only by service role inside edge functions.
- Use Postgres enums for status fields. Each migration includes a down script.

### 7.2 Tables (43 total after the policy engine)

**Reference and system (8):** `data_sources`, `instruments` (unique source_code+source_symbol; fields: symbol, name_ko, name_en, asset_class, market, currency, sector_id, tier 1/2, is_proxy, proxy_for, is_active), `instrument_aliases`, `market_calendar` (PK market+trade_date), `ingestion_runs`, `system_alerts`, `app_settings` (kill switches, daily AI budget), `audit_log` (append-only).

**Market (10):** `quotes_intraday` (PK instrument_id+bar_time; quality flag), `quotes_daily`, `macro_series`, `macro_observations` (PK series_id+period+released_at; revisions are new rows), `economic_events` (forecast is manual, nullable), `sectors`, `sector_snapshots` (ret_1d/1w/1m, rs_1w/1m, rotation_state), `investor_flows`, `market_breadth`, `market_regimes` (labels text[], evidence jsonb).

**News and keywords (5):** `news_articles` (unique url_hash; category, importance + importance_reason, impact_direction, impact_horizon, ai_run_id), `news_events`, `news_entity_links` (relation: `stated` or `inferred`, confidence), `keywords`, `keyword_daily`.

**Personal, all with RLS (11):** `watchlist_items`, `user_news_items`, `daily_reports` (unique user+date+author; author is `user` or `ai`; locked_at; data_cutoff_at), `daily_report_revisions`, `report_comparisons`, `brokerage_accounts` (masked_no only), `holdings_snapshots`, `ledger_accounts`, `ledger_transactions` (kind: income, expense, transfer, investment, loan_principal, loan_interest; unique user+source+external_id; only expense and loan_interest count as spending), `net_worth_snapshots`, `notes`.

**Forecasts and AI (4):** `predictions` (immutable after insert via trigger; author, instrument, made_at, data_cutoff_at, horizon_days, target_date, direction, band_low, band_high, probability, base_price, rationale, invalidation, status), `prediction_evaluations`, `ai_runs` (task, model, prompt_version, input_hash, tokens, cost_usd; unique task+input_hash), `ai_citations`.

**Policy engine (5):** `investment_policies` (versioned; effective 7 days after writing), `policy_targets` (sleeve: core/satellite/cash; target_weight; band), `monthly_signals` (shared; instrument, month_end, close, sma_10m, state), `policy_checks` (kind: drift, defense signal, limit breach, forbidden product, invalidation, turnover), `trade_plans` (reason, invalidation, prediction link, checklist, confirm_after).

RLS template:

```sql
alter table daily_reports enable row level security;
revoke all on daily_reports from anon;
grant select, insert, update on daily_reports to authenticated;
create policy own_rows_select on daily_reports for select to authenticated
  using (user_id = (select auth.uid()));
create policy own_user_report_insert on daily_reports for insert to authenticated
  with check (user_id = (select auth.uid()) and author = 'user');
create policy own_user_report_update on daily_reports for update to authenticated
  using (user_id = (select auth.uid()) and author = 'user' and locked_at is null)
  with check (user_id = (select auth.uid()) and author = 'user');
```

AI jobs must have no write permission on rows where `author = 'user'`.

Migrations: `0001_extensions_enums` (pg_cron, pg_net, pg_trgm), `0002_reference_system`, `0003_market`, `0004_news`, `0005_personal_rls`, `0006_predictions_ai` (with immutability triggers), `0007_cron_jobs`, `0008_policy_engine`.

Retention: `quotes_intraday` and `ingestion_runs` 90 days; everything else kept.

### 7.3 API routes (Next.js, session cookie only; never accept `user_id` from the client)
Dashboard summary; market quotes by group; instrument bars; sectors; news list and event detail; keywords; journal get/put/lock; AI report (blocked in protected mode until the owner's report is locked); compare (once per day); predictions list/create and scoreboard; library; portfolio; ledger; system health; kill-switch (requires re-login). All inputs validated with a schema validator; cursor pagination, max 100; errors never expose stack, SQL, or provider payloads; every number returns `asOf` and `source`.

Cron functions: `ingest-quotes`, `ingest-news`, `enrich-news`, `watch-disclosures`, `close-kr`, `close-global`, `sync-holdings`, `generate-daily-report`, `evaluate-predictions`, `maintenance`, `monthly-signal`, `policy-check`. All reject requests without a valid `x-cron-secret`.

### 7.4 Toss allow-list (enforced in code before any request)
Allowed: token issue, current price, candles, instrument info, FX, market calendar, account list, holdings.
Blocked: orders, modify, cancel, conditional orders, buying power, sellable quantity, order history.
Reject any path not on the list and any non-GET method (except token issue); log violations to `audit_log`.

### 7.5 URL fetch protection (personal news library)
http/https only; resolve DNS and reject private, loopback, link-local, and metadata addresses; max 3 redirects with re-validation each time; read max 1 MB within 5 s; extract only `<title>` and meta tags; for paywalled or login pages store title and URL only.

---

## 8. AI engine

AI interprets; it never produces numbers. Code builds a **data bundle** from the database (every item has an ID and respects `as_of <= data_cutoff_at`). The AI returns claims, each with reference IDs. Numbers appear only as placeholders like `{{q:KOSPI:2026-11-11.change_pct}}`, which code replaces from the database.

Tasks: news classification (Haiku 5.5, batches of up to 40), daily report (Sonnet 5.5, 14 sections), report comparison (Sonnet 5.5), weekly review (Sonnet 5.5, batch API), portfolio note (Haiku 5.5, weights in % only). Model names live in `app_settings`; call sites only know the task name.

Output validation (reject and retry once, then mark failed):
1. JSON matches schema.
2. Every `ref` exists in the bundle.
3. No raw numbers in `text`; only placeholders.
4. Every `fact` claim has at least one ref.
5. Every `interpretation` has a `counterpoint`.
6. No claim relies on anything listed in the bundle's `missing`.
7. Forecast probability is between 0.5 and 0.9, otherwise abstain with a reason.

Output schema (abbreviated): `sections[].claims[] {text, kind: fact|interpretation, refs[], counterpoint?}`, `regime {labels[], evidence_refs[]}`, `predictions[] {instrument, horizon_days, direction, probability, band_low_pct, band_high_pct, rationale_refs[], invalidation}`, `abstain[]`.

System prompt principles: never call the market simply bullish or bearish (multiple states can coexist); never present correlation as cause; low PER alone is not undervaluation; news volume alone is not a promising theme; never say buy or sell; write "no data" when data is absent. Prompts live in `prompts/<task>/v<N>.md`; store the version in `ai_runs.prompt_version`.

Injection defense: AI calls have no tools and no database or network access; truncate titles to 200 and summaries to 500 characters; external text goes only inside a data block marked as material to analyze, not instructions; do not send account numbers, names, or exact KRW balances.

Cost control: daily AI budget in `app_settings` (default USD 0.5); when exceeded, defer news classification and keep the daily report; never re-call on the same `input_hash`; no AI call when there are no new articles; AI report runs once a day, intraday jobs only collect and compute.

---

## 9. Forecast logging and scoring

Forecast format: instrument, horizon (1, 5, or 20 trading days), direction (up, down, flat), probability (50-90%, steps of 5), optional band relative to base price, rationale, invalidation condition. The owner enters forecasts through the form; AI never extracts them from the owner's free text.

On save the system records `base_price`, `made_at`, `data_cutoff_at`, and `target_date` (calendar-aware). A trigger blocks edits and deletes; only `void` with a reason is allowed.

Scoring at maturity: actual return, direction hit (flat band: +/-0.3% for 1 day, +/-0.7% for 5 days, +/-1.5% for 20 days; configurable, applies only to new forecasts), band hit, Brier score, absolute error. Always score three baselines on the same questions: always-up (55%), repeat previous direction, coin flip.

Scoreboard: owner vs AI vs baselines; by horizon, market, sector; calibration (stated probability vs actual hit rate); by prompt version; show sample size and show "insufficient sample" under 30 forecasts.

Leakage prevention: bundle uses `as_of`, not `fetched_at`; revised macro values are new rows; backtests step day by day; only live-generated forecasts appear on the scoreboard (the model may already know past markets).

---

## 10. Policy engine (minimal in Week 4)

Concept: the owner writes an **investment policy**; the app computes drift and signals and lists check items. The app never tells the owner what to buy or sell.

Four layers: policy (max tolerated drawdown, cash reserve outside the account, equity weight range, target weights, satellite total and per-item limits, defense application ratio 0-100%, forbidden products such as margin, leveraged and inverse products, a 7-day delay before changing rules) on top of three sleeves (core index ETFs, defense rule, satellite) and a behavior-check layer underneath.

Defense rule (computed once, on the last trading day close of each month): for each core asset compare close with the 10-month average of month-end closes (bonds and gold separately). Below average means "defense", above means "hold". Defense assets get a reduced target weight; the check item says so. Evaluate only at month end; do not react to intra-month moves. Default shown value for application ratio is 50% and is an **unvalidated assumption**; backtest 0%, 50%, 100% later.

Rebalancing: check item appears when an asset drifts more than 5 percentage points from target; fix with new cash first; show expected costs only.

Satellite rule: before adding a position, record a two-sentence reason, an invalidation condition, and one forecast. Track satellite vs core performance separately; if satellite lags core for a year, raise a check item about reducing the satellite limit.

Behavior checks (the app cannot block orders, so it asks when a plan is written and records afterward): warn when planning to buy something up more than 30% over 20 trading days; warn when monthly turnover exceeds the set value and show this month's trading cost; flag the disposition effect (selling winners, holding losers); record any limit or forbidden-product breach; on a day the index drops more than 3%, ask whether current drawdown is within the policy tolerance.

Reference models shown for comparison only (no ranking, no "fits you"): 2-asset (Graham), 90/10 (Buffett's 2013 letter), 4-asset equal (Harry Browne), 6-asset (Swensen). Show each model's currency exposure and historical drawdown next to it.

Evidence base and limits (state these in the UI help): Bessembinder (2018) found 58% of US stocks trailed T-bills over their lifetimes; SPIVA shows about 89.5% of active US large-cap funds trailed the S&P 500 over 15 years (to 2024); Barber and Odean (2000) found the most active households earned 11.4% vs a 17.9% market; Korea Capital Market Institute (2021) found about 60% of new retail investors lost money; Faber's trend rule reduced max drawdown in US data but is sensitive to parameter choice and misses sharp rebounds; in 2022 both a US 60/40 portfolio (about -16%) and risk parity/All Weather (about -22%) fell. These are mostly US, USD-based, historical results. Do not promise returns.

Tables: `investment_policies`, `policy_targets`, `monthly_signals`, `policy_checks`, `trade_plans`. Jobs: `monthly-signal`, `policy-check`. One screen: the "Operations" screen under the Assets tab (policy summary, target vs current weight bars, this month's signals, open check items, compliance history). Check items close as "confirmed", "acted", or "skipped (reason required)".

Data issue to solve first: Toss candles return up to 200 bars per call, which is slightly short of 10 months of daily bars. Find another source for month-end closes (KIS period quotes or FRED).

---

## 11. UI

Navigation: phone bottom tabs (Home, Market, Journal, Assets, More); tablet and laptop sidebar. 11 screens: Dashboard, Global Market, Sectors, News and Keywords, Stock Detail, Today's Journal, Forecast Scoreboard, Portfolio, Ledger/Net worth, Operations, Settings/System.

Principles: one question per screen; conclusion first, numbers below; easy words first (for example "confidence score" for Brier score, "restore weights" for rebalancing), with the original term one tap away; a four-tap forecast entry (instrument, direction, probability, horizon); render stored data immediately and refresh in the background; max 6 cards per screen.

Home first line is "one thing to do today" (write the journal, review this month's signals, or review a maturing forecast).

Journal flow (protected mode is default): 1) view raw data (no AI interpretation, AI importance hidden) 2) write own report (10 sections, autosave after 3 s idle, revision history) 3) enter forecasts 4) lock 5) AI report unlocks 6) comparison (agreements, differences, owner-missed, AI-missed, facts to verify) 7) final opinion written separately. A setting allows "AI first" mode; record which mode each report used.

Display: KR color convention by default (up red, down blue; US convention is a setting) plus arrows and signs, never color alone; tabular numerals; every value shows as-of time and source; real values solid, forecasts dashed and dimmer, AI interpretation with a left bar, proxy instruments tagged "ETF proxy", DEMO data tagged DEMO; light and dark themes; Pretendard, 14px minimum.

---

## 12. Security (30-day phase must-haves)

- [ ] Disable Supabase signup; allow one email only; TOTP MFA; MFA on Supabase, Vercel, GitHub accounts.
- [ ] Session in `HttpOnly`, `Secure`, `SameSite=Lax` cookies only; never in localStorage.
- [ ] Next.js middleware redirects all unauthenticated requests to login; no public pages.
- [ ] RLS on all personal tables; revoke `anon`; automated test that unauthenticated reads return zero rows.
- [ ] Toss, AI, and data keys in Supabase Function Secrets; cron secret and project URL in Vault.
- [ ] Toss allow-list enforced in code (7.4).
- [ ] Secret scanning (gitleaks) before commit; private repository.
- [ ] No keys, tokens, cookies, or full account numbers in logs; account numbers masked to the last 4 digits.
- [ ] Vercel preview deployments require login and have no production keys.
- [ ] Three kill switches (Toss, AI, external ingestion) enforced server-side.
- [ ] Weekly encrypted DB dump stored elsewhere; test a restore once.
- [ ] `audit_log` for logins, switches, Toss syncs, exports, allow-list violations.
- [ ] Never put production keys into this chat or into the repo. The owner enters them in dashboards.
- [ ] Prefer separate Toss keys for the app and for the Claude Code connection, to reduce accidental order paths.

Incident response: turn on all kill switches, revoke the Toss key in the console and reissue, rotate Supabase service and AI keys, expire all sessions, export `audit_log` and `ingestion_runs`, then investigate, then verify orders in the Toss app.

Beta gates (not built now): cross-user isolation tests, per-user credential encryption with keys outside the DB, passkeys/MFA and login throttling, dev/staging/prod separation, data deletion and account disconnect, monitoring and alerts, Supabase Pro backups, legal review, independent security assessment. Baselines: OWASP ASVS (Level 2), OWASP API Security Top 10, Korean personal-information safety measures.

---

## 13. Regulatory guardrails (affect product wording and scope)

Not legal advice. Public regulator material indicates:
- Paid membership investment advice can require a similar-investment-advisory (유사투자자문업) notification; sharing the same advice free to everyone is treated differently.
- Individualized advice and interactive paid channels fall under registered investment advisory (투자자문업). Auto-trading linkage has been enforced as unregistered discretionary management.
- Aggregating multiple users' account data may fall under credit-information-law rules. Unknown; do not open multi-user account linking before expert review.
- Whether Toss's API terms permit third-party multi-user services is unknown. Ask Toss.

Therefore: wording in UI and AI output must be descriptive ("62% of holdings are in semiconductors", "5-day direction forecast and its hit record"), never directive ("reduce semiconductors", "buy X", "target price"). Add "not an investment recommendation; losses are possible" to all screens and exports before any beta. The owner must get expert review before opening policy checks to other users.

---

## 14. Cost model

30-day phase estimate: about USD 4.22 per month (all AI). Assumes 22 trading days, 300 articles per day.

| Item | Model | Assumed tokens in/out | Runs | Monthly |
| --- | --- | --- | --- | --- |
| News classification | Haiku 5.5 | 1,000 / 200 per article | 300 x 30 | 1.80 |
| Daily report | Sonnet 5.5 | 15,000 / 3,000 | 22 | 1.32 |
| Comparison | Sonnet 5.5 | 8,000 / 1,500 | 22 | 0.68 |
| Weekly review | Sonnet 5.5 | 30,000 / 4,000 | 4 | 0.40 |
| Portfolio note | Haiku 5.5 | 3,000 / 500 | 44 | 0.02 |

Prices per million tokens: Haiku 5.5 USD 0.10 in / 0.50 out; Sonnet 5.5 USD 2 in / 10 out; batch is half price. Vercel, Supabase, and data APIs use free tiers. Token counts are estimates; measure real usage in `ai_runs` during week 1. Beta adds Supabase Pro (USD 25) and Vercel Pro (USD 20) per month.

---

## 15. Roadmap and gates

| Week | Build | Gate before moving on |
| --- | --- | --- |
| 0 | Environment audit, key issuance, new projects, login-only Next.js shell | Login works with empty screen; one Toss read call succeeds |
| 1 | Migrations 0001-0003, seed instruments/sectors, Toss/FRED/ECOS adapters, `ingest-quotes`, `fx`, `close-global`, crons, dashboard, global market screen | 3 consecutive trading days at >= 95% ingestion success |
| 2 | RSS ingest, dedupe, event grouping, `enrich-news` + output validation, keyword daily, `close-kr`, sector rotation, news/keyword and sector screens | Duplicate display of the same event < 10% |
| 3 | Migrations 0005-0006, journal editor (autosave, revisions, lock), forecast form and immutability trigger, data bundle, `generate-daily-report`, compare, `evaluate-predictions`, scoreboard with baselines | One full day flow on real data |
| 4 | Toss allow-list and `sync-holdings`, portfolio screen, net-worth manual entry, weekly review, library, policy engine minimal (migration 0008), security checklist, restore drill | All 14 security must-haves done |
| 30-day run | Write the journal every trading day, weekly check of system and cost, fix bugs only, no new features | Pass criteria in Section 4 |

Each week: show a plan first and wait for approval; build migration, then function, then screen; run tests; actually execute each ingestion job once and confirm a success row in `ingestion_runs`; report what was built, not built, unverified, and whether the gate passed.

---

## 16. Week 0 prompt (run this first)

```text
Read docs/DESIGN.md. Do Week 0 (environment audit) only.
This task is investigation and reporting only. Do not create or modify project files, install packages, deploy, or change any database.

1. Find any Toss-related connection on this machine and in the Claude Code setup (MCP servers, skills, scripts, env var names). Report what it is and what calls it supports. Never print key or token values; report names and locations only.
2. Try exactly one read call through it: market calendar or current price. Do not call any account or order endpoint.
3. Read the official Toss Securities Open API documentation and summarize in a table: auth method, endpoint list (read vs order), rate limits, whether index values are provided, real-time vs polling, whether read-only scopes or IP allow-listing exist, and any clause about third-party services.
4. Check whether Korea Investment & Securities Open API, FRED, ECOS, and OpenDART can supply each item in the DESIGN.md Section 5 mapping table. List endpoints and series IDs. Mark anything you cannot confirm as UNCONFIRMED.
5. Find 10-15 candidate economic news RSS feeds (domestic and international, including Maeil Business) and record each feed's terms of use.
6. Find a source for at least 10 months of month-end closes for core ETFs (KR and US).
7. List where DESIGN.md differs from reality or would be blocked.

Report format:
A. Toss connection and readable data
B. Provider verification table (item, endpoint, limit, confirmed?)
C. RSS feed table
D. Month-end history source
E. Proposed changes to DESIGN.md
F. Things the owner must do (open accounts, issue keys, console settings)
G. Week 1 plan
```

## 17. Weekly prompt template (Weeks 1-4)

```text
Implement the Week [N] checklist from DESIGN.md Section 15. Relevant sections: [list].

1. First show an implementation plan and wait for my approval: files, migrations, functions, screens.
2. After approval, build in this order: migrations, functions, screens.
3. Run tests at each step. Execute each ingestion job once for real and confirm a success row in ingestion_runs.
4. Finish with a report: built, not built, UNVERIFIED items, and whether this week's gate passed.

Do not build anything outside this week's scope.
```

| Week | Sections to reference |
| --- | --- |
| 1 | 3, 5, 6, 7 (migrations 0001-0003), 11 (dashboard, global market) |
| 2 | 6 (news, keywords, sectors), 7 (0004), 8 (classification), 11 (news, sectors) |
| 3 | 7 (0005-0006, journal and forecast routes), 8, 9, 11 (journal, scoreboard) |
| 4 | 7.4, 10, 11 (assets, settings), 12 |

---

## 18. Open questions for the owner

1. What exactly is the existing Toss connection, and can the console restrict scopes or IPs?
2. Will you open a KIS account (needed for KR index, sector, flows)?
3. Is there a Vercel project in another team? Can a new Supabase project be created given two paused ones?
4. Start date, and are the pass-criteria numbers in Section 4 right?
5. First 10 watchlist instruments and the RSS feed list.
6. Who receives the daily report (affects PDF and Markdown export priority)?
7. Before any beta: expert review of policy checks and monetization; Toss ToS clarification for multi-user use.
