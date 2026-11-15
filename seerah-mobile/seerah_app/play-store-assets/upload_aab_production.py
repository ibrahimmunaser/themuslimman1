"""Upload AAB to the production track via Google Play Developer API."""
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

PACKAGE = "com.themuslimman.seerah"
KEY_FILE = Path(r"C:\Users\abe\Downloads\themuslimman-play-a0ab9529a237.json")
AAB = Path(
    r"C:\Users\abe\Documents\Websites\Seerah\seerah-mobile\seerah_app\build\app\outputs\bundle\release\app-release.aab"
)
SCOPES = ["https://www.googleapis.com/auth/androidpublisher"]

RELEASE_NOTES = (
    "Fixed sign-in taking you back to the start screen instead of the "
    "dashboard. Fixed sign-out being slow. Added a short welcome intro for "
    "first-time users."
)


def main() -> None:
    creds = service_account.Credentials.from_service_account_file(str(KEY_FILE), scopes=SCOPES)
    service = build("androidpublisher", "v3", credentials=creds, cache_discovery=False)

    try:
        edit = service.edits().insert(packageName=PACKAGE, body={}).execute()
        edit_id = edit["id"]
        print(f"Created edit {edit_id}")

        media = MediaFileUpload(str(AAB), mimetype="application/octet-stream", resumable=True)
        bundle = (
            service.edits()
            .bundles()
            .upload(packageName=PACKAGE, editId=edit_id, media_body=media)
            .execute()
        )
        version_code = bundle["versionCode"]
        print(f"Uploaded bundle versionCode={version_code}")

        track = (
            service.edits()
            .tracks()
            .update(
                packageName=PACKAGE,
                editId=edit_id,
                track="production",
                body={
                    "track": "production",
                    "releases": [
                        {
                            "status": "completed",
                            "versionCodes": [str(version_code)],
                            "releaseNotes": [
                                {"language": "en-US", "text": RELEASE_NOTES}
                            ],
                        }
                    ],
                },
            )
            .execute()
        )
        print(f"Updated production track: {track.get('track')}")

        commit = service.edits().commit(packageName=PACKAGE, editId=edit_id).execute()
        print(f"Committed edit: {commit.get('id')}")
    except HttpError as e:
        print(f"API error {e.resp.status}: {e.content.decode()}")
        raise


if __name__ == "__main__":
    main()
