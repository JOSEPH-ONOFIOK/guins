import { signupRow } from "@/lib/entry";
import { store } from "@/lib/store";

// GET /api/admin/export?key=ADMIN_KEY → CSV of every colony sign-up (needs Upstash)
export async function GET(req: Request) {
  const k = new URL(req.url).searchParams.get("key");
  if (!process.env.ADMIN_KEY || k !== process.env.ADMIN_KEY) return new Response("Not found", { status: 404 });
  const rows = (await store.all()).map(signupRow);
  const cols = Object.keys(signupRow({ handle: "", createdAt: 0, updatedAt: 0, done: {} }));
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c as keyof typeof r])).join(","))].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=guins-colony.csv" } });
}
