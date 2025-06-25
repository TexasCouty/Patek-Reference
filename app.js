document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("refInput").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      console.log("Enter pressed, triggering lookup");
      lookupReference();
    }
  });
});

async function lookupReference() {
  const ref = document.getElementById("refInput").value.trim();
  if (!ref) return;

  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "Loading...";

  try {
    const response = await fetch("/.netlify/functions/chatgpt-lookup", {
      method: "POST",
      body: JSON.stringify({ reference: ref })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    // Format image name
    const imageName = ref.replace(/[\//]/g, "-") + ".avif";
    const imagePath = `images/${imageName}`;

    const html = `
      <div>
        <img src="${imagePath}" alt="${ref}" style="max-width:300px; height:auto; margin-bottom: 20px;" onerror="console.warn('🖼️ Image not found:', this.src); this.style.display='none'">
        <p><strong>Reference:</strong> ${data.reference}</p>
        <p><strong>Retail Price:</strong> ${data.retail_price}</p>
        <p><strong>Collection:</strong> ${data.collection}</p>
        <p><strong>Dial:</strong> ${data.dial}</p>
        <p><strong>Dial Color:</strong> ${data.dial_color}</p>
        <p><strong>Case:</strong> ${data.case}</p>
        <p><strong>Bracelet:</strong> ${data.bracelet}</p>
        <p><strong>Movement:</strong> ${data.movement}</p>
      </div>
    `;

    resultDiv.innerHTML = html;
  } catch (err) {
    console.error("Lookup error:", err);
    resultDiv.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
  }
}

