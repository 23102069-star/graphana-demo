# grafana-demo-app

A minimal Next.js App Router target for testing Grafana Cloud Synthetic Monitoring. It intentionally has no monitoring SDK, database, chart dependency, or third-party observability service.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The app works without environment variables. Copy `.env.example` to `.env.local` only if you want Grafana annotations.

## Deploy to GitHub and Vercel

1. Create a new empty repository on GitHub.
2. From this project directory, run the Git commands below.
3. In Vercel, choose **Add New → Project**, import the repository, and deploy with the default Next.js settings.
4. In Vercel **Project → Settings → Environment Variables**, optionally add both variables below. Apply them to the environments you use, then redeploy. Do not put either variable in a `NEXT_PUBLIC_` variable.

| Variable | Value |
| --- | --- |
| `GRAFANA_URL` | Your Grafana Cloud stack URL, e.g. `https://<stack>.grafana.net` |
| `GRAFANA_SERVICE_ACCOUNT_TOKEN` | A Grafana service account token with permission to create annotations |

If either variable is missing, annotations are disabled and the app continues to work normally. The UI only reports configured/not configured; it never reveals values.

### Where to get the values

- **`GRAFANA_URL`**: Grafana Cloud portal → open your stack → copy the stack URL, typically `https://<stack>.grafana.net`.
- **`GRAFANA_SERVICE_ACCOUNT_TOKEN`**: Grafana → **Administration → Users and access → Service accounts** → create a service account with the **Editor** role (needed to create annotations) → **Add token**. Copy the token once and store it as a Vercel environment variable. Never commit it.

When `/api/slow` or `/api/error` is called and both variables are set, the server attempts to POST an annotation to `${GRAFANA_URL}/api/annotations`. A short timeout and error handling ensure Grafana failures do not change the API response.

## Grafana Cloud Synthetic Monitoring

1. Create an **HTTP check** targeting `https://<vercel-url>/api/health` and expect HTTP `200`.
2. Create a second HTTP check targeting `https://<vercel-url>/api/health?fail=1` and expect HTTP `200` if you want the check itself to pass only when the endpoint is healthy. This endpoint intentionally returns `503`, so it is useful for demonstrating a failing check and alert.
3. Add an alert rule for the failing check, such as when `probe_success == 0` for 1–2 minutes. Configure a notification policy if you want to receive the alert.

The `/api/health?fail=1` route intentionally returns `503` every time; do not use it as the normal health check.

## Five-step demo script

1. Open the deployed site and confirm the status badge is **Healthy**.
2. Click each endpoint button. `/api/health` should return `200`, `/api/slow` should take about 3 seconds, `/api/error` returns `500`, and `/api/flaky` randomly returns `200` or `500`.
3. Turn on **Auto traffic** and watch the total, success, and error counters update.
4. In Grafana, watch your Synthetic Monitoring checks and, if configured, annotations created by `/api/slow` and `/api/error`.
5. Trigger or open the failing check for `/api/health?fail=1` and watch the associated Grafana alert fire.

## API routes

- `GET /api/health` — `200` JSON health response; `?fail=1` forces `503`.
- `GET /api/slow` — waits 3 seconds, then returns `200`.
- `GET /api/error` — returns `500`.
- `GET /api/flaky` — waits 100–1000 ms, then returns `500` about 30% of the time or `200`.
- `GET /api/metrics` — minimal Prometheus text output (`app_up`, `app_requests_total`, `app_start_time_seconds`).
- `GET /api/config` — reports whether optional annotation settings are configured without exposing values.

## Caveat

The metrics counter is in memory. On Vercel serverless, counters reset and differ per serverless instance; this endpoint is intended for a simple demo, not durable production metrics.

## Push commands

Replace `YOUR_GITHUB_USERNAME` with your GitHub username and `YOUR_REPO_NAME` with the new repository name (for example, `grafana-demo-app`). Create the empty repository on GitHub first.

```bash
git init
git add .
git commit -m "Initial grafana-demo-app"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```
