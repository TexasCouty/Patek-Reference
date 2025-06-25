function displayResult(data) {
  const resultDiv = document.getElementById("result");
  console.log("🧹 Clearing result div...");
  resultDiv.innerHTML = "";

  const ref = data.reference;
  const normalizedRef = ref.replace(/\//g, "-");
  const imagePath = `images/${normalizedRef}.avif`;

  console.log("📝 Building HTML content...");
  const content = `
    <p><strong>Reference:</strong> ${ref}</p>
    <p><strong>Retail Price:</strong> ${data.retail_price}</p>
    <p><strong>Collection:</strong> ${data.collection}</p>
    <p><strong>Dial:</strong> ${data.dial}</p>
    <p><strong>Case:</strong> ${data.case}</p>
    <p><strong>Bracelet:</strong> ${data.bracelet}</p>
    <p><strong>Movement:</strong> ${data.movement}</p>
  `;

  resultDiv.insertAdjacentHTML("beforeend", content);
  console.log("✅ Inserted text content");

  const image = document.createElement("img");
  image.src = imagePath;
  image.alt = `Watch image for ${ref}`;
  image.className = "watch-image";

  image.onload = () => {
    console.log(`🖼️ Image loaded successfully: ${image.src}`);
  };

  image.onerror = () => {
    console.warn(`⚠️ Image not found: ${image.src}`);
    image.style.display = "none";
  };

  resultDiv.appendChild(image);
  console.log("✅ Appended image to result div");
}
