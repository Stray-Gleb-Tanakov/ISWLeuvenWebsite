const bootLines = [
  "booting ISW Leuven system...",
  "loading student association modules...",
  "establishing connections...",
  "system failed. Displaying temporary variant:",
  "Informatics Student Working"
];

const bootEl = document.getElementById("boot");
let line = 0;
let char = 0;

function typeBoot() {
  if (line >= bootLines.length) return;

  if (char === 0) {
    const div = document.createElement("div");
    div.className = "prompt";
    bootEl.appendChild(div);
  }

  const currentLine = bootEl.lastChild;
  currentLine.textContent =
    "> " + bootLines[line].slice(0, char + 1);

  char++;

  if (char === bootLines[line].length) {
    char = 0;
    line++;
    setTimeout(typeBoot, 400);
  } else {
    setTimeout(typeBoot, 35);
  }
}

typeBoot();

/* fake tabs */
const buttons = document.querySelectorAll("button[data-tab]");
const output = document.getElementById("tab-output");
const outputText = document.getElementById("tab-text");

const messages = {
  examenwiki: "ERROR: Examenwiki is currently in restoration progress.\n\nPlease try again later (like, much later).",
  events: "NOTICE: Future events are still in planning.\n\n We apologize for the inconvenience.",
  resources: "ALERT: Resources are temporarily unavailable due to server maintenance.\n\nCheck back soon!"
};

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    output.classList.remove("hidden");
    outputText.textContent = messages[btn.dataset.tab];
  });
});