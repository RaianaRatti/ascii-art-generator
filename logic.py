import argparse
import os

from PIL import Image, ImageDraw, ImageFont # type:ignore

DEFAULT_RAMP = "@%#*+=-:. "

# characters are taller than they are wide in most monospace fonts,
# this keeps the output from looking vertically stretched
CHAR_ASPECT = 0.55

# common monospace font locations, checked in order
FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
    "C:\\Windows\\Fonts\\consola.ttf",
    "/System/Library/Fonts/Menlo.ttc",
]


def load_image(path, width, char_aspect=CHAR_ASPECT):
    """Open an image and resize it to the target ASCII grid size."""
    image = Image.open(path).convert("RGB")
    aspect_ratio = image.height / image.width
    height = max(1, round(width * aspect_ratio * char_aspect))
    return image.resize((width, height))


def image_to_ascii(image, ramp=DEFAULT_RAMP):
    """
    Convert a PIL image into ASCII art.

    Returns:
        lines: list of strings, one per row
        colors: list of rows, each a list of (r, g, b) tuples matching
                the character at that position
    """
    pixels = image.load()
    width, height = image.size

    lines = []
    colors = []

    for y in range(height):
        row_chars = []
        row_colors = []

        for x in range(width):
            r, g, b = pixels[x, y]
            luminance = 0.299 * r + 0.587 * g + 0.114 * b
            index = min(len(ramp) - 1, int((luminance / 255) * len(ramp)))

            row_chars.append(ramp[index])
            row_colors.append((r, g, b))

        lines.append("".join(row_chars))
        colors.append(row_colors)

    return lines, colors


def find_monospace_font(font_size, custom_path=None):
    """Try to load a scalable monospace font, falling back to PIL's default."""
    candidates = [custom_path] if custom_path else []
    candidates += FONT_CANDIDATES

    for path in candidates:
        if path and os.path.exists(path):
            return ImageFont.truetype(path, font_size)

    try:
        return ImageFont.load_default(size=font_size)
    except TypeError:
        # older Pillow versions don't accept a size argument here
        return ImageFont.load_default()


def render_ascii_image(lines, colors, use_color=False, font_size=10, font_path=None):
    """Render ASCII text lines onto a PIL image, for saving as PNG/JPG."""
    font = find_monospace_font(font_size, font_path)

    dummy = Image.new("RGB", (1, 1))
    draw = ImageDraw.Draw(dummy)
    bbox = draw.textbbox((0, 0), "M", font=font)
    char_width = bbox[2] - bbox[0] or font_size
    char_height = int(font_size * 1.2)

    columns = len(lines[0]) if lines else 0
    rows = len(lines)

    canvas = Image.new("RGB", (columns * char_width, rows * char_height), "black")
    draw = ImageDraw.Draw(canvas)

    for y, line in enumerate(lines):
        for x, char in enumerate(line):
            fill = colors[y][x] if use_color else (255, 176, 0)  # amber
            draw.text((x * char_width, y * char_height), char, font=font, fill=fill)

    return canvas


def save_output(lines, colors, output_path, use_color=False, font_size=10, font_path=None):
    """Save ASCII art as either a .txt file or an image, based on the extension."""
    ext = os.path.splitext(output_path)[1].lower()

    if ext in (".png", ".jpg", ".jpeg", ".bmp"):
        image = render_ascii_image(lines, colors, use_color, font_size, font_path)
        image.save(output_path)
    else:
        with open(output_path, "w") as f:
            f.write("\n".join(lines))


def main():
    parser = argparse.ArgumentParser(description="Convert an image into ASCII art.")
    parser.add_argument("image", help="Path to the source image")
    parser.add_argument(
        "-o", "--output",
        help="Output path. Use .txt for plain text, or .png/.jpg to save as an image. "
             "If omitted, prints to the terminal."
    )
    parser.add_argument(
        "-c", "--chars",
        default=DEFAULT_RAMP,
        help=f"Character ramp, ordered darkest to lightest (default: '{DEFAULT_RAMP}')"
    )
    parser.add_argument(
        "-w", "--width",
        type=int, default=100,
        help="Output width in characters (default: 100)"
    )
    parser.add_argument(
        "--color",
        action="store_true",
        help="Keep original pixel colors when saving as an image"
    )
    parser.add_argument(
        "--font-size",
        type=int, default=10,
        help="Font size in pixels, only used when saving as an image (default: 10)"
    )
    parser.add_argument(
        "--font",
        help="Path to a custom monospace .ttf font, only used when saving as an image"
    )

    args = parser.parse_args()

    if len(args.chars) < 2:
        parser.error("--chars needs at least two characters")

    image = load_image(args.image, args.width)
    lines, colors = image_to_ascii(image, args.chars)

    if not args.output:
        print("\n".join(lines))
        return

    save_output(
        lines, colors, args.output,
        use_color=args.color,
        font_size=args.font_size,
        font_path=args.font,
    )
    print(f"Saved to {args.output}")


if __name__ == "__main__":
    main()