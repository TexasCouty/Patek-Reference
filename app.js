// ✅ Updated app.js (with admin panel logic)

async function lookupReference() {
  const ref = document.getElementById('refInput').value.trim();
  const resultDiv = document.getElementById('result');

  if (!ref) {
    resultDiv.innerHTML = "<p>Please enter a valid reference number.</p>";
    return;
  }

  try {
    const response = await fetch('/.netlify/functions/chatgpt-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: ref })
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const match = await response.json();
    console.log("Match object:", match);

    let formatted = "";
    if (match.reference) formatted += `<p><strong>Reference:</strong> ${match.reference}</p>`;
    if (match.retail_price) formatted += `<p><strong>Retail Price:</strong> ${match.retail_price}</p>`;
    if (match.collection) formatted += `<p><strong>Collection:</strong> ${match.collection}</p>`;
    if (match.dial) formatted += `<p><strong>Dial:</strong> ${match.dial}</p>`;
    if (match.case) formatted += `<p><strong>Case:</strong> ${match.case}</p>`;
    if (match.bracelet) formatted += `<p><strong>Bracelet:</strong> ${match.bracelet}</p>`;
    if (match.movement) formatted += `<p><strong>Movement:</strong> ${match.movement}</p>`;

    if (match.reference) {
      let safeRef = match.reference.replace(/\//g, "-");
      const imgPath = `/images/${safeRef}.avif`;

      console.log("🔍 Trying image path:", imgPath);

      formatted += `
        <img src="${imgPath}" alt="Watch Image"
             style="max-width:300px; margin-top:20px;"
             onerror="console.warn('🛑 Image not found:', '${imgPath}'); this.onerror=null; this.src='/images/placeholder.avif';" />
      `;
    }

    resultDiv.innerHTML = formatted;
  } catch (err) {
    console.error("Lookup failed:", err);
    resultDiv.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

function toggleAdmin() {
  const panel = document.getElementById('adminPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

async function submitAdminUpdate() {
  const ref = document.getElementById('adminRef').value.trim();
  const price = document.getElementById('adminPrice').value.trim();
  const imageFile = document.getElementById('adminImage').files[0];
  const msg = document.getElementById('adminMsg');

  if (!ref || !price) {
    msg.innerText = "Reference and price required.";
    return;
  }

  const formData = new FormData();
  formData.append('reference', ref);
  formData.append('retail_price', price);
  if (imageFile) formData.append('image', imageFile);

  try {
    const response = await fetch('/.netlify/functions/admin-update', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    msg.innerText = result.message || "Update complete.";
  } catch (err) {
    console.error("Admin update failed:", err);
    msg.innerText = "Error updating data.";
  }
}

