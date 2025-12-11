const input = document.getElementById("userInput");
const result = document.getElementById("result");
const targetDiv = document.getElementById("character-target-div");

let writers = [];

input.addEventListener("input", () => {
    const text = input.value.trim();
    result.textContent = text || "输入汉字";
    loadCharacters(text);
});

function loadCharacters(text) {
    targetDiv.innerHTML = "";
    writers = [];

    if (!text) return;

    text.split("").forEach((char, i) => {
        const div = document.createElement("div");
        div.id = "char-" + i;
        div.style.width = "120px";
        div.style.height = "120px";
        targetDiv.appendChild(div);

        const writer = HanziWriter.create(div.id, char, {
            width: 120,
            height: 120,
            padding: 5,
            strokeColor: "#444",
            radicalColor: "#168715",
            showOutline: true,
            showCharacter: false
        });

        writers.push(writer);
    });
}

/* ⭐ Sequential animation */
async function animateCharacters() {
    if (writers.length === 0) return alert("Enter characters first.");

    for (let w of writers) {
        await new Promise(resolve => {
            w.animateCharacter({ onComplete: resolve });
        });
    }
}

/* ⭐ Compact SVG generator */
function createSVG(text) {
    const charWidth = 120;
    const totalWidth = charWidth * text.length;

    return `
        <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="180">
            <rect width="100%" height="100%" fill="white"/>
            ${text.split("").map((c, i) => `
                <text x="${charWidth / 2 + i * charWidth}" y="50%"
                font-family="SimSun, STKaiti, serif"
                font-size="120"
                text-anchor="middle"
                dominant-baseline="central">${c}</text>
            `).join("")}
        </svg>`;
}

function downloadSvg() {
    const text = input.value.trim();
    if (!text) return alert("Enter characters first");

    const svg = createSVG(text);
    const blob = new Blob([svg], { type: "image/svg+xml" });

    downloadFile(blob, text + ".svg");
}

function downloadPng() {
    const text = input.value.trim();
    if (!text) return alert("Enter characters first");

    const svg = createSVG(text);
    const img = new Image();
    const canvas = document.createElement("canvas");
    canvas.width = text.length * 120;
    canvas.height = 180;
    const ctx = canvas.getContext("2d");

    img.onload = () => {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => downloadFile(blob, text + ".png"));
    };

    img.src = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
}

function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
