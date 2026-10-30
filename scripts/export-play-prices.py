"""Export COUNTRY_TIER map to a simple CSV for Play Console price import reference."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
text = (ROOT / "lib" / "country-pricing.ts").read_text(encoding="utf-8")
body = re.search(r"export const COUNTRY_TIER[^=]*= \{([\s\S]*?)\n\};", text)
if not body:
    raise SystemExit("COUNTRY_TIER not found")
tiers = {"A": 99.0, "B": 29.0, "C": 15.0, "D": 10.0}
rows: list[tuple[str, float]] = []
for line in body.group(1).splitlines():
    m = re.match(r'\s*([A-Z]{2}): "([ABCD])"', line)
    if m:
        rows.append((m.group(1), tiers[m.group(2)]))
rows.sort()
out = ROOT / "docs" / "play-lifetime-country-prices.csv"
out.write_text(
    "Country/Region,Price\n" + "\n".join(f"{c},{p:.2f}" for c, p in rows) + "\n",
    encoding="utf-8",
)
print(f"wrote {len(rows)} rows -> {out}")
