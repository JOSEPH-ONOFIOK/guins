// The Google Sheet web app (scripts/apps-script/Code.gs). It follows Google's
// redirect to the script's output, and gives up after a few seconds.
export const SHEET_URL = process.env.GOOGLE_SHEETS_WEBAPP_URL;

export async function sheetCall<T>(body?: Record<string, unknown>, query = "", timeoutMs?: number): Promise<T> {
  const res = await fetch(`${SHEET_URL}${query}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs ?? (body ? 25_000 : 8_000)),
  });
  if (!res.ok) throw new Error(`Sheets web app returned ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`Sheets web app: ${data.error}`);
  return data as T;
}
