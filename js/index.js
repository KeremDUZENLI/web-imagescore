import { aiState, loadModel, scoreImage } from "./utils/ai.js";
import {
  updateStatus,
  applyFilters,
  initControls,
  toggleControls,
  bindDropzone,
  bindPersonaSelector,
  bindAIToggle,
  bindSorters,
} from "./utils/ui.js";

let currentSort = { key: "date", order: "desc" };

function assignRanks() {
  const scored = aiState.assets
    .filter((a) => a.score !== null)
    .sort((a, b) => b.score - a.score);
  scored.forEach((asset, index) => {
    asset.rank = index + 1;
  });
}

export function sortAssets() {
  aiState.assets.sort((a, b) => {
    let valA = a[currentSort.key];
    let valB = b[currentSort.key];

    if (valA === null && valB === null) return 0;
    if (valA === null) return 1;
    if (valB === null) return -1;

    if (typeof valA === "string") {
      return currentSort.order === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    return currentSort.order === "asc" ? valA - valB : valB - valA;
  });

  applyFilters();
}

function handleSort(key) {
  if (currentSort.key === key) {
    currentSort.order = currentSort.order === "asc" ? "desc" : "asc";
  } else {
    currentSort.key = key;
    currentSort.order = key === "name" ? "asc" : "desc";
  }
  sortAssets();
}

export async function computeScores() {
  const checkboxEnableAi = document.getElementById("checkbox_header_option");
  if (!checkboxEnableAi.checked) return;

  updateStatus("Status: Computing tensors...", "processing");
  let scoredAny = false;

  while (true) {
    if (!checkboxEnableAi.checked) {
      updateStatus("Status: Offline. AI Engine suspended.", "default");
      return;
    }

    const pendingAsset = aiState.assets.find((a) => a.score === null);
    if (!pendingAsset) break;

    pendingAsset.score = await scoreImage(pendingAsset.url);
    assignRanks();
    sortAssets();
    scoredAny = true;
  }

  if (scoredAny)
    updateStatus("Status: Online. Processing complete.", "default");
}

export async function processFiles(filesOrMemory) {
  const newAssets = Array.from(filesOrMemory).map((item) => {
    if (item.url) return item;

    return {
      name: item.name,
      date: item.lastModified || Date.now(),
      url: URL.createObjectURL(item),
      score: null,
      rank: null,
    };
  });

  aiState.assets = newAssets;

  toggleControls(true);
  sortAssets();

  computeScores();
}

window.addEventListener("DOMContentLoaded", () => {
  bindDropzone(processFiles);
  initControls();
  bindPersonaSelector(processFiles);
  bindSorters(handleSort);
  bindAIToggle(loadModel, computeScores);
});
