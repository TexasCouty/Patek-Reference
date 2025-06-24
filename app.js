async function lookupReference() {
  const ref = document.getElementById('refInput').value.trim();
  console.log(`🔍 Input reference: ${ref}`);

  const resultDiv = document.getElementById('result');

  // ✅ Always query the serverless function — Mongo handles it now
  try {
    const chatResponse = await fetch('/.netlify/functions/chatgpt-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference: ref })
    });

    if (!chatResponse.ok) {
      throw new Error(`Function returned ${chatResponse.status}`);
    }

    const data = await chatResponse.json();
    console.log("⚡ Mongo/GPT Response:", data);

    const safeRef = data["Reference Number"].replace(/\//g, "_");
    const imagePath = `/images/${safeRef}.avif`;

    console.log(`✅ Found: ${data["Reference Number"]}`);
    console.log(`🖼️ Local image path: ${imagePath}`);

    resultDiv.innerHTML = `
      <h2>Reference: ${data["Reference Number"]}</h2>
      <p><strong>Retail Price:</strong> ${data["Retail Price"]}</p>
      <p><strong>Collection:</strong> ${data["Collection"]}</p>
      <p><strong>Dial:</strong> ${data["Dial"]}</p>
      <p><strong>Case:</strong> ${data["Case"]}</p>
      <p><strong>Bracelet:</strong> ${data["Bracelet"]}</p>
      <p><strong>Movement:</strong> ${data["Movement"]}</p>
      <img src="${imagePath}" alt="Watch Image" style="max-width:300px;margin-top:15px;"
      onerror="console.log('❌ Image not found, using placeholder'); this.onerror=null; this.src='/images/placeholder.avif';">
    `;
  } catch (err) {
    console.error("❌ Lookup failed:", err);
    resultDiv.innerHTML = `<p>Error: Could not get answer from server</p>`;
  }
}

