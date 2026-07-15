import {
  pipeline,
  env,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0";

// Disable local paths to ensure compatibility when deployed to GitHub Pages
env.allowLocalModels = false;

// Global variable to store the initialized model
let classifier = null;

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
      console.log(`[System Log] ${fileInput.files.length} images queued.`);
    }
  });

  fileInput.addEventListener("change", () => {
    console.log(`[System Log] ${fileInput.files.length} images queued.`);
  });
}

// Bootstrap the application by initializing both the UI and the Network
window.addEventListener("DOMContentLoaded", () => {
  initDropzone();
  initNeuralNetwork();
});
