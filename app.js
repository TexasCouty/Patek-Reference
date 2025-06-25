document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("refInput");

  // Trigger lookup when Enter is pressed
  input.addEventListener("keydown", function (e) {
    console.log("Key pressed:", e.key);
    if (e.key === "Enter") {
      console.log("Enter pressed, triggering lookup");
      lookupReference();
    }
  });
});

async function lookupReference() {
  const ref = document.getElementById("refInput").value.trim();
  if (!ref) return;

  console.log("Looking up reference:", ref);

  try {
    const response = await fetch("/.netlify/functions/chatgpt-lookup", {
      method: "POST",
      body: JSON.stringify({ reference: ref })
    });

    const data = await response.json();
    console.log("API Response:", data);

    if (data.error) {
      document.getElementById("result").innerHTML = `<p>Error: ${data.error}</p>`;
      return;
    }

    // Format image file name
    const refFormatted = data.reference.replace(/\//g, "-");
    const imagePath = `images/${refFormatted}.avif`;
    console.log("Image path:", imagePath);

    const html = `
      <p><strong>Reference:</strong> ${data.reference}</p>
      <p><strong>Retail Price:</strong> ${data.retail_price}</p>
      <p><strong>Collection:</strong> ${data.collection}</p>
      <p><strong>Dial:</strong> ${data.dial}</p>
      <p><strong>Case:</strong> ${data.case}</p>
      <p><strong>Bracelet:</strong> ${data.bracelet}</p>
      <p><strong>Movement:</strong> ${data.movement}</p>
      <img src="${imagePath}" alt="Watch Image" class="watch-image" onerror="this.style.display='none'; console.warn('🖼️ Image not found:', this.src);">
    `;

    document.getElementById("result").innerHTML = html;

  } catch (err) {
    console.error("Lookup failed:", err);
    document.getElementById("result").innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

// ✅ Expose function to HTML onclick
window.lookupReference = lookupReference;
