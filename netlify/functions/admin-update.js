const fs = require('fs');
const path = require('path');

exports.handler = async function (event) {
  console.log("⚡️ Admin function triggered");
  console.log("🧪 Method:", event.httpMethod);

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { reference, retail_price } = JSON.parse(event.body);

    if (!reference || !retail_price) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing reference or price' }) };
    }

    const jsonPath = path.resolve(__dirname, '../../patek_refs.json');
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(raw);

    let entry = data.find(d => d.reference === reference);
    if (entry) {
      entry.retail_price = retail_price;
      console.log("🔁 Updated existing reference");
    } else {
      data.push({ reference, retail_price });
      console.log("➕ Added new reference");
    }

    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
    console.log("✅ JSON updated");

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Updated successfully' })
    };

  } catch (err) {
    console.error("❌ Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

