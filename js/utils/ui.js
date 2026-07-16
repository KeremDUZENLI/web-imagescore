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

export function toggleDropzoneLock(isLocked) {
  const dropzone = document.getElementById("container_dropzone");
  dropzone.style.pointerEvents = isLocked ? "none" : "auto";
  dropzone.style.opacity = isLocked ? "0.5" : "1";
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
    row.innerHTML = `
      <div>
        <input type="checkbox" class="result_checkbox" data-url="${asset.url}" data-name="${asset.name}" data-rank="${asset.rank}" />
      </div>
      <img src="${asset.url}" alt="${asset.name}">
      <div class="result_cell col_filename" title="${asset.name}">${asset.name}</div>
      <div class="result_cell col_rank">${asset.rank}</div>
      <div class="result_cell col_score">${(asset.score * 100).toFixed(1)}</div>
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
      const activeButtons = Array.from(
        document.querySelectorAll(".button_filter.active"),
      );

      if (activeButtons.length === 0) {
        renderGrid(aiState.scoredAssets);
      } else {
        const filtered = aiState.scoredAssets.filter((asset) => {
          return activeButtons.some((btn) => {
            const min = parseFloat(btn.dataset.min);
            const max = parseFloat(btn.dataset.max);
            return asset.score >= min && asset.score <= max;
          });
        });
        renderGrid(filtered);
      }
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
