import {
  pipeline,
  env,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0";

env.allowLocalModels = false;

let classifier = null;

export const aiState = {
  scoredAssets: [],
  targetVectors: [
    "a calculated explorer in a professional environment",
    "architectural geometry and spatial depth",
    "high quality documentation of global mobility",
    "a standard, low quality, blurry, or irrelevant photo",
  ],
};

export async function loadModel() {
  classifier = await pipeline(
    "zero-shot-image-classification",
    "Xenova/clip-vit-base-patch32",
  );
}

export async function scoreImage(imageDataUrl) {
  const output = await classifier(imageDataUrl, aiState.targetVectors);
  let structuralScore = 0;

  output.forEach((result) => {
    if (result.label !== aiState.targetVectors[3]) {
      structuralScore += result.score;
    }
  });

  return structuralScore;
}
