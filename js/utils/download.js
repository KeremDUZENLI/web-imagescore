import JSZip from "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm";

export async function executeDownload(assetsToDownload) {
  const zip = new JSZip();

  const packagePromises = assetsToDownload.map(async (asset) => {
    const extension = asset.originalName.substring(
      asset.originalName.lastIndexOf("."),
    );
    const newFilename = `${asset.rank}${extension}`;

    const response = await fetch(asset.dataUrl);
    const blobData = await response.blob();

    zip.file(newFilename, blobData);
  });

  await Promise.all(packagePromises);

  const content = await zip.generateAsync({ type: "blob" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(content);
  link.download = "ranked_images.zip";
  link.click();

  URL.revokeObjectURL(link.href);
}
