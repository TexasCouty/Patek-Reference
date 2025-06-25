async function lookupReference() {
  const reference = document.getElementById('reference').value;
  if (!reference) return;

  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = `<p>Searching for reference <strong>${reference}</strong>...</p>`;

  try {
    const response = await fetch(`/.netlify/functions/chatgpt-lookup`, {
      method: 'POST',
      body: JSON.stringify({ reference }),
    });

    const data = await response.json();

    let imageHtml = '';
    const imageName = reference.replace(/\//g, '-');
    const imagePath = `images/${imageName}.avif`;
    const img = new Image();
    img.src = imagePath;
    img.onload = () => {
      resultDiv.innerHTML = `
        <p><strong>Reference:</strong> ${data.reference}</p>
        <p><strong>Retail Price:</strong> ${data.retail_price}</p>
        <p><strong>Collection:</strong> ${data.collection}</p>
        <p><strong>Dial:</strong> ${data.dial}</p>
        <p><strong>Dial Color:</strong> ${data.dial_color || 'N/A'}</p>
        <p><strong>Case:</strong> ${data.case}</p>
        <p><strong>Bracelet:</strong> ${data.bracelet}</p>
        <p><strong>Movement:</strong> ${data.movement}</p>
        <img src="${imagePath}" alt="Watch Image" style="max-width: 300px; margin-top: 20px;" />
      `;
    };
    img.onerror = () => {
      resultDiv.innerHTML = `
        <p><strong>Reference:</strong> ${data.reference}</p>
        <p><strong>Retail Price:</strong> ${data.retail_price}</p>
        <p><strong>Collection:</strong> ${data.collection}</p>
        <p><strong>Dial:</strong> ${data.dial}</p>
        <p><strong>Dial Color:</strong> ${data.dial_color || 'N/A'}</p>
        <p><strong>Case:</strong> ${data.case}</p>
        <p><strong>Bracelet:</strong> ${data.bracelet}</p>
        <p><strong>Movement:</strong> ${data.movement}</p>
      `;
    };
  } catch (error) {
    resultDiv.innerHTML = `<p>Error fetching data. Please try again later.</p>`;
    console.error(error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search').addEventListener('click', lookupReference);

  document.getElementById('reference').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      console.log('Enter pressed, triggering lookup');
      lookupReference();
    }
  });
});
