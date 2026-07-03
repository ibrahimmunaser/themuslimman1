"""Fix Play Store country availability and promote latest build to internal testing.

Internal testing has no country restrictions — testers can install from anywhere.
Also attempts to widen alpha country targeting via track update if supported.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

PACKAGE = "com.themuslimman.seerah"
KEY_FILE = Path(r"C:\Users\abe\Downloads\themuslimman-play-a0ab9529a237.json")
SCOPES = ["https://www.googleapis.com/auth/androidpublisher"]

# Common countries for Muslim diaspora + Rest of World via alpha unsync
WIDE_COUNTRY_CODES = [
    "US", "CA", "GB", "AU", "NZ", "IE", "DE", "FR", "NL", "BE", "SE", "NO", "DK",
    "PK", "IN", "BD", "MY", "SG", "ID", "AE", "SA", "QA", "KW", "BH", "OM", "EG",
    "TR", "NG", "ZA", "KE", "MA", "JO", "LB", "IQ", "YE", "SO", "SD", "TN", "DZ",
]


def get_service():
    creds = service_account.Credentials.from_service_account_file(str(KEY_FILE), scopes=SCOPES)
    return build("androidpublisher", "v3", credentials=creds, cache_discovery=False)


def print_availability(service, edit_id: str, track: str) -> None:
    try:
        ca = (
            service.edits()
            .countryavailability()
            .get(packageName=PACKAGE, editId=edit_id, track=track)
            .execute()
        )
        codes = [c.get("countryCode") for c in ca.get("countries", [])]
        print(f"  {track}: syncWithProduction={ca.get('syncWithProduction')} "
              f"restOfWorld={ca.get('restOfWorld')} countries={len(codes)} US={'US' in codes}")
    except HttpError as e:
        print(f"  {track}: {e.resp.status} {e.content.decode()[:200]}")


def latest_version_on_track(tracks: dict, track_name: str) -> int | None:
    for t in tracks.get("tracks", []):
        if t.get("track") == track_name:
            for rel in t.get("releases", []):
                for vc in rel.get("versionCodes", []):
                    return int(vc)
    return None


def main() -> int:
    if not KEY_FILE.exists():
        print(f"Missing service account key: {KEY_FILE}")
        return 1

    service = get_service()

    # ── Diagnostic (read-only edit) ───────────────────────────────────────────
    diag_edit = service.edits().insert(packageName=PACKAGE, body={}).execute()
    diag_id = diag_edit["id"]
    print("=== Current country availability ===")
    for track in ("production", "alpha", "beta"):
        print_availability(service, diag_id, track)
    tracks_before = service.edits().tracks().list(packageName=PACKAGE, editId=diag_id).execute()
    print("\n=== Current tracks ===")
    print(json.dumps(tracks_before, indent=2))
    service.edits().delete(packageName=PACKAGE, editId=diag_id).execute()

    alpha_vc = latest_version_on_track(tracks_before, "alpha") or 21
    print(f"\nPromoting versionCode {alpha_vc} to internal testing track...")

    # ── Apply changes ─────────────────────────────────────────────────────────
    edit = service.edits().insert(packageName=PACKAGE, body={}).execute()
    edit_id = edit["id"]
    print(f"Created edit {edit_id}")

    try:
        # 1. Internal testing — no country restrictions; best path for immediate install
        internal = (
            service.edits()
            .tracks()
            .update(
                packageName=PACKAGE,
                editId=edit_id,
                track="internal",
                body={
                    "track": "internal",
                    "releases": [
                        {
                            "name": f"{alpha_vc} (internal)",
                            "status": "completed",
                            "versionCodes": [str(alpha_vc)],
                        }
                    ],
                },
            )
            .execute()
        )
        print(f"Updated internal track: {internal.get('track')} releases={internal.get('releases')}")

        # 2. Try PATCH alpha with countryTargeting on the active release (may be rejected by API)
        alpha_track = service.edits().tracks().get(
            packageName=PACKAGE, editId=edit_id, track="alpha"
        ).execute()
        alpha_release = alpha_track.get("releases", [{}])[0]
        alpha_release["countryTargeting"] = {
            "countries": WIDE_COUNTRY_CODES,
            "includeRestOfWorld": True,
        }
        try:
            updated_alpha = (
                service.edits()
                .tracks()
                .update(
                    packageName=PACKAGE,
                    editId=edit_id,
                    track="alpha",
                    body={"track": "alpha", "releases": [alpha_release]},
                )
                .execute()
            )
            print(f"Updated alpha with wide country targeting: OK")
        except HttpError as e:
            print(f"Alpha countryTargeting via tracks.update not supported: {e.resp.status}")
            print(e.content.decode()[:500])

        # 3. Try countryavailability update via raw HTTP (undocumented but may exist)
        # Fall back: attempt PUT on countryAvailability endpoint
        try:
            from googleapiclient.http import HttpRequest
            body = {
                "syncWithProduction": False,
                "restOfWorld": True,
                "countries": [{"countryCode": c} for c in WIDE_COUNTRY_CODES],
            }
            request = service.edits().countryavailability().get(
                packageName=PACKAGE, editId=edit_id, track="alpha"
            )
            # Try update if method exists dynamically
            if hasattr(service.edits().countryavailability(), "update"):
                service.edits().countryavailability().update(
                    packageName=PACKAGE, editId=edit_id, track="alpha", body=body
                ).execute()
                print("Updated alpha country availability via API")
        except Exception as e:
            print(f"countryavailability update skipped: {e}")

        print("\n=== After changes (pre-commit) ===")
        for track in ("production", "alpha", "beta"):
            print_availability(service, edit_id, track)

        commit = (
            service.edits()
            .commit(packageName=PACKAGE, editId=edit_id, changesNotSentForReview=False)
            .execute()
        )
        print(f"\nCommitted edit: {commit.get('id')}")
        print("\nDone. Internal testing link (add your Gmail as internal tester in Play Console):")
        print(f"  https://play.google.com/apps/internaltest/{PACKAGE}")
        print(f"  or: Play Console > Testing > Internal testing > Testers > copy link")
        return 0

    except HttpError as e:
        print(f"API error {e.resp.status}: {e.content.decode()}")
        try:
            service.edits().delete(packageName=PACKAGE, editId=edit_id).execute()
        except Exception:
            pass
        return 1


if __name__ == "__main__":
    sys.exit(main())
