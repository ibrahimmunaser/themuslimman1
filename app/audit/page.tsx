/**
 * TEMPORARY AUDIT ROUTE — no auth required.
 * Remove this file after the content audit is complete.
 *
 * Usage: /audit          → list of all parts
 *        /audit?part=5   → renders part 5 briefingHtml inline
 */

import { PART_CONTENT } from "@/lib/part-content-data";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ part?: string }>;
}

export default async function AuditPage({ searchParams }: Props) {
  const params = await searchParams;
  const partNum = params.part ? parseInt(params.part, 10) : null;

  // ── Single part view ─────────────────────────────────────────────────────────
  if (partNum !== null && !isNaN(partNum)) {
    const entry = PART_CONTENT[partNum];
    const prev = partNum > 1 ? partNum - 1 : null;
    const next = partNum < 100 ? partNum + 1 : null;

    return (
      <div style={{ background: "#0f0f0f", minHeight: "100vh", color: "#e0e0e0", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "24px 16px" }}>

          {/* Nav bar */}
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
            <Link href="/audit" style={{ color: "#d4af37", fontSize: 13 }}>← All Parts</Link>
            {prev && <Link href={`/audit?part=${prev}`} style={{ color: "#d4af37", fontSize: 13 }}>‹ Part {prev}</Link>}
            <span style={{ flex: 1 }} />
            {next && <Link href={`/audit?part=${next}`} style={{ color: "#d4af37", fontSize: 13 }}>Part {next} ›</Link>}
          </div>

          <h1 style={{ color: "#d4af37", fontSize: 20, marginBottom: 8 }}>Part {partNum} — Read / Brief Audit</h1>

          {!entry ? (
            <p style={{ color: "#f87171" }}>⚠ No entry found for part {partNum}</p>
          ) : !entry.briefingHtml ? (
            <p style={{ color: "#f87171" }}>⚠ briefingHtml is null for part {partNum}</p>
          ) : (
            <>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 16 }}>
                briefingHtml length: {entry.briefingHtml.length} chars
              </div>
              <div
                className="formatted-text"
                style={{ background: "#1a1a1a", borderRadius: 8, padding: "24px 20px" }}
                dangerouslySetInnerHTML={{ __html: entry.briefingHtml }}
              />
            </>
          )}

          {/* Bottom nav */}
          <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "space-between" }}>
            {prev
              ? <Link href={`/audit?part=${prev}`} style={{ color: "#d4af37" }}>‹ Part {prev}</Link>
              : <span />}
            {next
              ? <Link href={`/audit?part=${next}`} style={{ color: "#d4af37" }}>Part {next} ›</Link>
              : <span style={{ color: "#666" }}>End of course</span>}
          </div>

        </div>
      </div>
    );
  }

  // ── Index view — list all 100 parts ─────────────────────────────────────────
  const entries = Object.entries(PART_CONTENT).sort(([a], [b]) => Number(a) - Number(b));

  return (
    <div style={{ background: "#0f0f0f", minHeight: "100vh", color: "#e0e0e0", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 16px" }}>
        <h1 style={{ color: "#d4af37", marginBottom: 8 }}>Read / Brief Audit — All 100 Parts</h1>
        <p style={{ color: "#888", fontSize: 13, marginBottom: 24 }}>Temporary no-auth route. Click any part to inspect its rendered briefingHtml.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
          {entries.map(([num, entry]) => {
            const n = Number(num);
            const hasHtml = !!entry.briefingHtml;
            const hasText = !!entry.briefingText;
            const status = !hasHtml && !hasText ? "❌ empty" : !hasHtml ? "⚠ no html" : "✓";
            const color = status === "✓" ? "#4ade80" : "#f87171";
            return (
              <Link
                key={n}
                href={`/audit?part=${n}`}
                style={{
                  display: "block",
                  padding: "10px 12px",
                  background: "#1a1a1a",
                  borderRadius: 6,
                  border: "1px solid #333",
                  color: "#e0e0e0",
                  textDecoration: "none",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "#d4af37", fontWeight: 600 }}>Part {n}</span>
                <span style={{ color, marginLeft: 8, fontSize: 11 }}>{status}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
