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
      // Convert reference to safe image file name:
      // "5160/500R-001" → "5160-500-001"
      let safeRef = match.reference.replace(/\//g, "-"); // Replace slash with dash
      safeRef = safeRef.replace(/[A-Z]-/, "-");          // Replace R-, G-, etc. with just -

      const imgPath = `/images/${safeRef}.avif`;

      formatted += `
        <img src="${imgPath}" alt="Watch Image"
             style="max-width:300px; margin-top:20px;"
             onerror="console.warn('Image not found:', '${imgPath}'); this.onerror=null; this.src='/images/placeholder.avif';" />
      `;
    }

    resultDiv.innerHTML = formatted;
  } catch (err) {
    console.error("Lookup failed:", err);
    resultDiv.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}

