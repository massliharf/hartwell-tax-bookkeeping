// AI check of an uploaded document: right form, right tax year, right name.
export async function aiCheckDocument(itemId: string): Promise<void> {
  const { supabaseAdmin: s } = await import("@/integrations/supabase/client.server");
  const { data: item } = await s.from("checklist_items")
    .select("id, document_name, file_path, appointments(start_at, clients(name))").eq("id", itemId).maybeSingle();
  const appt = item?.appointments as unknown as { start_at: string; clients: { name: string } | null } | null;
  if (!item?.file_path || !appt) return;
  const save = async (ai_check: string, ai_note: string) => { await s.from("checklist_items").update({ ai_check, ai_note }).eq("id", itemId).eq("file_path", item.file_path!); };
  const ext = item.file_path.split(".").pop()?.toLowerCase() ?? "";
  const mime = ext === "pdf" ? "application/pdf" : ext === "png" ? "image/png" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : null;
  if (!mime) return void await save("unreadable", "This file type can't be read automatically. Claire will look at it.");
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return;
  const year = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric" }).format(new Date(appt.start_at))) - 1;
  try {
    const { data: blob } = await s.storage.from("client-documents").download(item.file_path);
    if (!blob) return void await save("unreadable", "We couldn't open this file. Claire will look at it.");
    const b64 = Buffer.from(await blob.arrayBuffer()).toString("base64");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You check tax documents uploaded by a client for a US tax preparer. Be brief and kind. Never repeat Social Security numbers or account numbers." },
          { role: "user", content: [
            { type: "text", text: `Requested document: "${item.document_name}". Expected tax year: ${year}. Client name: "${appt.clients?.name ?? ""}". Check: (a) is this the requested form, (b) is it for tax year ${year}, (c) does the name look like the client's. Result "ok" if all fine, "warning" if any check fails, "unreadable" if you can't read it. Note: one short plain sentence addressed to the client, e.g. "This looks like a 1099-INT, not a W-2." or "This is for 2023, we need ${year}."` },
            { type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } },
          ] },
        ],
        tools: [{ type: "function", function: { name: "report", parameters: { type: "object", properties: { result: { type: "string", enum: ["ok", "warning", "unreadable"] }, note: { type: "string" } }, required: ["result", "note"] } } }],
        tool_choice: { type: "function", function: { name: "report" } },
      }),
    });
    if (!res.ok) { console.error("AI check failed", res.status, await res.text()); return; }
    const j = await res.json();
    const args = JSON.parse(j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}");
    const result = ["ok", "warning", "unreadable"].includes(args.result) ? args.result : "unreadable";
    await save(result, String(args.note ?? "").slice(0, 200));
  } catch (e) { console.error("AI check error", e); }
}
