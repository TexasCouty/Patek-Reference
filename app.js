function lookupReference() {
  const ref = document.getElementById("refInput").value.trim();
  if (!ref) return;

  fetch("/.netlify/functions/chatgpt-lookup", {
    method: "POST",
    body: JSON.stringify({ reference: ref })
  })
    .then(res => res.json())
    .then(data => {
      const result = document.getElementById("result");
      result.innerHTML = "";

      if (data.error) {
        result.textContent = "Reference not found.";
        return;
      }

      const refImg = data.reference.replace(/\//g, "-");

      result.innerHTML = `
        <p><strong>Reference:</strong> ${data.reference}</p>
        <p><strong>Retail Price:</strong> ${data.retail_price}</p>
        <p><strong>Collection:</strong> ${data.collection}</p>
        <p><strong>Dial:</strong> ${data.dial}</p>
        <p><strong>Case:</strong> ${data.case}</p>
        <p><strong>Bracelet:</strong> ${data.bracelet}</p>
        <p><strong>Movement:</strong> ${data.movement}</p>
        <img src="images/${refImg}.avif" alt="${data.reference}" style="max-width:300px; margin-top:10px;" onerror="console.log('🖼️ Image not found: ${refImg}.avif')">
      `;
    })
    .catch(err => {
      console.error("❌ Lookup error:", err);
      document.getElementById("result").textContent = "Lookup failed.";
    });
}
