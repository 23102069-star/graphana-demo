export async function annotateGrafana(text: string, extraTags: string[] = []): Promise<void> {
  const baseUrl = process.env.GRAFANA_URL;
  const token = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN;
  if (!baseUrl || !token) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1800);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/annotations`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        tags: ["grafana-demo-app", ...extraTags],
        time: Date.now()
      }),
      cache: "no-store",
      signal: controller.signal
    });
    if (!response.ok) {
      // Annotation failures are intentionally ignored; demo endpoints must remain reliable.
    }
  } catch {
    // Grafana is optional and must never break an API response.
  } finally {
    clearTimeout(timeout);
  }
}
