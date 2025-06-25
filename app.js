async function lookupReference() {
  const ref = document.getElementById('refInput').value.trim();
  const response = await fetch('patek_refs.json');
  const data = await response.json();

  const match = data.find(item => item.reference.toLowerCase() === ref.toLowerCase());
  const resultDiv = document.getElementById('result');

  if (match) {
    resultDiv.innerHTML = `
      <h2>Reference: ${match.reference}</h2>
      <p><strong>Retail Price:</strong> ${match.retail_price}</p>
      <p><strong>Dial:</strong> ${match.dial}</p>
      <p><strong>Case:</strong> ${match.case}</p>
      <p><strong>Bracelet:</strong> ${match.bracelet}</p>
      <p><strong>Movement:</strong> ${match.movement}</p>
    `;
  } else {
    resultDiv.innerHTML = `<p>Reference not found locally. Asking ChatGPT...</p>`;

    try {
      const chatResponse = await fetch('/.netlify/functions/chatgpt-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reference: ref })
      });

      if (!chatResponse.ok) {
        throw new Error(`Function returned ${chatResponse.status}`);
      }

      const data = await chatResponse.json();
      console.log("ChatGPT Fallback Response:", data);

      // Try to parse the answer as JSON
      let parsed;
      try {
        parsed = JSON.parse(data.answer);
      } catch (e) {
        console.error("Failed to parse JSON, showing raw:", data.answer);
        resultDiv.innerHTML = `<p>${data.answer}</p>`;
        return;
      }

      // Rebuild same HTML structure for consistent look
      resultDiv.innerHTML = `
        <h2>Reference: ${parsed["Reference Number"]}</h2>
        <p><strong>Retail Price:</strong> ${parsed["Retail Price"]}</p>
        <p><strong>Dial:</strong> ${parsed["Dial"]}</p>
        <p><strong>Case:</strong> ${parsed["Case"]}</p>
        <p><strong>Bracelet:</strong> ${parsed["Bracelet"]}</p>
        <p><strong>Movement:</strong> ${parsed["Movement"]}</p>
      `;

    } catch (err) {
      console.error("Error calling ChatGPT function:", err);
      resultDiv.innerHTML = `<p>Error: Could not get answer from ChatGPT</p>`;
    }
  }
}
