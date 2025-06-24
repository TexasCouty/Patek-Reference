async function lookupReference() {
  const ref = document.getElementById('refInput').value.trim();
  const resultDiv = document.getElementById('result');

  console.log(`🔍 Lookup triggered for: ${ref}`);

  if (!ref) {
    resultDiv.innerHTML = `<p>Please enter a valid reference.</p>`;
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

    const data = await response.json();
    console.log("✅ Server response:", data);

    resultDiv.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;

  } catch (err) {
    console.error("❌ Lookup failed:", err);
    resultDiv.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}
