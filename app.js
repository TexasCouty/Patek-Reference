async function lookupReference() {
  const ref = document.getElementById('refInput').value.trim();
  const response = await fetch('patek_refs.json');
  const data = await response.json();

  const match = data.find(item => item.reference.toLowerCase() === ref.toLowerCase());
  const resultDiv = document.getElementById('result');

  if (match) {
    const safeRef = match.reference.replace(/\//g, "_");
    const localImage = `/images/${safeRef}.avif`;

    resultDiv.innerHTML = `
      <h2>Reference: ${match.reference}</h2>
      <p><strong>Retail Price:</strong> ${match.retail_price}</p>
      <p><strong>Collection:</strong> ${match.collection}</p>
      <p><strong>Dial:</strong> ${match.dial}</p>
      <p><strong>Case:</strong> ${match.case}</p>
      <p><strong>Bracelet:</strong> ${match.bracelet}</p>
      <p><strong>Movement:</strong> ${match.movement}</p>
      <img src="${localImage}" alt="Watch Image" style="max-width:300px;margin-top:15px;" 
      onerror="this.onerror=null;this.src='/images/placeholder.avif';">
    `;
  } else {
    resultDiv.innerHTML = `<p>Reference not found locally. Asking ChatGPT...</p>`;

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
      console.log("ChatGPT Fallback Response:", data);

      let parsed;
      try {
        parsed = JSON.parse(data.answer);
      } catch (e) {
        console.error("Parse failed:", e);
        resultDiv.innerHTML = `<p>${data.answer}</p>`;
        return;
      }

      // ✅ CORRECT: build local-safe image name from the GPT answer!
      const fallbackSafeRef = parsed["Reference Number"].replace(/\//g, "_");
      const fallbackImage = `/images/${fallbackSafeRef}.avif`;

      resultDiv.innerHTML = `
        <h2>Reference: ${parsed["Reference Number"]}</h2>
        <p><strong>Retail Price:</strong> ${parsed["Retail Price"]}</p>
        <p><strong>Collection:</strong> ${parsed["Collection"]}</p>
        <p><strong>Dial:</strong> ${parsed["Dial"]}</p>
        <p><strong>Case:</strong> ${parsed["Case"]}</p>
        <p><strong>Bracelet:</strong> ${parsed["Bracelet"]}</p>
        <p><strong>Movement:</strong> ${parsed["Movement"]}</p>
        <img src="${fallbackImage}" alt="Watch Image" style="max-width:300px;margin-top:15px;" 
        onerror="this.onerror=null;this.src='/images/placeholder.avif';">
      `;
    } catch (err) {
      console.error("ChatGPT call failed:", err);
      resultDiv.innerHTML = `<p>Error: Could not get answer from ChatGPT</p>`;
    }
  }
}

