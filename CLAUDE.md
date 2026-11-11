# MY FINANCE OS: Operating Rules

These rules are Section 1 of `docs/DESIGN.md`.

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
