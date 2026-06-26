import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

const esc = (t: string | null | undefined) =>
  (t ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

/**
 * Export the user's prayer list + journal to a branded PDF and open the
 * share sheet. Uses expo-print (native) — available in a development/standalone
 * build, not Expo Go.
 */
export async function exportMyData(userId: string, name: string) {
  const [{ data: prayers }, { data: journal }] = await Promise.all([
    supabase.from("prayer_requests")
      .select("title,description,status,answer_notes,created_at")
      .eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("journal_entries")
      .select("title,body,created_at")
      .eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  const prayerRows = (prayers ?? []).map((p: any) => `
    <div class="card">
      <div class="meta">${esc(p.status)} · ${p.created_at ? format(new Date(p.created_at), "MMM d, yyyy") : ""}</div>
      <div class="title">${esc(p.title)}</div>
      ${p.description ? `<p>${esc(p.description)}</p>` : ""}
      ${p.answer_notes ? `<p class="answer"><b>Answered:</b> ${esc(p.answer_notes)}</p>` : ""}
    </div>`).join("");

  const journalRows = (journal ?? []).map((j: any) => `
    <div class="card">
      <div class="meta">${j.created_at ? format(new Date(j.created_at), "MMM d, yyyy") : ""}</div>
      ${j.title ? `<div class="title">${esc(j.title)}</div>` : ""}
      <p>${esc(j.body)}</p>
    </div>`).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    body{font-family:-apple-system,Helvetica,Arial,sans-serif;color:#1D1B26;padding:36px;}
    h1{font-size:30px;margin:0 0 4px;color:#4A43B0}
    .sub{color:#9794A4;font-size:13px;margin-bottom:28px}
    h2{font-size:20px;margin:34px 0 12px;border-bottom:2px solid #ECEAFA;padding-bottom:6px;color:#5B53C6}
    .card{border:1px solid #E7E5EF;border-radius:12px;padding:14px 16px;margin-bottom:10px}
    .meta{font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#9794A4;margin-bottom:4px}
    .title{font-size:16px;font-weight:700}
    p{font-size:14px;line-height:1.5;color:#5A5666;margin:6px 0 0}
    .answer{color:#2E9E68}
    .verse{margin-top:40px;font-style:italic;color:#9794A4;text-align:center}
  </style></head><body>
    <h1>Prevail Prayer</h1>
    <div class="sub">${esc(name)} · exported ${format(new Date(), "MMMM d, yyyy")}</div>
    <h2>Prayer Requests (${(prayers ?? []).length})</h2>
    ${prayerRows || "<p>No prayer requests yet.</p>"}
    <h2>Journal (${(journal ?? []).length})</h2>
    ${journalRows || "<p>No journal entries yet.</p>"}
    <div class="verse">"Continue steadfastly in prayer." — Colossians 4:2</div>
  </body></html>`;

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: "Export Prevail Prayer data" });
  }
}
