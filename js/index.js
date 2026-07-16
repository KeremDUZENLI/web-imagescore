import { aiState, loadModel, scoreImage } from "./utils/ai.js";
import {
  updateStatus,
  renderGrid,
  initControls,
  toggleControls,
  bindDropzone,
  toggleDropzoneLock,
} from "./utils/ui.js";

// Export this so we can reuse it for in-memory recalculation
export async function processFiles(filesOrMemory) {
  updateStatus(
    `Status: Computing tensors for ${filesOrMemory.length} assets...`,
    "processing",
  );
  toggleControls(false);
  renderGrid([]);

  const computationPromises = Array.from(filesOrMemory).map((item) => {
    return new Promise((resolve) => {
      // If reading from memory, item already has the dataUrl
      if (item.url) {
        scoreImage(item.url)
          .then((score) => {
            resolve({ name: item.name, url: item.url, score: score });
          })
          .catch(() => resolve({ name: item.name, url: item.url, score: 0 }));
      } else {
        // If reading from fresh files via FileReader
        const reader = new FileReader();
        reader.onload = async (event) => {
          const imageDataUrl = event.target.result;
          try {
            const score = await scoreImage(imageDataUrl);
            resolve({ name: item.name, url: imageDataUrl, score: score });
          } catch (error) {
            resolve({ name: item.name, url: imageDataUrl, score: 0 });
          }
        };
        reader.readAsDataURL(item);
      }
    });
  });

  aiState.scoredAssets = await Promise.all(computationPromises);
  aiState.scoredAssets.sort((a, b) => b.score - a.score);

  aiState.scoredAssets.forEach((asset, index) => {
    asset.rank = index + 1;
  });

  toggleControls(true);
  renderGrid(aiState.scoredAssets);
  updateStatus("Status: Online. Processing complete.", "default");
}

window.addEventListener("DOMContentLoaded", async () => {
  bindDropzone(processFiles);
  initControls();

  const selectPersona = document.getElementById("select_persona");

  Array.from(selectPersona.options).forEach((option) => {
    const matrix = aiState.personas[option.value];
    if (matrix) {
      option.title =
        "TARGET VECTORS:\n• " +
        matrix[0] +
        "\n• " +
        matrix[1] +
        "\n• " +
        matrix[2] +
        "\n\nNEGATIVE VECTORS:\n• " +
        matrix[3];
    }
  });

  selectPersona.title =
    selectPersona.options[selectPersona.selectedIndex].title;

  selectPersona.addEventListener("change", (event) => {
    aiState.activePersona = event.target.value;

    selectPersona.title =
      selectPersona.options[selectPersona.selectedIndex].title;

    if (aiState.scoredAssets.length > 0) {
      processFiles(aiState.scoredAssets);
    }
  });

  toggleDropzoneLock(true);
  updateStatus(
    "Status: Caching Neural Network... (This happens once)",
    "processing",
  );

  try {
    await loadModel();
    updateStatus("Status: Online", "default");
    toggleDropzoneLock(false);
  } catch (error) {
    updateStatus("Status: Fatal Initialization Error.", "error");
    console.error(error);
  }
});
