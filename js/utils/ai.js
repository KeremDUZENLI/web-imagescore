import {
  pipeline,
  env,
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0";

env.allowLocalModels = false;
let classifier = null;

export const aiState = {
  scoredAssets: [],
  activePersona: "calculated_explorer",
  personas: {
    calculated_explorer: [
      "a solitary figure navigating complex urban density or stark natural terrain",
      "high quality cinematic documentation of transnational global mobility",
      "geometric precision within historical or modern structural landmarks",
      "standard group tourist photos, blurry compositions, or unstructured travel",
    ],
    spatial_architect: [
      "a professional executing complex virtual reality hardware configurations",
      "high contrast architectural environments and structural spatial mapping",
      "backend terminal interfaces, Python environments, or 3D modeling workspaces",
      "casual social gatherings, low-resolution snapshots, or irrelevant noise",
    ],
    kinetic_operator: [
      "calculated physical discipline within a highly structured weightlifting environment",
      "endurance execution on a bicycle across harsh natural terrain",
      "high protein nutritional structure and biometric optimization",
      "sedentary lifestyle, crowded tourist locations, or low-energy environments",
    ],
    minimalist_creator: [
      "clean architectural geometry and minimalist professional aesthetic",
      "high contrast, moody cinematic art portrait",
      "elegant spatial depth with dramatic lighting",
      "cluttered, overexposed, or noisy everyday snapshot",
    ],
    dynamic_athlete: [
      "dynamic lifestyle photography demonstrating peak physical fitness",
      "high quality documentation of athletic performance or sports",
      "vibrant energy and high quality human performance",
      "sedentary, low-energy, or irrelevant social group photo",
    ],
  },
};

export async function loadModel() {
  classifier = await pipeline(
    "zero-shot-image-classification",
    "Xenova/clip-vit-base-patch32",
  );
}

export async function scoreImage(imageDataUrl) {
  const targetVectors = aiState.personas[aiState.activePersona];
  const output = await classifier(imageDataUrl, targetVectors);

  let structuralScore = 0;
  output.forEach((result) => {
    if (result.label !== targetVectors[3]) {
      structuralScore += result.score;
    }
  });

  return structuralScore;
}
