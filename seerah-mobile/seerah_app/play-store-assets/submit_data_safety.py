"""Submit Data Safety CSV via Google Play Developer API."""
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

PACKAGE = "com.themuslimman.seerah"
KEY_FILE = Path(r"C:\Users\abe\Downloads\themuslimman-play-a0ab9529a237.json")
CSV_FILE = Path(__file__).with_name("data_safety_seerah.csv")
SCOPES = ["https://www.googleapis.com/auth/androidpublisher"]


def main() -> None:
    csv_text = CSV_FILE.read_text(encoding="utf-8")
    creds = service_account.Credentials.from_service_account_file(str(KEY_FILE), scopes=SCOPES)
    service = build("androidpublisher", "v3", credentials=creds, cache_discovery=False)
    try:
        service.applications().dataSafety(
            packageName=PACKAGE,
            body={"safetyLabels": csv_text},
        ).execute()
        print("Data safety submitted successfully.")
    except HttpError as e:
        print(f"API error {e.resp.status}: {e.content.decode()}")


if __name__ == "__main__":
    main()
