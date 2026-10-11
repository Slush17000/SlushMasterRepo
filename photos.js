(() => {
  const SPACES_BASE = "https://slush-tech-images.nyc3.digitaloceanspaces.com";
  const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif)$/i;

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }
    return result;
  }

  // Lists every image under a Space folder (S3 ListObjectsV2, paginated) and returns shuffled URLs.
  async function listSpacesImages(prefix) {
    const urls = [];
    let continuationToken = null;

    do {
      const params = new URLSearchParams({ "list-type": "2", prefix });
      if (continuationToken) {
        params.set("continuation-token", continuationToken);
      }

      const response = await fetch(`${SPACES_BASE}/?${params}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Spaces listing failed: ${response.status}`);
      }

      const xml = new DOMParser().parseFromString(await response.text(), "application/xml");
      xml.querySelectorAll("Contents > Key").forEach((node) => {
        const key = node.textContent;
        if (IMAGE_EXTENSIONS.test(key)) {
          urls.push(`${SPACES_BASE}/${key.split("/").map(encodeURIComponent).join("/")}`);
        }
      });

      const truncated = xml.querySelector("IsTruncated")?.textContent === "true";
      continuationToken = truncated ? xml.querySelector("NextContinuationToken")?.textContent : null;
    } while (continuationToken);

    return shuffle(urls);
  }

  window.listSpacesImages = listSpacesImages;
  window.carouselPhotosReady = listSpacesImages("Main and Gallery/").catch((error) => {
    console.error(error);
    return [];
  });
})();
