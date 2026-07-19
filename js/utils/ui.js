import { aiState } from "./ai.js";
import { executeDownload } from "./download.js";

export function updateStatus(message, mode = "default") {
  const statusElement = document.getElementById("container_status");
  statusElement.textContent = message;

  if (mode === "processing") {
    statusElement.style.color = "var(--color_link)";
  } else if (mode === "error") {
    statusElement.style.color = "red";
  } else {
    statusElement.style.color = "var(--color_text)";
  }
}

export function toggleControls(isVisible) {
  const controlsElement = document.getElementById("container_controls");
  controlsElement.style.display = isVisible ? "flex" : "none";
  if (isVisible) {
    document
      .querySelectorAll(".button_filter")
      .forEach((btn) => btn.classList.remove("active"));
  }
}

export function applyFilters() {
  const activeButtons = Array.from(
    document.querySelectorAll(".button_filter.active"),
  );
  if (activeButtons.length === 0) {
    renderGrid(aiState.assets);
  } else {
    const filtered = aiState.assets.filter((asset) => {
      if (asset.score === null) return false; // Hide pending assets if filtering by score
      return activeButtons.some((btn) => {
        const min = parseFloat(btn.dataset.min);
        const max = parseFloat(btn.dataset.max);
        return asset.score >= min && asset.score <= max;
      });
    });
    renderGrid(filtered);
  }
}

export function renderGrid(assetsToRender) {
  const containerResults = document.getElementById("container_results");
  const containerHeader = document.getElementById("container_results_header");
  const masterCheckbox = document.getElementById("checkbox_master");

  containerResults.innerHTML = "";
  masterCheckbox.checked = false;

  if (assetsToRender.length === 0) {
    containerHeader.style.display = "none";
    return;
  }

  containerHeader.style.display = "grid";

  assetsToRender.forEach((asset) => {
    const row = document.createElement("div");
    row.className = "result_row grid_layout";

    const dateObj = new Date(asset.date);
    const dateString = isNaN(dateObj) ? "-" : dateObj.toLocaleDateString();
    const scoreString =
      asset.score === null ? "..." : (asset.score * 100).toFixed(1);
    const rankString = asset.rank === null ? "-" : asset.rank;

    row.innerHTML = `
      <div>
        <input type="checkbox" class="result_checkbox" data-url="${asset.url}" data-name="${asset.name}" data-rank="${rankString}" />
      </div>
      <img src="${asset.url}" alt="${asset.name}">
      <div class="result_cell col_filename" title="${asset.name}">${asset.name}</div>
      <div class="result_cell" style="color: var(--color_muted); font-size: 12px;">${dateString}</div>
      <div class="result_cell col_rank">${rankString}</div>
      <div class="result_cell col_score">${scoreString}</div>
    `;
    containerResults.appendChild(row);
  });
}

export function bindDropzone(processCallback) {
  const dropzone = document.getElementById("container_dropzone");
  const fileInput = document.getElementById("input_file");

  dropzone.addEventListener("click", () => {
    fileInput.value = "";
    fileInput.click();
  });

  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("active");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("active");
  });

  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("active");
    if (event.dataTransfer.files.length > 0) {
      fileInput.files = event.dataTransfer.files;
      processCallback(fileInput.files);
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) processCallback(fileInput.files);
  });
}

export function initControls() {
  const slider = document.getElementById("slider_thumbnail");
  const filterButtons = document.querySelectorAll(".button_filter");
  const masterCheckbox = document.getElementById("checkbox_master");
  const btnDownload = document.getElementById("btn_download");

  slider.addEventListener("input", (event) => {
    document.documentElement.style.setProperty(
      "--thumbnail_size",
      `${event.target.value}px`,
    );
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      this.classList.toggle("active");
      applyFilters();
    });
  });

  masterCheckbox.addEventListener("change", (event) => {
    const isChecked = event.target.checked;
    document
      .querySelectorAll("#container_results .result_checkbox")
      .forEach((cb) => {
        cb.checked = isChecked;
      });
  });

  btnDownload.addEventListener("click", async () => {
    const selectedCheckboxes = document.querySelectorAll(
      "#container_results .result_checkbox:checked",
    );

    if (selectedCheckboxes.length === 0) {
      alert("No images selected for download.");
      return;
    }

    const assetsToDownload = Array.from(selectedCheckboxes).map((cb) => ({
      originalName: cb.dataset.name,
      rank: cb.dataset.rank,
      dataUrl: cb.dataset.url,
    }));

    btnDownload.textContent = "Zipping...";
    btnDownload.style.pointerEvents = "none";

    await executeDownload(assetsToDownload);

    btnDownload.textContent = "Download";
    btnDownload.style.pointerEvents = "auto";
  });
}

export function bindPersonaSelector(processCallback) {
  const selectPersona = document.getElementById("select_persona");

  Array.from(selectPersona.options).forEach((option) => {
    const matrix = aiState.personas[option.value];
    if (matrix && matrix.length > 1) {
      const targetList = matrix
        .slice(0, -1)
        .map((v) => `• ${v}`)
        .join("\n");
      const negativeList = `• ${matrix[matrix.length - 1]}`;
      option.title = `TARGET VECTORS:\n${targetList}\n\nNEGATIVE VECTORS:\n${negativeList}`;
    }
  });

  selectPersona.title =
    selectPersona.options[selectPersona.selectedIndex].title;

  selectPersona.addEventListener("change", (event) => {
    aiState.activePersona = event.target.value;
    selectPersona.title =
      selectPersona.options[selectPersona.selectedIndex].title;

    if (aiState.assets.length > 0) {
      aiState.assets.forEach((asset) => {
        asset.score = null;
        asset.rank = null;
      });

      processCallback(aiState.assets);
    }
  });
}

export function bindSorters(sortCallback) {
  document.querySelectorAll(".header_sortable").forEach((header) => {
    header.addEventListener("click", (e) => {
      sortCallback(e.target.dataset.key);
    });
  });
}

export function bindAIToggle(loadModelCallback, computeScoresCallback) {
  updateStatus("Status: AI Offline.", "default");
  let isModelLoaded = false;
  const checkboxEnableAi = document.getElementById("checkbox_header_option");

  checkboxEnableAi.addEventListener("change", async (event) => {
    if (event.target.checked) {
      if (!isModelLoaded) {
        checkboxEnableAi.disabled = true;
        updateStatus(
          "Status: Caching Neural Network... (This happens once)",
          "processing",
        );
        try {
          await loadModelCallback();
          isModelLoaded = true;
          updateStatus("Status: Online.", "default");
        } catch (error) {
          updateStatus("Status: Fatal Initialization Error.", "error");
          console.error(error);
          event.target.checked = false;
          return;
        } finally {
          checkboxEnableAi.disabled = false;
        }
      } else {
        updateStatus("Status: Online.", "default");
      }
      computeScoresCallback();
    } else {
      updateStatus("Status: Offline. AI Engine suspended.", "default");
    }
  });
}

export function updateSortHeaders(activeKey, order) {
  const baseLabels = {
    name: "Filename",
    date: "Date",
    rank: "Rank",
    score: "Score",
  };

  document.querySelectorAll(".header_sortable").forEach((header) => {
    const key = header.dataset.key;
    if (key === activeKey) {
      header.textContent = `${baseLabels[key]} ${order === "asc" ? "↑" : "↓"}`;
      header.style.color = "var(--color_link)";
    } else {
      header.textContent = baseLabels[key];
      header.style.color = "";
    }
  });
}
