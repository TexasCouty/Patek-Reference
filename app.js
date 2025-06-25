async function lookupReference() {
  const refInput = document.getElementById("refInput");
  const reference = refInput.value.trim();
  if (!reference) return;

  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "<p>Loading...</p>";

  try {
    const response = await fetch("/.netlify/functions/chatgpt-lookup", {
      method: "POST",
      body: JSON.stringify({ reference }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    displayResult(data);
  } catch (err) {
    resultDiv.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
    console.error("Lookup error:", err);
  }
}

function displayResult(data) {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "";

  const ref = data.reference;
  const normalizedRef = ref.replace(/\//g, "-");
  const imagePath = `images/${normalizedRef}.avif`;

  const image = document.createElement("img");
  image.src = imagePath;
  image.alt = `Watch image for ${ref}`;
  image.className = "watch-image";
  image.onerror = () => {
    console.warn(`🖼️ Image not found: ${imagePath}`);
    image.style.display = "none";
  };

  const content = `
    <p><strong>Reference:</strong> ${ref}</p>
    <p><strong>Retail Price:</strong> ${data.retail_price}</p>
    <p><strong>Collection:</strong> ${data.collection}</p>
    <p><strong>Dial:</strong> ${data.dial}</p>
    <p><strong>Case:</strong> ${data.case}</p>
    <p><strong>Bracelet:</strong> ${data.bracelet}</p>
    <p><strong>Movement:</strong> ${data.movement}</p>
  `;

  resultDiv.appendChild(image);
  resultDiv.insertAdjacentHTML("beforeend", content);
}

// 🔑 NEW: Trigger search when Enter is pressed
document.getElementById("refInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    lookupReference();
  }
});
