import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

const esc = (t: string | null | undefined) =>
  (t ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

interface Row {
  title: string;
  description: string | null;
  status: string;
  is_urgent: boolean;
  answer_notes: string | null;
  answered_at: string | null;
  created_at: string;
  prayer_request_categories?: { categories?: { name?: string } | null }[] | null;
}

function cats(r: Row): string[] {
  return (r.prayer_request_categories ?? [])
    .map((j) => j?.categories?.name)
    .filter((n): n is string => !!n);
}

function card(r: Row, accent: string): string {
  const tags = cats(r);
  const chips = tags.length
    ? `<div class="chips">${tags.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>`
    : "";
  const answered = r.answer_notes
    ? `<p class="answer"><span class="alabel">Answered${r.answered_at ? " · " + format(new Date(r.answered_at), "MMM d, yyyy") : ""}:</span> ${esc(r.answer_notes)}</p>`
    : "";
  return `
    <div class="card" style="border-left:4px solid ${accent}">
      <div class="title">${esc(r.title)}</div>
      ${r.description ? `<p>${esc(r.description)}</p>` : ""}
      ${chips}
      ${answered}
      <div class="added">Added ${r.created_at ? format(new Date(r.created_at), "MMM d, yyyy") : ""}</div>
    </div>`;
}

function section(title: string, rows: Row[], accent: string): string {
  if (rows.length === 0) return "";
  return `
    <div class="section">
      <h2 style="color:${accent}"><span class="dot" style="background:${accent}"></span>${esc(title)} <span class="count">${rows.length}</span></h2>
      ${rows.map((r) => card(r, accent)).join("")}
    </div>`;
}

/**
 * Export the user's full prayer list to a polished, branded PDF and open the
 * share sheet. On-device via expo-print (native build, not Expo Go).
 */
export async function exportPrayerListPdf(userId: string, name: string): Promise<void> {
  const { data } = await supabase
    .from("prayer_requests")
    .select("title,description,status,is_urgent,answer_notes,answered_at,created_at,prayer_request_categories(categories(name))")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as Row[];

  const urgent = rows.filter((r) => r.is_urgent && r.status !== "answered" && r.status !== "completed");
  const active = rows.filter((r) => !r.is_urgent && r.status === "active");
  const ongoing = rows.filter((r) => r.status === "ongoing");
  const answered = rows.filter((r) => r.status === "answered" || r.status === "completed");
  const inPrayer = urgent.length + active.length + ongoing.length;

  const C = { primary: "#5B53C6", urgent: "#E0556B", ongoing: "#7A5BD0", answered: "#3FB27F", ink: "#1D1B26", faint: "#9794A4" };

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    @page { margin: 0; }
    * { box-sizing: border-box; }
    body { font-family:-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif; color:${C.ink}; margin:0; }
    .cover { background:linear-gradient(135deg,#5B53C6,#7A5BD0); color:#fff; padding:54px 44px 40px; }
    .brand { font-size:13px; letter-spacing:3px; text-transform:uppercase; opacity:.85; margin-bottom:14px; }
    .cover h1 { font-size:40px; margin:0 0 6px; font-weight:700; }
    .cover .who { font-size:15px; opacity:.9; }
    .stats { display:flex; gap:14px; margin-top:30px; }
    .stat { background:rgba(255,255,255,.16); border-radius:14px; padding:14px 18px; min-width:84px; }
    .stat .n { font-size:26px; font-weight:700; }
    .stat .l { font-size:11px; letter-spacing:.5px; text-transform:uppercase; opacity:.9; margin-top:2px; }
    .body { padding:34px 44px 50px; }
    .section { margin-bottom:26px; }
    h2 { font-size:17px; margin:0 0 14px; display:flex; align-items:center; }
    h2 .dot { width:9px; height:9px; border-radius:5px; display:inline-block; margin-right:9px; }
    h2 .count { font-size:13px; color:${C.faint}; font-weight:600; margin-left:8px; }
    .card { border:1px solid #ECEAF2; border-radius:12px; padding:14px 16px; margin-bottom:11px; page-break-inside:avoid; }
    .card .title { font-size:16px; font-weight:700; }
    .card p { font-size:13.5px; line-height:1.55; color:#5A5666; margin:6px 0 0; }
    .answer { color:#2E9E68 !important; }
    .answer .alabel { font-weight:700; }
    .chips { margin-top:9px; }
    .chip { display:inline-block; background:#F1EFF9; color:#5B53C6; font-size:11px; padding:3px 10px; border-radius:20px; margin-right:6px; }
    .added { font-size:11px; color:${C.faint}; margin-top:9px; }
    .empty { color:${C.faint}; font-size:14px; }
    .verse { margin-top:36px; padding-top:22px; border-top:1px solid #ECEAF2; font-style:italic; color:${C.faint}; text-align:center; font-size:13.5px; }
  </style></head><body>
    <div class="cover">
      <div class="brand">Prevail Prayer</div>
      <h1>My Prayer List</h1>
      <div class="who">${esc(name)} · ${format(new Date(), "MMMM d, yyyy")}</div>
      <div class="stats">
        <div class="stat"><div class="n">${inPrayer}</div><div class="l">In prayer</div></div>
        <div class="stat"><div class="n">${answered.length}</div><div class="l">Answered</div></div>
        <div class="stat"><div class="n">${rows.length}</div><div class="l">Total</div></div>
      </div>
    </div>
    <div class="body">
      ${rows.length === 0 ? `<p class="empty">Your prayer list is empty.</p>` : ""}
      ${section("Urgent", urgent, C.urgent)}
      ${section("Praying now", active, C.primary)}
      ${section("Ongoing", ongoing, C.ongoing)}
      ${section("Answered", answered, C.answered)}
      <div class="verse">"Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God." — Philippians 4:6</div>
    </div>
  </body></html>`;

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: "Share your prayer list" });
  }
}
