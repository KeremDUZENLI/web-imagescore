import JSZip from "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm";

export async function executeDownload(assetsToDownload) {
  const zip = new JSZip();

  assetsToDownload.forEach((asset) => {
    const extension = asset.originalName.substring(
      asset.originalName.lastIndexOf("."),
    );
    const newFilename = `${asset.rank}${extension}`;
    const base64Data = asset.dataUrl.split(",")[1];

    zip.file(newFilename, base64Data, { base64: true });
  });

  const content = await zip.generateAsync({ type: "blob" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(content);
  link.download = "ranked_images.zip";
  link.click();

  URL.revokeObjectURL(link.href);
}
