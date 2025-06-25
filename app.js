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

    let formatted = "";
    for (const [key, value] of Object.entries(match)) {
      formatted += `<div><strong>${key}:</strong> ${value}</div>`;
    }
    resultDiv.innerHTML = `<div class="json-output">${formatted}</div>`;
  } catch (err) {
    console.error("Lookup failed:", err);
    resultDiv.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}
