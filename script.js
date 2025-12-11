// DOM Elements
const input = document.getElementById("userInput");
const result = document.getElementById("result");
const targetDiv = document.getElementById("character-target-div");

// State
let writers = [];

// Input Event Listener
input.addEventListener("input", () => {
    const text = input.value.trim();
    updatePreview(text);
    loadCharacters(text);
});

// Update preview display
function updatePreview(text) {
    if (!text) {
        result.textContent = "输入汉字";
        result.style.color = "#94a3b8";
    } else {
        result.textContent = text;
        result.style.color = "#92400e";
    }
}

// Load characters into animation grid
function loadCharacters(text) {
    // Clear previous content
    targetDiv.innerHTML = "";
    writers = [];

    if (!text) return;

    // Create a character container for each character
    text.split("").forEach((char, index) => {
        // Skip spaces - just add a small spacing element
        if (char === ' ') {
            const spacer = document.createElement("div");
            spacer.style.width = "40px";
            spacer.style.height = "140px";
            targetDiv.appendChild(spacer);
            return;
        }

        const charContainer = document.createElement("div");
        charContainer.id = `char-${index}`;
        charContainer.style.width = "140px";
        charContainer.style.height = "140px";
        charContainer.className = "character-item";
        targetDiv.appendChild(charContainer);

        try {
            // Create HanziWriter instance
            const writer = HanziWriter.create(charContainer.id, char, {
                width: 140,
                height: 140,
                padding: 10,
                strokeColor: "#1e293b",
                radicalColor: "#667eea",
                outlineColor: "#cbd5e1",
                showOutline: true,
                showCharacter: false,
                strokeAnimationSpeed: 1,
                delayBetweenStrokes: 100
            });

            writers.push(writer);
        } catch (error) {
            console.error(`Error creating writer for character: ${char}`, error);
            charContainer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#ef4444;font-size:14px;text-align:center;">Unable to load<br>this character</div>`;
        }
    });
}

// Animate characters sequentially
async function animateCharacters() {
    if (writers.length === 0) {
        showNotification("Please enter Chinese characters first", "warning");
        return;
    }

    // Disable input during animation
    input.disabled = true;

    try {
        for (let writer of writers) {
            await new Promise((resolve) => {
                writer.animateCharacter({
                    onComplete: resolve
                });
            });
        }
        showNotification("Animation complete!", "success");
    } catch (error) {
        console.error("Animation error:", error);
        showNotification("Animation error occurred", "error");
    } finally {
        input.disabled = false;
    }
}

// Create SVG for download
function createSVG(text) {
    const charWidth = 150;
    const spaceWidth = 40; // Width for spaces
    const charHeight = 180;
    const padding = 20;

    // Calculate total width considering spaces
    let totalWidth = padding * 2;
    const chars = text.split("");
    chars.forEach(char => {
        totalWidth += (char === ' ') ? spaceWidth : charWidth;
    });

    const totalHeight = charHeight + padding * 2;

    // Generate SVG with proper spacing
    let xPosition = padding;
    const textElements = chars.map((char, i) => {
        if (char === ' ') {
            xPosition += spaceWidth;
            return '';
        }

        const element = `
            <text 
                x="${xPosition + charWidth / 2}" 
                y="${padding + charHeight / 2}"
                font-family="SimSun, STKaiti, KaiTi, serif"
                font-size="120"
                text-anchor="middle"
                dominant-baseline="central"
                fill="#1e293b">${char}</text>
        `;
        xPosition += charWidth;
        return element;
    }).join("");

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
        <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#f8fafc;stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgGradient)"/>
        ${textElements}
    </svg>`;
}

// Download SVG file
function downloadSvg() {
    const text = input.value.trim();

    if (!text) {
        showNotification("Please enter characters first", "warning");
        return;
    }

    try {
        const svg = createSVG(text);
        const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
        const filename = `${text}_characters.svg`;

        downloadFile(blob, filename);
        showNotification("SVG downloaded successfully!", "success");
    } catch (error) {
        console.error("SVG download error:", error);
        showNotification("Failed to download SVG", "error");
    }
}

// Download PNG file
function downloadPng() {
    const text = input.value.trim();

    if (!text) {
        showNotification("Please enter characters first", "warning");
        return;
    }

    try {
        const svg = createSVG(text);
        const img = new Image();
        const canvas = document.createElement("canvas");

        const charWidth = 150;
        const spaceWidth = 40;
        const charHeight = 180;
        const padding = 20;

        // Calculate canvas width
        let totalWidth = padding * 2;
        text.split("").forEach(char => {
            totalWidth += (char === ' ') ? spaceWidth : charWidth;
        });

        canvas.width = totalWidth;
        canvas.height = charHeight + padding * 2;

        const ctx = canvas.getContext("2d");

        img.onload = () => {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                const filename = `${text.replace(/\s+/g, '_')}_characters.png`;
                downloadFile(blob, filename);
                showNotification("PNG downloaded successfully!", "success");
            }, "image/png");
        };

        img.onerror = () => {
            showNotification("Failed to generate PNG", "error");
        };

        const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
        img.src = URL.createObjectURL(svgBlob);
    } catch (error) {
        console.error("PNG download error:", error);
        showNotification("Failed to download PNG", "error");
    }
}

// Generic download helper
function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Notification system
function showNotification(message, type = "info") {
    // Remove existing notifications
    const existing = document.querySelector(".notification");
    if (existing) {
        existing.remove();
    }

    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Styling
    Object.assign(notification.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        padding: "16px 24px",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: "600",
        color: "white",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
        zIndex: "10000",
        animation: "slideIn 0.3s ease",
        maxWidth: "300px"
    });

    // Color based on type
    const colors = {
        success: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        warning: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        error: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        info: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    };

    notification.style.background = colors[type] || colors.info;

    // Add animation styles if not exists
    if (!document.querySelector("#notification-styles")) {
        const style = document.createElement("style");
        style.id = "notification-styles";
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = "slideOut 0.3s ease";
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    console.log("Chinese Character Writer initialized");
});
