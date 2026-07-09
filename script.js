/* ========================================================
   ASCII Art Generator
   Upload an image, pick a character ramp, convert to ASCII.
   ======================================================== */

/* ---------- element references ---------- */
const fileInput = document.getElementById("file-input");
const dropzone = document.getElementById("dropzone");
const dropzoneText = document.getElementById("dropzone-text");
const previewThumb = document.getElementById("preview-thumb");

const charRampInput = document.getElementById("char-ramp");
const presetButtons = document.querySelectorAll(".preset-btn");

const widthRange = document.getElementById("width-range");
const widthValue = document.getElementById("width-value");
const colorToggle = document.getElementById("color-toggle");

const generateBtn = document.getElementById("generate-btn");
const outputPanel = document.getElementById("output-panel");
const asciiOutput = document.getElementById("ascii-output");

const downloadPngBtn = document.getElementById("download-png-btn");
const downloadTxtBtn = document.getElementById("download-txt-btn");

const sourceCanvas = document.getElementById("source-canvas");
const renderCanvas = document.getElementById("render-canvas");

const themeToggleBtn = document.getElementById("theme-toggle-btn");
const themePanel = document.getElementById("theme-panel");
const themePanelClose = document.getElementById("theme-panel-close");
const outputModeButtons = document.querySelectorAll(".output-mode-btn");

/* Roughly corrects for monospace characters being taller than they
   are wide, so the ASCII output doesn't look vertically stretched. */
const CHAR_ASPECT = 0.55;

let loadedImage = null;
let lastAsciiText = "";

/* ---------- theme picker ---------- */

const THEME_STORAGE_KEY = "ascii-art-theme";
const DEFAULT_THEME = "dark-orange";

const THEMES = [
    { id: "dark-red", label: "Red", group: "dark", swatch: "#ff4d4d" },
    { id: "dark-orange", label: "Orange", group: "dark", swatch: "#ff8c1a" },
    { id: "dark-yellow", label: "Yellow", group: "dark", swatch: "#ffe14f" },
    { id: "dark-green", label: "Green", group: "dark", swatch: "#39ff6a" },
    { id: "dark-blue", label: "Blue", group: "dark", swatch: "#3fa9ff" },
    { id: "dark-purple", label: "Purple", group: "dark", swatch: "#c86bff" },
    { id: "dark-pink", label: "Pink", group: "dark", swatch: "#ff4fa3" },
    { id: "light-red", label: "Red", group: "light", swatch: "#ff4d4d" },
    { id: "light-orange", label: "Orange", group: "light", swatch: "#ff8c1a" },
    { id: "light-yellow", label: "Yellow", group: "light", swatch: "#ffe14f" },
    { id: "light-green", label: "Green", group: "light", swatch: "#39ff6a" },
    { id: "light-blue", label: "Blue", group: "light", swatch: "#3fa9ff" },
    { id: "light-purple", label: "Purple", group: "light", swatch: "#c86bff" },
    { id: "light-pink", label: "Pink", group: "light", swatch: "#ff4fa3" },
    { id: "bw", label: "B&W", group: "mono", swatch: "#ffffff" },
];

function applyTheme(themeId) {
    document.documentElement.setAttribute("data-theme", themeId);
    localStorage.setItem(THEME_STORAGE_KEY, themeId);

    document.querySelectorAll(".theme-swatch").forEach((swatch) => {
        swatch.setAttribute("aria-pressed", String(swatch.dataset.theme === themeId));
    });

    // the output box color depends on the current hue, so recompute it
    // for whichever dark/light output mode is currently selected
    applyOutputMode(currentOutputMode);
}

/* ---------- output box color (independent of the page theme) ---------- */

const OUTPUT_MODE_STORAGE_KEY = "ascii-art-output-mode";
const DEFAULT_OUTPUT_MODE = "light";

// per-hue output colors; the page theme controls the hue, this toggle
// controls whether the output box itself renders in its dark or light look
const OUTPUT_HUES = {
    red: { dark: { bg: "#000000", text: "#ff4d4d" }, light: { bg: "#ffffff", text: "#d6323c" } },
    orange: { dark: { bg: "#000000", text: "#ff8c1a" }, light: { bg: "#ffffff", text: "#d1660b" } },
    yellow: { dark: { bg: "#000000", text: "#ffe14f" }, light: { bg: "#ffffff", text: "#b8860b" } },
    green: { dark: { bg: "#000000", text: "#39ff6a" }, light: { bg: "#ffffff", text: "#1f8a44" } },
    blue: { dark: { bg: "#000000", text: "#3fa9ff" }, light: { bg: "#ffffff", text: "#1d6fd6" } },
    purple: { dark: { bg: "#000000", text: "#c86bff" }, light: { bg: "#ffffff", text: "#7c3fd1" } },
    pink: { dark: { bg: "#000000", text: "#ff4fa3" }, light: { bg: "#ffffff", text: "#d63384" } },
    bw: { dark: { bg: "#000000", text: "#ffffff" }, light: { bg: "#ffffff", text: "#000000" } },
};

let currentOutputMode = localStorage.getItem(OUTPUT_MODE_STORAGE_KEY) || DEFAULT_OUTPUT_MODE;

function currentHue() {
    const theme = document.documentElement.getAttribute("data-theme") || DEFAULT_THEME;
    return theme.replace(/^dark-|^light-/, "");
}

function applyOutputMode(mode) {
    currentOutputMode = mode;
    localStorage.setItem(OUTPUT_MODE_STORAGE_KEY, mode);

    const hue = OUTPUT_HUES[currentHue()] ? currentHue() : "orange";
    const style = OUTPUT_HUES[hue][mode];
    document.documentElement.style.setProperty("--output-bg", style.bg);
    document.documentElement.style.setProperty("--output-text", style.text);

    outputModeButtons.forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.outputMode === mode));
    });
}

outputModeButtons.forEach((button) => {
    button.addEventListener("click", () => applyOutputMode(button.dataset.outputMode));
});

function buildThemeSwatches() {
    THEMES.forEach((theme) => {
        const group = document.querySelector(`.theme-swatches[data-group="${theme.group}"]`);
        if (!group) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "theme-swatch";
        button.dataset.theme = theme.id;
        button.style.setProperty("--sw", theme.swatch);
        button.title = theme.label;
        button.setAttribute("aria-label", theme.label);
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", () => applyTheme(theme.id));

        group.appendChild(button);
    });
}

function openThemePanel() {
    themePanel.hidden = false;
    themeToggleBtn.setAttribute("aria-expanded", "true");
}

function closeThemePanel() {
    themePanel.hidden = true;
    themeToggleBtn.setAttribute("aria-expanded", "false");
}

themeToggleBtn.addEventListener("click", () => {
    if (themePanel.hidden) {
        openThemePanel();
    } else {
        closeThemePanel();
    }
});

themePanelClose.addEventListener("click", closeThemePanel);

document.addEventListener("click", (event) => {
    if (themePanel.hidden) return;
    if (themePanel.contains(event.target) || themeToggleBtn.contains(event.target)) return;
    closeThemePanel();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !themePanel.hidden) {
        closeThemePanel();
    }
});

buildThemeSwatches();
applyTheme(document.documentElement.getAttribute("data-theme") || DEFAULT_THEME);

/* ---------- image selection ---------- */

dropzone.addEventListener("click", () => fileInput.click());

dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("dragover");
    if (event.dataTransfer.files.length > 0) {
        handleFile(event.dataTransfer.files[0]);
    }
});

fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
        handleFile(fileInput.files[0]);
    }
});

function handleFile(file) {
    if (!file.type.startsWith("image/")) {
        dropzoneText.textContent = "That file isn't an image. Try again.";
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            loadedImage = img;
            previewThumb.src = event.target.result;
            previewThumb.hidden = false;
            dropzoneText.textContent = file.name;
            generateBtn.disabled = false;
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

/* ---------- character ramp presets ---------- */

presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
        charRampInput.value = button.dataset.ramp;
    });
});

/* ---------- width slider label ---------- */

widthRange.addEventListener("input", () => {
    widthValue.textContent = widthRange.value;
});

/* ---------- generate ---------- */

generateBtn.addEventListener("click", () => {
    if (!loadedImage) return;

    const ramp = charRampInput.value;
    if (ramp.length < 2) {
        alert("Enter at least two characters in the ramp field.");
        return;
    }

    const columns = parseInt(widthRange.value, 10);
    const useColor = colorToggle.checked;

    const { lines, colors } = imageToAscii(loadedImage, ramp, columns);
    lastAsciiText = lines.join("\n");

    renderToPage(lines, colors, useColor);
    renderToCanvas(lines, colors, useColor);

    outputPanel.hidden = false;
    outputPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});

/* ---------- core conversion ---------- */

function imageToAscii(image, ramp, columns) {
    const aspectRatio = image.height / image.width;
    const rows = Math.max(1, Math.round(columns * aspectRatio * CHAR_ASPECT));

    sourceCanvas.width = columns;
    sourceCanvas.height = rows;
    const ctx = sourceCanvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, columns, rows);
    ctx.drawImage(image, 0, 0, columns, rows);

    const { data } = ctx.getImageData(0, 0, columns, rows);

    const lines = [];
    const colors = [];

    for (let y = 0; y < rows; y++) {
        let line = "";
        const colorRow = [];

        for (let x = 0; x < columns; x++) {
            const i = (y * columns + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const alpha = data[i + 3];

            // treat transparent pixels as blank space
            if (alpha < 16) {
                line += " ";
                colorRow.push("rgb(0,0,0)");
                continue;
            }

            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            const index = Math.min(
                ramp.length - 1,
                Math.floor((luminance / 255) * ramp.length)
            );

            line += ramp[index];
            colorRow.push(`rgb(${r},${g},${b})`);
        }

        lines.push(line);
        colors.push(colorRow);
    }

    return { lines, colors };
}

/* ---------- render to the on-page <pre> ---------- */

function renderToPage(lines, colors, useColor) {
    if (!useColor) {
        asciiOutput.textContent = lines.join("\n");
        return;
    }

    // color mode needs per-character spans, so build with a fragment
    asciiOutput.textContent = "";
    const fragment = document.createDocumentFragment();

    for (let y = 0; y < lines.length; y++) {
        for (let x = 0; x < lines[y].length; x++) {
            const span = document.createElement("span");
            span.textContent = lines[y][x];
            span.style.color = colors[y][x];
            fragment.appendChild(span);
        }
        fragment.appendChild(document.createTextNode("\n"));
    }

    asciiOutput.appendChild(fragment);
}

/* ---------- render to an offscreen canvas, for PNG export ---------- */

function renderToCanvas(lines, colors, useColor) {
    const rootStyle = getComputedStyle(document.documentElement);
    const outputBg = rootStyle.getPropertyValue("--output-bg").trim() || "#000000";
    const outputText = rootStyle.getPropertyValue("--output-text").trim() || "#ffb000";

    const fontSize = 8;
    const ctx = renderCanvas.getContext("2d");
    ctx.font = `${fontSize}px "DejaVu Sans Mono", "Courier New", monospace`;

    const charWidth = ctx.measureText("M").width;
    const charHeight = fontSize;

    const columns = lines[0] ? lines[0].length : 0;
    const rows = lines.length;

    renderCanvas.width = Math.ceil(columns * charWidth);
    renderCanvas.height = Math.ceil(rows * charHeight);

    // re-apply font, it resets when the canvas is resized
    ctx.font = `${fontSize}px "DejaVu Sans Mono", "Courier New", monospace`;
    ctx.textBaseline = "top";
    ctx.fillStyle = outputBg;
    ctx.fillRect(0, 0, renderCanvas.width, renderCanvas.height);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
            ctx.fillStyle = useColor ? colors[y][x] : outputText;
            ctx.fillText(lines[y][x], x * charWidth, y * charHeight);
        }
    }
}

/* ---------- downloads ---------- */

downloadPngBtn.addEventListener("click", () => {
    if (!lastAsciiText) return;
    const link = document.createElement("a");
    link.download = "ascii-art.png";
    link.href = renderCanvas.toDataURL("image/png");
    link.click();
});

downloadTxtBtn.addEventListener("click", () => {
    if (!lastAsciiText) return;
    const blob = new Blob([lastAsciiText], { type: "text/plain" });
    const link = document.createElement("a");
    link.download = "ascii-art.txt";
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
});