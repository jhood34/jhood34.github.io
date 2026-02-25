"""
Batch Image Optimizer for Photography Website
Converts JPG/JPEG/PNG images to WebP, resizes oversized images.
Originals are preserved — WebP files are created alongside them.

Usage: python optimize_images.py
"""

import os
import sys
from pathlib import Path
from PIL import Image

# Configuration
IMAGES_DIR = Path(__file__).parent / "images"
GALLERY_MAX_WIDTH = 2000       # Max width for gallery/full images
THUMBNAIL_MAX_WIDTH = 600      # Max width for thumbnail images
WEBP_QUALITY = 87              # WebP quality (0-100)

# Folders that contain thumbnails (use smaller max width)
THUMBNAIL_FOLDERS = {"journey_thumbnail_images"}

# Extensions to process
PROCESS_EXTENSIONS = {".jpg", ".jpeg", ".png"}

# Files/folders to skip entirely
SKIP_FILES = {"delicious_hamburger.png"}  # Tiny icon, no benefit
SKIP_EXTENSIONS = {".svg", ".gif"}         # SVG is vector, GIF is animated


def get_max_width(file_path: Path) -> int:
    """Determine the max width based on which folder the image is in."""
    for parent in file_path.parents:
        if parent.name in THUMBNAIL_FOLDERS:
            return THUMBNAIL_MAX_WIDTH
    return GALLERY_MAX_WIDTH


def optimize_image(src_path: Path) -> dict:
    """
    Convert a single image to WebP, resizing if needed.
    Returns a dict with stats: {original_size, new_size, resized, skipped}.
    """
    result = {
        "original_size": src_path.stat().st_size,
        "new_size": 0,
        "resized": False,
        "skipped": False,
    }

    # Determine output path (same name, .webp extension)
    webp_path = src_path.with_suffix(".webp")

    try:
        with Image.open(src_path) as img:
            # Convert to RGB if necessary (e.g. RGBA PNGs, CMYK)
            if img.mode in ("RGBA", "LA"):
                # Preserve transparency for PNGs
                pass
            elif img.mode not in ("RGB",):
                img = img.convert("RGB")

            max_width = get_max_width(src_path)
            width, height = img.size

            # Resize if wider than max
            if width > max_width:
                ratio = max_width / width
                new_height = int(height * ratio)
                img = img.resize((max_width, new_height), Image.LANCZOS)
                result["resized"] = True

            # Save as WebP
            save_kwargs = {"quality": WEBP_QUALITY, "method": 4}
            if img.mode in ("RGBA", "LA"):
                img.save(webp_path, "WEBP", **save_kwargs)
            else:
                if img.mode != "RGB":
                    img = img.convert("RGB")
                img.save(webp_path, "WEBP", **save_kwargs)

            result["new_size"] = webp_path.stat().st_size

    except Exception as e:
        print(f"  ERROR processing {src_path}: {e}")
        result["skipped"] = True

    return result


def format_size(size_bytes: int) -> str:
    """Format bytes into human-readable string."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"


def main():
    if not IMAGES_DIR.exists():
        print(f"ERROR: Images directory not found: {IMAGES_DIR}")
        sys.exit(1)

    print(f"Scanning: {IMAGES_DIR}")
    print(f"Gallery max width: {GALLERY_MAX_WIDTH}px")
    print(f"Thumbnail max width: {THUMBNAIL_MAX_WIDTH}px")
    print(f"WebP quality: {WEBP_QUALITY}")
    print("=" * 60)

    total_original = 0
    total_new = 0
    processed = 0
    skipped = 0
    resized = 0

    # Collect all image files
    image_files = []
    for root, dirs, files in os.walk(IMAGES_DIR):
        for filename in sorted(files):
            file_path = Path(root) / filename
            ext = file_path.suffix.lower()

            # Skip non-processable files
            if ext in SKIP_EXTENSIONS:
                continue
            if filename in SKIP_FILES:
                continue
            if ext not in PROCESS_EXTENSIONS:
                continue

            image_files.append(file_path)

    total_files = len(image_files)
    print(f"Found {total_files} images to process\n")

    for i, file_path in enumerate(image_files, 1):
        rel_path = file_path.relative_to(IMAGES_DIR)
        print(f"[{i}/{total_files}] {rel_path}...", end=" ", flush=True)

        result = optimize_image(file_path)

        if result["skipped"]:
            skipped += 1
            print("SKIPPED")
            continue

        processed += 1
        total_original += result["original_size"]
        total_new += result["new_size"]

        if result["resized"]:
            resized += 1

        savings = result["original_size"] - result["new_size"]
        pct = (savings / result["original_size"] * 100) if result["original_size"] > 0 else 0
        status = "resized + " if result["resized"] else ""
        print(f"{status}{format_size(result['original_size'])} -> {format_size(result['new_size'])} (-{pct:.0f}%)")

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Processed:     {processed} images")
    print(f"Resized:       {resized} images (exceeded max width)")
    print(f"Skipped:       {skipped} images (errors)")
    print(f"Original total: {format_size(total_original)}")
    print(f"WebP total:     {format_size(total_new)}")
    if total_original > 0:
        saved = total_original - total_new
        pct = saved / total_original * 100
        print(f"Total saved:    {format_size(saved)} (-{pct:.0f}%)")


if __name__ == "__main__":
    main()
