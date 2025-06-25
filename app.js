function lookupReference() {
  const ref = document.getElementById("refInput").value.trim();
  if (!ref) return;

  fetch("/.netlify/functions/chatgpt-lookup", {
    method: "POST",
    body: JSON.stringify({ reference: ref })
  })
    .then(res => res.json())
    .then(data => {
      const result = document.getElementById("result");
      result.innerHTML = "";

      if (data.error) {
        result.textContent = "Reference not found.";
        return;
      }

      const formatted = `
        <p><strong>Reference:</strong> ${data.reference}</p>
        <p><strong>Retail Price:</strong> ${data.retail_price}</p>
        <p><strong>Collection:</strong> ${data.collection}</p>
        <p><strong>Dial:</strong> ${data.dial}</p>
        <p><strong>Case:</strong> ${data.case}</p>
        <p><strong>Bracelet:</strong> ${data.bracelet}</p>
        <p><strong>Movement:</strong> ${data.movement}</p>
      `;

      const refImg = ref.replace(/\//g, "-");
      const img = document.createElement("img");
      img.src = `images/${refImg}.avif`;
      img.alt = `${ref}`;
      img.onerror = () => console.log(`🖼️ Image not found for ${refImg}`);
      img.style.maxWidth = "300px";
      img.style.display = "block";
      img.style.marginTop = "10px";

      result.innerHTML = formatted;
      result.appendChild(img);
    })
    .catch(err => {
      console.error("❌ Lookup error:", err);
      document.getElementById("result").textContent = "Lookup failed.";
    });
}

function setupAdminButton() {
  const adminBtn = document.getElementById("adminBtn");

  adminBtn.onclick = () => {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "";

    const form = document.createElement("div");

    const refInput = document.createElement("input");
    refInput.placeholder = "Reference Number";
    form.appendChild(refInput);

    const priceInput = document.createElement("input");
    priceInput.placeholder = "Retail Price";
    form.appendChild(priceInput);

    const submit = document.createElement("button");
    submit.textContent = "Update";

    submit.onclick = () => {
      const reference = refInput.value.trim();
      const price = priceInput.value.trim();

      if (!reference || !price) {
        alert("Please provide both reference and retail price.");
        return;
      }

      const updateData = {
        reference: reference,
        retail_price: price
      };

      fetch("/.netlify/functions/admin-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updateData)
      })
        .then(res => res.json())
        .then(data => {
          console.log("✅ Admin update response:", data);
          alert("Update successful!");

          document.getElementById("refInput").value = reference;
          lookupReference();
        })
        .catch(err => {
          console.error("❌ Admin update error:", err);
          alert("Update failed.");
        });
    };

    form.appendChild(submit);
    resultDiv.appendChild(form);
  };
}

setupAdminButton();
