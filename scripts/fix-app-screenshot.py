from PIL import Image
import shutil
from pathlib import Path

root = Path(__file__).resolve().parents[1]
src = root / "public" / "images" / "app-screenshot.jpg"
backup = root / "public" / "images" / "app-screenshot-original.jpg"

img = Image.open(src).convert("RGB")
# Tight crop around the actual phone screen (not the black canvas padding).
crop = img.crop((352, 864, 887, 1823))
print("Cropped:", crop.size)

target = (1242, 2688)  # iPhone 6.5" App Store portrait
fixed = crop.resize(target, Image.Resampling.LANCZOS)

shutil.copy2(src, backup)
fixed.save(src, "JPEG", quality=95, optimize=True)
print("Saved:", src, fixed.size)
