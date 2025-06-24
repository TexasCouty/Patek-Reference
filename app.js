} else {
  resultDiv.innerHTML = `<p>Reference not found locally. Asking ChatGPT...</p>`;

  try {
    const chatResponse = await fetch('/.netlify/functions/chatgpt-lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reference: ref })
    });

    if (!chatResponse.ok) {
      throw new Error(`Function returned ${chatResponse.status}`);
    }

    const data = await chatResponse.json();
    console.log("ChatGPT Fallback Response:", data); // ✅ verify

    resultDiv.innerHTML = `<pre>${data.answer}</pre>`;
  } catch (err) {
    console.error("Error calling ChatGPT function:", err);
    resultDiv.innerHTML = `<p>Error: Could not get answer from ChatGPT</p>`;
  }
}
