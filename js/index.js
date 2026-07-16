import { aiState, loadModel, scoreImage } from "./utils/ai.js";
import {
  updateStatus,
  renderGrid,
  initControls,
  toggleControls,
  bindDropzone,
  toggleDropzoneLock,
  bindPersonaSelector,
} from "./utils/ui.js";

export async function processFiles(filesOrMemory) {
  updateStatus(
    `Status: Computing tensors for ${filesOrMemory.length} assets...`,
    "processing",
  );
  toggleControls(false);
  renderGrid([]);

  const computationPromises = Array.from(filesOrMemory).map((item) => {
    return new Promise((resolve) => {
      if (item.url) {
        scoreImage(item.url)
          .then((score) => {
            resolve({ name: item.name, url: item.url, score: score });
          })
          .catch(() => resolve({ name: item.name, url: item.url, score: 0 }));
      } else {
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
  bindPersonaSelector(processFiles);

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
