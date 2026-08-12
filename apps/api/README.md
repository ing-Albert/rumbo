# @ahorra/api

## Running tests

The test suite (`src/app.test.ts`) runs against a real local Postgres with the
same schema, roles, and RLS policies as production, provisioned by the
Supabase CLI. It never touches the production database.

1. Start local Supabase (requires Docker running): `npx supabase start` from
   the repo root.
2. Note the local Postgres connection string it prints (default:
   `postgresql://postgres:postgres@127.0.0.1:54322/postgres`).
3. Run the tests with `TEST_DATABASE_URL` set to that connection string:

   ```
   TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npm run test -w @ahorra/api
   ```

`TEST_DATABASE_URL` is deliberately separate from `DATABASE_URL` (used by the
running API against production/staging Supabase, see `.env`). Tests refuse to
run if `TEST_DATABASE_URL` is unset or looks like a hosted Supabase host, so
they can't accidentally run against real data.

CI (`.github/workflows/ci.yml`) runs this automatically against a fresh local
Supabase instance on every push and pull request.
