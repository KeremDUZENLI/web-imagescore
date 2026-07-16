import { aiState, loadModel, scoreImage } from "./utils/ai.js";
import {
  updateStatus,
  renderGrid,
  initControls,
  toggleControls,
  bindDropzone,
  toggleDropzoneLock,
} from "./utils/ui.js";

async function processFiles(files) {
  updateStatus(
    `Status: Computing tensors for ${files.length} assets...`,
    "processing",
  );
  toggleControls(false);

  renderGrid([]);

  const computationPromises = Array.from(files).map((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        const imageDataUrl = event.target.result;
        try {
          const score = await scoreImage(imageDataUrl);
          resolve({ name: file.name, url: imageDataUrl, score: score });
        } catch (error) {
          resolve({ name: file.name, url: imageDataUrl, score: 0 });
        }
      };

      reader.readAsDataURL(file);
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
