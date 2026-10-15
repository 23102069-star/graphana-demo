"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CallResult = { status: number | string; latency: number; message: string };
type Counts = { total: number; success: number; errors: number };

const endpoints = ["/api/health", "/api/slow", "/api/error", "/api/flaky"];

export default function Home() {
  const [health, setHealth] = useState<"Healthy" | "Unhealthy" | "Checking…">("Checking…");
  const [results, setResults] = useState<Record<string, CallResult>>({});
  const [autoTraffic, setAutoTraffic] = useState(false);
  const [counts, setCounts] = useState<Counts>({ total: 0, success: 0, errors: 0 });
  const [annotationsConfigured, setAnnotationsConfigured] = useState(false);
  const [recent, setRecent] = useState<number[]>([]);
  const running = useRef(false);

  const callEndpoint = useCallback(async (path: string) => {
    const started = performance.now();
    let status: number | string = "ERR";
    let message = "Network request failed";
    try {
      const response = await fetch(path, { cache: "no-store" });
      status = response.status;
      const body = await response.json().catch(() => ({}));
      message = typeof body.status === "string" ? body.status : typeof body.error === "string" ? body.error : response.ok ? "OK" : "Request failed";
    } catch {
      // Keep the dashboard usable if the network request fails.
    }
    const latency = Math.round(performance.now() - started);
    setResults((previous) => ({ ...previous, [path]: { status, latency, message } }));
    setCounts((previous) => ({
      total: previous.total + 1,
      success: previous.success + (typeof status === "number" && status >= 200 && status < 400 ? 1 : 0),
      errors: previous.errors + (typeof status !== "number" || status >= 400 ? 1 : 0)
    }));
    setRecent((previous) => [...previous.slice(-19), latency]);
  }, []);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        if (active) setHealth(response.ok ? "Healthy" : "Unhealthy");
      } catch {
        if (active) setHealth("Unhealthy");
      }
    };
    void check();
    const timer = window.setInterval(check, 10_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    fetch("/api/config", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { annotationsConfigured?: boolean }) => setAnnotationsConfigured(Boolean(data.annotationsConfigured)))
      .catch(() => setAnnotationsConfigured(false));
  }, []);

  useEffect(() => {
    if (!autoTraffic) {
      running.current = false;
      return;
    }
    running.current = true;
    const timer = window.setInterval(() => {
      if (running.current) void callEndpoint(endpoints[Math.floor(Math.random() * endpoints.length)]);
    }, 2_000);
    return () => { running.current = false; window.clearInterval(timer); };
  }, [autoTraffic, callEndpoint]);

  const maxLatency = Math.max(1, ...recent);
  const points = recent.map((value, index) => {
    const x = recent.length < 2 ? 0 : (index / (recent.length - 1)) * 100;
    const y = 34 - (value / maxLatency) * 28;
    return `${x},${y}`;
  }).join(" ");

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-mark">G</div>
        <div><p className="eyebrow">MONITORING PLAYGROUND</p><h1>Grafana Demo App</h1></div>
        <span className={`health-badge ${health === "Healthy" ? "good" : health === "Unhealthy" ? "bad" : "pending"}`}><span className="dot" />{health}</span>
      </header>

      <section className="intro">
        <p className="eyebrow">DEMO TARGET</p>
        <h2>Make some traffic. Watch your monitors.</h2>
        <p>Trigger healthy, slow, flaky, and failing responses to test Grafana Cloud checks.</p>
      </section>

      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">MANUAL REQUESTS</p><h2>Endpoint controls</h2></div><span className="subtle">Live response timing</span></div>
        <div className="endpoint-grid">
          {endpoints.map((path) => {
            const label = path === "/api/health" ? "Call /api/health" : path === "/api/slow" ? "Call /api/slow" : path === "/api/error" ? "Call /api/error" : "Call /api/flaky";
            const result = results[path];
            return <article className="endpoint-card" key={path}>
              <code>{path}</code>
              <button className={path === "/api/error" ? "button danger" : "button"} onClick={() => void callEndpoint(path)}>{label}</button>
              <div className="result-row"><span className="subtle">Latest result</span><strong className={result && (result.status === "ERR" || Number(result.status) >= 400) ? "error-text" : ""}>{result ? `${result.status} · ${result.latency} ms` : "Not called yet"}</strong></div>
              {result && <p className="result-message">{result.message}</p>}
            </article>;
          })}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading"><div><p className="eyebrow">GENERATED TRAFFIC</p><h2>Auto traffic</h2></div>
          <button className={`toggle ${autoTraffic ? "on" : ""}`} role="switch" aria-checked={autoTraffic} onClick={() => setAutoTraffic((value) => !value)}><span />{autoTraffic ? "On" : "Off"}</button>
        </div>
        <p className="helper">Randomly calls one endpoint every 2 seconds while enabled.</p>
        <div className="stats-grid">
          <div className="stat"><span>Total requests</span><strong>{counts.total}</strong></div>
          <div className="stat"><span>Success</span><strong className="success-text">{counts.success}</strong></div>
          <div className="stat"><span>Errors</span><strong className="error-text">{counts.errors}</strong></div>
        </div>
        <div className="chart-wrap"><div className="chart-label"><span>Recent request latency</span><span>milliseconds</span></div>
          <svg className="chart" viewBox="0 0 100 38" preserveAspectRatio="none" role="img" aria-label="Recent request latency line chart">
            <line x1="0" y1="34" x2="100" y2="34" className="chart-axis" />
            {recent.length > 0 && <polyline points={points} className="chart-line" />}
          </svg>
          {recent.length === 0 && <p className="chart-empty">Make a request to start the chart.</p>}
        </div>
      </section>

      <section className="integration-strip">
        <div className="integration-icon">↗</div>
        <div><h2>Grafana annotations</h2><p>{annotationsConfigured ? "Configured — slow and error requests can send annotations." : "Not configured — the app works normally without Grafana credentials."}</p></div>
        <span className={`config-pill ${annotationsConfigured ? "configured" : ""}`}>{annotationsConfigured ? "Configured" : "Not configured"}</span>
      </section>
      <footer><span>grafana-demo-app</span><span>Minimal monitoring target · No monitoring SDKs</span></footer>
    </main>
  );
}
