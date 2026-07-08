const fallbackTemplates = [
  {
    id: "yellow",
    label: "צהוב",
    group: "single",
    background: "./assets/yellow-bg.png",
    titleColor: "#e67600",
    preferredCount: 1,
    dateColor: "#5a4500",
    captionColor: "#6d5200",
    imageFrame: "./assets/photo-frame.png"
  },
  {
    id: "blue",
    label: "תכלת",
    group: "single",
    background: "./assets/blue-bg.png",
    titleColor: "#0067b8",
    preferredCount: 1,
    dateColor: "#003f72",
    captionColor: "#004f8f",
    imageFrame: "./assets/photo-frame.png"
  },
  {
    id: "green",
    label: "ירוק",
    group: "multi",
    background: "./assets/green-bg.png",
    titleColor: "#2f6b1b",
    preferredCount: 4,
    dateColor: "#173f0e",
    captionColor: "#173f0e",
    imageFrame: "./assets/photo-frame.png"
  },
  {
    id: "pink",
    label: "ורוד",
    group: "multi",
    background: "./assets/pink-bg.png",
    titleColor: "#b0006d",
    preferredCount: 4,
    dateColor: "#6b1349",
    captionColor: "#6b1349",
    imageFrame: "./assets/photo-frame.png"
  }
];
let templates = [];

const templateSelect = document.getElementById("templateSelect");
const imageCountSelect = document.getElementById("imageCountSelect");
const layoutPicker = document.getElementById("layoutPicker");
const titleInput = document.getElementById("titleInput");
const printButton = document.getElementById("printButton");
const niqqudToggle = document.getElementById("niqqudToggle");
const autoNiqqudButton = document.getElementById("autoNiqqudButton");
const niqqudPanel = document.getElementById("niqqudPanel");
const pagesContainer = document.getElementById("pagesContainer");
const pagesBar = document.getElementById("pagesBar");
const addPageButton = document.getElementById("addPageButton");
const deletePageButton = document.getElementById("deletePageButton");
const printContainer = document.getElementById("printContainer");
const slotTemplate = document.getElementById("slotTemplate");

let activeTextInput = titleInput;
let currentLayoutStyle = "a";
let hebrewDateText = "";

// Multi-page state: one entry per child. A new page inherits (copies) the
// current page's images/captions, so shared class photos carry over and the
// teacher only replaces the per-child ones.
let pages = [{ slots: [] }];
let currentPage = 0;

function currentSlots() {
  return pages[currentPage].slots;
}

// Mini previews for the layout picker: [left%, top%, width%, height%] per slot
const LAYOUT_PREVIEWS = {
  1: { a: [[13, 6, 74, 70]] },
  2: {
    a: [[6, 4, 40, 72], [54, 4, 40, 72]],
    b: [[23, 2, 54, 42], [23, 52, 54, 42]]
  },
  3: {
    a: [[2, 6, 30, 62], [35, 6, 30, 62], [68, 6, 30, 62]],
    b: [[29, 2, 42, 44], [5, 52, 36, 36], [59, 52, 36, 36]]
  },
  4: {
    a: [[4, 8, 43, 36], [53, 8, 43, 36], [4, 54, 43, 36], [53, 54, 43, 36]],
    b: [[54, 5, 40, 18], [54, 29, 40, 18], [54, 53, 40, 18], [54, 77, 40, 18]]
  }
};

const NIQQUD_MARKS = ["ְ", "ֱ", "ֲ", "ֳ", "ִ", "ֵ", "ֶ", "ַ", "ָ", "ֹ", "ֻ", "ּ", "ׁ", "ׂ"];
const AUTO_NIQQUD_DICT = {
  "דף": "דַּף",
  "קשר": "קֶשֶׁר",
  "כיתוב": "כִּיתּוּב",
  "לתמונה": "לַתְּמוּנָה",
  "תמונה": "תְּמוּנָה",
  "או": "אוֹ"
};

function punctuateHebrewLetters(text) {
  if (!text) return "";
  if (text.length === 1) return `${text}׳`;
  return `${text.slice(0, -1)}״${text.slice(-1)}`;
}

function toHebrewNumberLetters(num, withPunctuation) {
  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
  const hundreds = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"];

  let n = Math.max(0, Number(num) || 0);
  let text = "";

  if (n >= 100) {
    const h = Math.floor(n / 100);
    text += hundreds[h];
    n = n % 100;
  }

  if (n === 15) text += "טו";
  else if (n === 16) text += "טז";
  else {
    if (n >= 10) {
      const t = Math.floor(n / 10);
      text += tens[t];
      n = n % 10;
    }
    text += ones[n];
  }

  return withPunctuation ? punctuateHebrewLetters(text) : text;
}

function buildHebrewDateString(date) {
  const parts = new Intl.DateTimeFormat("he-u-ca-hebrew", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).formatToParts(date);

  const dayNum = Number(parts.find((p) => p.type === "day")?.value || 1);
  const monthName = parts.find((p) => p.type === "month")?.value || "";
  const yearNum = Number(parts.find((p) => p.type === "year")?.value || 5786);

  const dayText = toHebrewNumberLetters(dayNum, false);
  const yearText = toHebrewNumberLetters(yearNum % 1000, true);
  return `${dayText} ${monthName} ${yearText}`;
}

function initNiqqudPanel() {
  niqqudPanel.innerHTML = "";
  NIQQUD_MARKS.forEach((mark) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = mark;
    btn.addEventListener("click", () => {
      if (!activeTextInput) return;
      const start = activeTextInput.selectionStart ?? activeTextInput.value.length;
      const end = activeTextInput.selectionEnd ?? activeTextInput.value.length;
      activeTextInput.value =
        activeTextInput.value.slice(0, start) + mark + activeTextInput.value.slice(end);
      activeTextInput.focus();
      activeTextInput.setSelectionRange(start + 1, start + 1);
      activeTextInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
    niqqudPanel.appendChild(btn);
  });
}

function fallbackNiqqudText(text) {
  return text
    .split(/(\s+|[.,!?":;()\-])/g)
    .map((token) => AUTO_NIQQUD_DICT[token] || token)
    .join("");
}

// Professional vocalization via the Dicta Nakdan engine (requires internet);
// falls back to the local dictionary when offline or on error.
// Note: the engine marks morphological prefixes with "|" inside the word
// (e.g. "לְ|כֻלָּם"), so pipes must be stripped, not used to split.
async function autoNiqqudText(text) {
  const trimmed = text.trim();
  if (!trimmed) return text;
  try {
    const response = await fetch("https://nakdan-2-0.loadbalancer.dicta.org.il/api", {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({ task: "nakdan", genre: "modern", data: text })
    });
    if (!response.ok) throw new Error(`Nakdan HTTP ${response.status}`);
    const tokens = await response.json();
    const result = tokens
      .map((token) => {
        const best = Array.isArray(token.options) && token.options.length ? token.options[0] : null;
        if (typeof best === "string" && best) return best.replace(/\|/g, "");
        return token.word || "";
      })
      .join("");
    return result || fallbackNiqqudText(text);
  } catch (err) {
    return fallbackNiqqudText(text);
  }
}

function fillTemplateOptions() {
  const count = Number(imageCountSelect.value || 1);
  const allowedGroup = count === 1 ? "single" : "multi";
  const previous = templateSelect.value;
  templateSelect.innerHTML = "";
  templates
    .filter((t) => (t.group || "multi") === allowedGroup)
    .forEach((t) => {
      const option = document.createElement("option");
      option.value = t.id;
      option.textContent = t.label;
      templateSelect.appendChild(option);
    });

  if (!templateSelect.options.length) {
    templates.forEach((t) => {
      const option = document.createElement("option");
      option.value = t.id;
      option.textContent = t.label;
      templateSelect.appendChild(option);
    });
  }

  const values = Array.from(templateSelect.options).map((o) => o.value);
  templateSelect.value = values.includes(previous) ? previous : values[0] || "";
}

function getCurrentTemplate() {
  return templates.find((t) => t.id === templateSelect.value) || templates[0];
}

function applyTemplate() {
  const t = getCurrentTemplate();
  if (t.preferredCount === 1) {
    imageCountSelect.value = "1";
  } else if (Number(imageCountSelect.value) < 2) {
    imageCountSelect.value = "2";
  }
  renderAllPages();
}

function renderLayoutPicker() {
  const count = Number(imageCountSelect.value);
  const previews = LAYOUT_PREVIEWS[count] || { a: [] };
  const styles = Object.keys(previews);
  if (!styles.includes(currentLayoutStyle)) {
    currentLayoutStyle = styles[0];
  }
  layoutPicker.innerHTML = "";
  styles.forEach((style) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "layout-choice" + (style === currentLayoutStyle ? " selected" : "");
    btn.title = "בחירת עימוד";
    previews[style].forEach(([left, top, w, h]) => {
      const box = document.createElement("span");
      box.className = "mini-slot";
      box.style.left = `${left}%`;
      box.style.top = `${top}%`;
      box.style.width = `${w}%`;
      box.style.height = `${h}%`;
      btn.appendChild(box);
    });
    btn.addEventListener("click", () => {
      currentLayoutStyle = style;
      renderAllPages();
    });
    layoutPicker.appendChild(btn);
  });
}

function renderPagesBar() {
  pagesBar.innerHTML = "";
  pages.forEach((page, i) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "page-chip" + (i === currentPage ? " selected" : "");
    chip.textContent = String(i + 1);
    chip.title = `מעבר לעמוד ${i + 1}`;
    chip.addEventListener("click", () => {
      currentPage = i;
      renderPagesBar();
      const target = pagesContainer.querySelector(`[data-page-index="${i}"]`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    pagesBar.appendChild(chip);
  });
}

// Slots marked as "group photos" — applied to every page (image + caption).
const sharedSlots = {};

function isSlotShared(slotIndex) {
  return Object.prototype.hasOwnProperty.call(sharedSlots, slotIndex);
}

function syncSharedSlotDom(slotIndex, data, skipCaptionEl = null) {
  pagesContainer.querySelectorAll(".a5-page").forEach((pageEl) => {
    const slotEl = pageEl.querySelectorAll(".image-slot")[slotIndex];
    if (!slotEl) return;

    const dropzone = slotEl.querySelector(".dropzone");
    const preview = slotEl.querySelector(".preview");
    const caption = slotEl.querySelector(".caption-input");

    if (data.image) {
      preview.src = data.image;
      dropzone.classList.add("has-image");
    } else {
      preview.removeAttribute("src");
      dropzone.classList.remove("has-image");
    }

    if (caption && caption !== skipCaptionEl) {
      caption.value = data.caption || "";
    }
  });
}

function updateSharedSlot(slotIndex, partial, skipCaptionEl = null) {
  if (!isSlotShared(slotIndex)) return false;

  const updated = {
    ...sharedSlots[slotIndex],
    ...partial
  };
  sharedSlots[slotIndex] = updated;

  pages.forEach((page) => {
    page.slots[slotIndex] = { ...updated };
  });

  syncSharedSlotDom(slotIndex, updated, skipCaptionEl);
  return true;
}

function applySlotToAllPages(slotIndex, sourcePageIndex) {
  const source = pages[sourcePageIndex].slots[slotIndex] || {};
  const data = {
    image: source.image || null,
    caption: source.caption || ""
  };

  sharedSlots[slotIndex] = { ...data };

  pages.forEach((page) => {
    page.slots[slotIndex] = { ...data };
  });

  renderAllPages();
}

function unshareSlot(slotIndex) {
  delete sharedSlots[slotIndex];
  renderAllPages();
}

function mergeSharedSlotsInto(slotsArray) {
  const count = Number(imageCountSelect.value);
  const merged = slotsArray.map((s) => ({ ...(s || {}) }));
  Object.keys(sharedSlots).forEach((key) => {
    const i = Number(key);
    if (i < count) {
      merged[i] = { ...sharedSlots[i] };
    }
  });
  return merged;
}

function bindDropzone(dropzone, fileInput, preview, pageIndex, slotIndex) {
  function setImage(file) {
    if (!file || !file.type.startsWith("image/")) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const image = e.target.result;
      if (isSlotShared(slotIndex)) {
        updateSharedSlot(slotIndex, { image });
      } else {
        const slots = pages[pageIndex].slots;
        slots[slotIndex] = { ...(slots[slotIndex] || {}), image };
        preview.src = image;
        dropzone.classList.add("has-image");
      }
    };
    reader.readAsDataURL(file);
  }

  fileInput.addEventListener("change", (e) => {
    setImage(e.target.files[0]);
  });

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    setImage(e.dataTransfer.files[0]);
  });
}

// Builds one editable A5 page bound to pages[pageIndex]
function buildEditablePage(pageIndex) {
  const t = getCurrentTemplate();
  const count = Number(imageCountSelect.value);
  const pageData = pages[pageIndex];

  const wrap = document.createElement("div");
  wrap.className = "page-wrap";
  wrap.addEventListener("click", () => {
    if (currentPage !== pageIndex) {
      currentPage = pageIndex;
      renderPagesBar();
    }
  });

  const label = document.createElement("div");
  label.className = "page-label";
  label.textContent = `עמוד ${pageIndex + 1}`;
  wrap.appendChild(label);

  const page = document.createElement("article");
  page.className = "a5-page";
  page.dataset.pageIndex = String(pageIndex);
  page.style.backgroundImage = `url("${t.background}")`;
  page.style.setProperty("--date-color", t.dateColor || "#222");
  page.style.setProperty("--caption-color", t.captionColor || "#222");
  page.style.setProperty("--frame-image", t.imageFrame ? `url("${t.imageFrame}")` : "none");

  const date = document.createElement("div");
  date.className = "hebrew-date";
  date.textContent = hebrewDateText;
  page.appendChild(date);

  const title = document.createElement("h2");
  title.className = "page-title";
  title.style.color = t.titleColor;
  title.textContent = titleInput.value || "דף קשר";
  page.appendChild(title);

  const grid = document.createElement("div");
  grid.className = `image-grid layout-${count}-${currentLayoutStyle}`;

  for (let i = 0; i < count; i += 1) {
    const clone = slotTemplate.content.cloneNode(true);
    const slot = clone.querySelector(".image-slot");
    const dropzone = clone.querySelector(".dropzone");
    const fileInput = clone.querySelector(".file-input");
    const preview = clone.querySelector(".preview");
    const caption = clone.querySelector(".caption-input");
    const applyBtn = clone.querySelector(".apply-all-btn");

    dropzone.classList.add("has-frame");
    caption.placeholder = `כיתוב לתמונה ${i + 1}`;
    caption.lang = "he";
    caption.addEventListener("input", () => {
      if (isSlotShared(i)) {
        updateSharedSlot(i, { caption: caption.value }, caption);
      } else {
        const slots = pages[pageIndex].slots;
        slots[i] = { ...(slots[i] || {}), caption: caption.value };
      }
    });

    applyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isSlotShared(i)) {
        unshareSlot(i);
        return;
      }
      const slots = pages[pageIndex].slots;
      slots[i] = {
        ...(slots[i] || {}),
        image: preview.src && dropzone.classList.contains("has-image") ? preview.src : null,
        caption: caption.value
      };
      applySlotToAllPages(i, pageIndex);
    });

    if (sharedSlots[i]) {
      slot.classList.add("is-shared-slot");
      applyBtn.classList.add("is-active");
      applyBtn.textContent = "ביטול החלה על כל העמודים";
    }

    const saved = pageData.slots[i] || sharedSlots[i];
    if (saved && saved.image) {
      preview.src = saved.image;
      dropzone.classList.add("has-image");
    }
    if (saved && saved.caption) {
      caption.value = saved.caption;
    }

    bindDropzone(dropzone, fileInput, preview, pageIndex, i);
    grid.appendChild(clone);
  }

  page.appendChild(grid);
  wrap.appendChild(page);
  return wrap;
}

// Renders ALL pages stacked in the workspace so the teacher can scroll
// through every child's page and edit any of them directly.
function renderAllPages() {
  renderLayoutPicker();
  renderPagesBar();
  pagesContainer.innerHTML = "";
  pages.forEach((_, i) => {
    pagesContainer.appendChild(buildEditablePage(i));
  });
}

/* ===== Multi-page printing: all pages, 2 x A5 per A4 sheet ===== */

function buildStaticPage(pageData) {
  const t = getCurrentTemplate();
  const count = Number(imageCountSelect.value);

  const page = document.createElement("article");
  page.className = "a5-page";
  page.style.backgroundImage = `url("${t.background}")`;
  page.style.setProperty("--date-color", t.dateColor || "#222");
  page.style.setProperty("--caption-color", t.captionColor || "#222");
  page.style.setProperty("--frame-image", t.imageFrame ? `url("${t.imageFrame}")` : "none");

  const date = document.createElement("div");
  date.className = "hebrew-date";
  date.textContent = hebrewDateText;
  page.appendChild(date);

  const title = document.createElement("h2");
  title.className = "page-title";
  title.style.color = t.titleColor;
  title.textContent = titleInput.value || "דף קשר";
  page.appendChild(title);

  const grid = document.createElement("div");
  grid.className = `image-grid layout-${count}-${currentLayoutStyle}`;

  for (let i = 0; i < count; i += 1) {
    const slot = document.createElement("div");
    slot.className = "image-slot";

    const zone = document.createElement("div");
    zone.className = "dropzone has-frame";
    const data = pageData.slots[i] || {};
    if (data.image) {
      const img = document.createElement("img");
      img.className = "preview";
      img.src = data.image;
      img.style.display = "block";
      zone.classList.add("has-image");
      zone.appendChild(img);
    }
    slot.appendChild(zone);

    const cap = document.createElement("div");
    cap.className = "caption-input";
    cap.textContent = data.caption || "";
    slot.appendChild(cap);

    grid.appendChild(slot);
  }

  page.appendChild(grid);
  return page;
}

function buildPrintSheets() {
  printContainer.innerHTML = "";
  for (let i = 0; i < pages.length; i += 2) {
    const sheet = document.createElement("section");
    sheet.className = "print-sheet";
    sheet.appendChild(buildStaticPage(pages[i]));
    if (pages[i + 1]) {
      sheet.appendChild(buildStaticPage(pages[i + 1]));
    }
    printContainer.appendChild(sheet);
  }
}

/* ===== Events ===== */

titleInput.addEventListener("input", () => {
  const text = titleInput.value || "דף קשר";
  pagesContainer.querySelectorAll(".page-title").forEach((el) => {
    el.textContent = text;
  });
});

document.addEventListener("focusin", (event) => {
  if (event.target instanceof HTMLInputElement && event.target.type === "text") {
    activeTextInput = event.target;
  }
});

templateSelect.addEventListener("change", applyTemplate);

imageCountSelect.addEventListener("change", () => {
  fillTemplateOptions();
  applyTemplate();
});

addPageButton.addEventListener("click", () => {
  const copy = mergeSharedSlotsInto(currentSlots().map((s) => ({ ...(s || {}) })));
  pages.push({ slots: copy });
  currentPage = pages.length - 1;
  renderAllPages();
  const target = pagesContainer.querySelector(`[data-page-index="${currentPage}"]`);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

deletePageButton.addEventListener("click", () => {
  if (pages.length <= 1) return;
  pages.splice(currentPage, 1);
  currentPage = Math.min(currentPage, pages.length - 1);
  renderAllPages();
});

printButton.addEventListener("click", () => {
  buildPrintSheets();
  window.print();
});

niqqudToggle.addEventListener("click", () => {
  niqqudPanel.classList.toggle("open");
});

autoNiqqudButton.addEventListener("click", async () => {
  if (!activeTextInput) return;
  const input = activeTextInput;
  autoNiqqudButton.disabled = true;
  autoNiqqudButton.textContent = "מנקד...";
  try {
    input.value = await autoNiqqudText(input.value);
  } finally {
    autoNiqqudButton.disabled = false;
    autoNiqqudButton.textContent = "ניקוד אוטומטי (בטא)";
  }
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.focus();
});

const helpToggle = document.getElementById("helpToggle");
const helpPanel = document.getElementById("helpPanel");
const helpClose = document.getElementById("helpClose");

helpToggle.addEventListener("click", () => {
  helpPanel.hidden = !helpPanel.hidden;
});

helpClose.addEventListener("click", () => {
  helpPanel.hidden = true;
});

async function boot() {
  try {
    const response = await fetch("./templates.json");
    const data = await response.json();
    templates = Array.isArray(data.templates) ? data.templates : fallbackTemplates;
  } catch (err) {
    templates = fallbackTemplates;
  }

  hebrewDateText = buildHebrewDateString(new Date());
  fillTemplateOptions();
  initNiqqudPanel();
  renderAllPages();
}

boot();
