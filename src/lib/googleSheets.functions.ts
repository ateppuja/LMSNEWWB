import { createServerFn } from "@tanstack/react-start";

const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

type Row = (string | number)[];
export interface SheetPayload { title: string; rows: Row[]; }
export interface ExportInput {
  spreadsheetTitle: string;
  spreadsheetId?: string; // if provided, reuse
  sheets: SheetPayload[];
}

async function gw(path: string, init: { method: string; body?: unknown; query?: Record<string, string> }) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const connKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!lovableKey || !connKey) throw new Error("Google Sheets connector belum aktif. Hubungi admin.");
  const qs = init.query ? "?" + new URLSearchParams(init.query).toString() : "";
  const res = await fetch(`${GATEWAY}${path}${qs}`, {
    method: init.method,
    headers: {
      "Authorization": `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connKey,
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Google Sheets [${res.status}]: ${text}`);
  return text ? JSON.parse(text) : {};
}

export const exportToGoogleSheets = createServerFn({ method: "POST" })
  .inputValidator((d: ExportInput) => d)
  .handler(async ({ data }) => {
    let spreadsheetId = data.spreadsheetId;
    let spreadsheetUrl = "";

    if (!spreadsheetId) {
      const created = await gw("/spreadsheets", {
        method: "POST",
        body: {
          properties: { title: data.spreadsheetTitle },
          sheets: data.sheets.map((s) => ({ properties: { title: s.title.slice(0, 99) } })),
        },
      });
      spreadsheetId = created.spreadsheetId as string;
      spreadsheetUrl = created.spreadsheetUrl as string;
    } else {
      // Ensure sheets exist; add missing ones
      const meta = await gw(`/spreadsheets/${spreadsheetId}`, { method: "GET" });
      spreadsheetUrl = meta.spreadsheetUrl as string;
      const existing = new Set<string>((meta.sheets ?? []).map((s: { properties: { title: string } }) => s.properties.title));
      const toAdd = data.sheets.filter((s) => !existing.has(s.title.slice(0, 99)));
      if (toAdd.length) {
        await gw(`/spreadsheets/${spreadsheetId}:batchUpdate`, {
          method: "POST",
          body: {
            requests: toAdd.map((s) => ({ addSheet: { properties: { title: s.title.slice(0, 99) } } })),
          },
        });
      }
      // Clear existing sheets we're about to fill
      await gw(`/spreadsheets/${spreadsheetId}/values:batchClear`, {
        method: "POST",
        body: { ranges: data.sheets.map((s) => `'${s.title.slice(0, 99)}'`) },
      });
    }

    // Write values
    await gw(`/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: "POST",
      body: {
        valueInputOption: "RAW",
        data: data.sheets.map((s) => ({
          range: `'${s.title.slice(0, 99)}'!A1`,
          values: s.rows,
        })),
      },
    });

    return { spreadsheetId, spreadsheetUrl };
  });
