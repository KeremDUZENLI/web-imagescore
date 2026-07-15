import {
  pipeline,
  env,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0";

env.allowLocalModels = false;
let classifier = null;
const targetVectors = [
  "a calculated explorer in a professional environment",
  "architectural geometry and spatial depth",
  "high quality documentation of global mobility",
  "a standard, low quality, blurry, or irrelevant photo",
];

async function initNeuralNetwork() {
  const statusElement = document.getElementById("container_status");
  const dropzone = document.getElementById("container_dropzone");

  try {
    // 1. Lock the UI during the download phase
    dropzone.style.pointerEvents = "none";
    dropzone.style.opacity = "0.5";
    statusElement.textContent =
      "Status: Caching Neural Network... (This happens once)";

    // 2. Download and initialize the CLIP model via WebAssembly
    classifier = await pipeline(
      "zero-shot-image-classification",
      "Xenova/clip-vit-base-patch32",
    );

    // 3. Unlock the UI once execution is ready
    statusElement.textContent = "Status: Online";
    statusElement.style.color = "var(--color_text)";
    dropzone.style.pointerEvents = "auto";
    dropzone.style.opacity = "1";
  } catch (error) {
    statusElement.textContent = "Status: Fatal Initialization Error.";
    console.error(error);
  }
}

function initDropzone() {
  const dropzone = document.getElementById("container_dropzone");
  const fileInput = document.getElementById("input_file");

  dropzone.addEventListener("click", () => fileInput.click());

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
      renderImagePreviews(fileInput.files);
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      renderImagePreviews(fileInput.files);
    }
  });
}

// UPDATED: Synchronizes computations, sorts the dataset, and renders the ranked UI
async function renderImagePreviews(files) {
  const containerResults = document.getElementById("container_results");
  const statusElement = document.getElementById("container_status");

  containerResults.innerHTML = ""; // Clear previous results

  // Update status to indicate processing has begun
  statusElement.textContent = `Status: Computing tensors for ${files.length} assets...`;
  statusElement.style.color = "var(--color_link)";

  // 1. Create a computation array (Promise) for each file
  const computationPromises = Array.from(files).map((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        const imageDataUrl = event.target.result;

        try {
          // Execute neural network
          const output = await classifier(imageDataUrl, targetVectors);
          let structuralScore = 0;

          output.forEach((result) => {
            if (result.label !== targetVectors[3]) {
              // Ignore noise sink
              structuralScore += result.score;
            }
          });

          // Resolve the Promise with a clean data object
          resolve({
            name: file.name,
            url: imageDataUrl,
            score: structuralScore,
          });
        } catch (error) {
          console.error(`Failure processing ${file.name}:`, error);
          resolve({ name: file.name, url: imageDataUrl, score: 0 }); // Fallback
        }
      };

      reader.readAsDataURL(file);
    });
  });

  // 2. Await the completion of ALL image calculations
  const scoredAssets = await Promise.all(computationPromises);

  // 3. Sort the array in descending order (highest score first)
  scoredAssets.sort((a, b) => b.score - a.score);

  // 4. Render the sorted Presentation Layer
  scoredAssets.forEach((asset, index) => {
    const row = document.createElement("div");
    row.className = "result_row";

    row.innerHTML = `
      <img src="${asset.url}" alt="${asset.name}">
      <div class="result_info">
        <span class="result_name">#${index + 1} | ${asset.name}</span>
        <span class="result_score">Structural Match: ${(asset.score * 100).toFixed(2)}%</span>
      </div>
    `;

    containerResults.appendChild(row);
  });

  // Revert status to default
  statusElement.textContent = "Status: Online. Processing complete.";
  statusElement.style.color = "var(--color_text)";
}

// Bootstrap the application
window.addEventListener("DOMContentLoaded", () => {
  initDropzone();
  initNeuralNetwork();
});
