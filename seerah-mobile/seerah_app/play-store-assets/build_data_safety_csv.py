"""Build Seerah app Data Safety CSV from Google's template."""
import csv
from pathlib import Path

TEMPLATE = Path(__file__).with_name("data_safety_template.csv")
OUTPUT = Path(__file__).with_name("data_safety_seerah.csv")

SELECTED_TYPES = {
    ("PSL_DATA_TYPES_PERSONAL", "PSL_NAME"),
    ("PSL_DATA_TYPES_PERSONAL", "PSL_EMAIL"),
    ("PSL_DATA_TYPES_FINANCIAL", "PSL_PURCHASE_HISTORY"),
}

USAGE_ANSWERS = {
    # Name — optional display name
    ("PSL_DATA_USAGE_RESPONSES:PSL_NAME:PSL_DATA_USAGE_COLLECTION_AND_SHARING", "PSL_DATA_USAGE_ONLY_COLLECTED"): "true",
    ("PSL_DATA_USAGE_RESPONSES:PSL_NAME:PSL_DATA_USAGE_EPHEMERAL", ""): "false",
    ("PSL_DATA_USAGE_RESPONSES:PSL_NAME:DATA_USAGE_USER_CONTROL", "PSL_DATA_USAGE_USER_CONTROL_OPTIONAL"): "true",
    ("PSL_DATA_USAGE_RESPONSES:PSL_NAME:DATA_USAGE_COLLECTION_PURPOSE", "PSL_APP_FUNCTIONALITY"): "true",
    ("PSL_DATA_USAGE_RESPONSES:PSL_NAME:DATA_USAGE_COLLECTION_PURPOSE", "PSL_ACCOUNT_MANAGEMENT"): "true",
    # Email — required for login
    ("PSL_DATA_USAGE_RESPONSES:PSL_EMAIL:PSL_DATA_USAGE_COLLECTION_AND_SHARING", "PSL_DATA_USAGE_ONLY_COLLECTED"): "true",
    ("PSL_DATA_USAGE_RESPONSES:PSL_EMAIL:PSL_DATA_USAGE_EPHEMERAL", ""): "false",
    ("PSL_DATA_USAGE_RESPONSES:PSL_EMAIL:DATA_USAGE_USER_CONTROL", "PSL_DATA_USAGE_USER_CONTROL_REQUIRED"): "true",
    ("PSL_DATA_USAGE_RESPONSES:PSL_EMAIL:DATA_USAGE_COLLECTION_PURPOSE", "PSL_APP_FUNCTIONALITY"): "true",
    ("PSL_DATA_USAGE_RESPONSES:PSL_EMAIL:DATA_USAGE_COLLECTION_PURPOSE", "PSL_ACCOUNT_MANAGEMENT"): "true",
    # Purchase history — IAP entitlement
    ("PSL_DATA_USAGE_RESPONSES:PSL_PURCHASE_HISTORY:PSL_DATA_USAGE_COLLECTION_AND_SHARING", "PSL_DATA_USAGE_ONLY_COLLECTED"): "true",
    ("PSL_DATA_USAGE_RESPONSES:PSL_PURCHASE_HISTORY:PSL_DATA_USAGE_EPHEMERAL", ""): "false",
    ("PSL_DATA_USAGE_RESPONSES:PSL_PURCHASE_HISTORY:DATA_USAGE_USER_CONTROL", "PSL_DATA_USAGE_USER_CONTROL_REQUIRED"): "true",
    ("PSL_DATA_USAGE_RESPONSES:PSL_PURCHASE_HISTORY:DATA_USAGE_COLLECTION_PURPOSE", "PSL_APP_FUNCTIONALITY"): "true",
    ("PSL_DATA_USAGE_RESPONSES:PSL_PURCHASE_HISTORY:DATA_USAGE_COLLECTION_PURPOSE", "PSL_ACCOUNT_MANAGEMENT"): "true",
}

OVERVIEW = {
    "PSL_DATA_COLLECTION_COLLECTS_PERSONAL_DATA": "true",
    "PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT": "true",
    "PSL_DATA_COLLECTION_USER_REQUEST_DELETE": "true",
}


def main() -> None:
    rows: list[list[str]] = []
    with TEMPLATE.open(newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        rows.append(header)
        for row in reader:
            if len(row) < 5:
                rows.append(row)
                continue
            qid, rid, _, req, _ = row[0], row[1], row[2], row[3], row[4]
            value = row[2]

            if qid in OVERVIEW and not rid:
                value = OVERVIEW[qid]
            elif (qid, rid) in SELECTED_TYPES:
                value = "true"
            elif qid.startswith("PSL_DATA_TYPES_") and (qid, rid) not in SELECTED_TYPES:
                value = ""
            elif (qid, rid) in USAGE_ANSWERS:
                value = USAGE_ANSWERS[(qid, rid)]
            elif qid.startswith("PSL_DATA_USAGE_RESPONSES:"):
                data_type = qid.split(":")[1]
                if data_type not in {"PSL_NAME", "PSL_EMAIL", "PSL_PURCHASE_HISTORY"}:
                    value = ""
                elif rid and value.lower() == "true":
                    value = ""

            rows.append([qid, rid, value, req, row[4]])

    with OUTPUT.open("w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(rows)

    print(f"Wrote {OUTPUT} ({len(rows) - 1} data rows)")


if __name__ == "__main__":
    main()
