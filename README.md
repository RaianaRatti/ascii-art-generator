# ASCII Art Generator

A browser-based tool that converts any image into ASCII art. Upload a photo, choose the characters used to represent brightness, and generate a text or image version of the result. A matching command-line script is included for use outside the browser.

## Project in Action

Project output in action!

(https://github.com/user-attachments/assets/05fa3acb-d8c1-455e-8b25-0f5330f9081d)

## Features

- Upload an image by clicking the dropzone or dragging a file onto it
- Define a custom character ramp (the set of characters used, ordered from darkest to lightest), or pick from four presets: standard, detailed, blocks, minimal
- Adjust output resolution with a width slider (40 to 300 characters wide)
- Optional color mode, which tints each character with its source pixel's color instead of a single accent color
- Download the result as a `.txt` file or a rendered `.png` image
- Command-line version (`logic.py`) for generating ASCII art without a browser

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure and layout |
| `style.css` | Terminal-style visual design |
| `script.js` | Image processing, character mapping, rendering, and downloads |
| `logic.py` | Standalone command-line version of the same conversion logic |
| `imageSegmentation.py` | Separate desktop tool (Tkinter + OpenCV) for watershed image segmentation; not part of the ASCII conversion flow |

## How It Works

1. The source image is drawn onto a hidden canvas, scaled down to the chosen output width. The height is scaled to match, with a correction factor applied since monospace characters are taller than they are wide.
2. Each pixel in the scaled-down image is converted to a brightness value (luminance), using the standard formula `0.299R + 0.587G + 0.114B`.
3. That brightness value is mapped to a character in the ramp: darker pixels map to characters near the start of the ramp, lighter pixels map to characters near the end.
4. The resulting grid of characters is displayed as text and also drawn onto a second canvas, which is used to export a PNG image.

## Usage (Web)

1. Open `index.html` in any web browser. No build step or server required.
2. Upload an image.
3. Edit the character ramp field, or click a preset.
4. Adjust the width slider if needed.
5. Check the color mode box for a colored result, or leave it unchecked for a single-color amber output.
6. Click **RUN**.
7. Download the result as `.txt` or `.png`.

## Usage (Command Line)

`logic.py` requires Pillow:

```bash
pip install pillow
```

Print ASCII art directly to the terminal:

```bash
python logic.py photo.jpg
```

Save as a text file:

```bash
python logic.py photo.jpg -o art.txt -w 150
```

Save as a PNG image, in color:

```bash
python logic.py photo.jpg -o art.png -w 150 --color
```

Use a custom character ramp:

```bash
python logic.py photo.jpg -c "@%#*+=-:. "
```

### Command-line options

| Flag | Description | Default |
|---|---|---|
| `image` | Path to the source image (required) | - |
| `-o`, `--output` | Output path. Use `.txt` for text, or `.png`/`.jpg` for an image. Prints to the terminal if omitted | none |
| `-c`, `--chars` | Character ramp, darkest to lightest | `@%#*+=-:. ` |
| `-w`, `--width` | Output width in characters | `100` |
| `--color` | Keep original pixel colors (image output only) | off |
| `--font-size` | Font size in pixels (image output only) | `10` |
| `--font` | Path to a custom monospace `.ttf` font (image output only) | system default |

## Requirements

- **Web version**: any modern browser, no dependencies
- **Command-line version**: Python 3 and Pillow (`pip install pillow`)
- **imageSegmentation.py** (separate tool): Python 3, OpenCV (`opencv-python`), NumPy, and Tkinter

## License

MIT