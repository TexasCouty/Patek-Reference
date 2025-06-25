document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('reference');
  const button = document.getElementById('search');
  const resultDiv = document.getElementById('result');

  const lookupReference = async () => {
    const reference = input.value.trim();
    if (!reference) return;

    resultDiv.innerHTML = 'Searching...';

    try {
      const response = await fetch('/.netlify/functions/chatgpt-lookup', {
        method: 'POST',
        body: JSON.stringify({ reference }),
      });

      const data = await response.json();

      let html = `<h3>Reference: ${data.reference}</h3>`;
      if (data.retail_price) html += `<p><strong>Retail Price:</strong> ${data.retail_price}</p>`;
      if (data.collection) html += `<p><strong>Collection:</strong> ${data.collection}</p>`;
      if (data.dial) html += `<p><strong>Dial:</strong> ${data.dial}</p>`;
      if (data.dial_color) html += `<p><strong>Dial Color:</strong> ${data.dial_color}</p>`;
      if (data.case) html += `<p><strong>Case:</strong> ${data.case}</p>`;
      if (data.bracelet) html += `<p><strong>Bracelet:</strong> ${data.bracelet}</p>`;
      if (data.movement) html += `<p><strong>Movement:</strong> ${data.movement}</p>`;

      const formattedRef = reference.replace(/[\/]/g, '-');
      html += `<img src="images/${formattedRef}.avif" alt="Watch Image" class="watch-image" onerror="this.style.display='none';" />`;

      resultDiv.innerHTML = html;
    } catch (error) {
      resultDiv.innerHTML = 'An error occurred while looking up the reference.';
      console.error(error);
    }
  };

  button.addEventListener('click', lookupReference);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      lookupReference();
    }
  });
});

