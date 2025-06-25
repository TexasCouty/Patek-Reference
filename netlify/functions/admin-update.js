const fs = require('fs');
const path = require('path');
const multiparty = require('multiparty');

exports.handler = async function (event) {
  console.log("⚡️ Admin function triggered");
  console.log("🧪 Method:", event.httpMethod);

  if (event.httpMethod !== 'POST') {
    console.log("❌ Invalid method");
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  return new Promise((resolve, reject) => {
    const form = new multiparty.Form();

    form.parse(event, async (err, fields, files) => {
      if (err) {
        console.error("❌ Form parse error:", err);
        return resolve({ statusCode: 400, body: JSON.stringify({ error: 'Invalid form data' }) });
      }

      console.log("✅ Parsed fields:", fields);
      console.log("🖼️ Parsed files:", files);

      const reference = fields.reference?.[0];
      const retail_price = fields.retail_price?.[0];
      const imageFile = files.image?.[0];

      console.log("🔢 Reference:", reference);
      console.log("💰 Retail Price:", retail_price);
      console.log("📸 Image file object:", imageFile);

      if (!reference || !retail_price) {
        console.log("❗ Missing reference or retail price");
        return resolve({ statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) });
      }

      try {
        const jsonPath = path.resolve(__dirname, '../../patek_refs.json');
        const raw = fs.readFileSync(jsonPath, 'utf8');
        const data = JSON.parse(raw);

        let existing = data.find(entry => entry.reference === reference);
        if (existing) {
          existing.retail_price = retail_price;
          console.log("🔁 Updated existing reference");
        } else {
          data.push({ reference, retail_price });
          console.log("➕ Added new reference");
        }

        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
        console.log("✅ JSON file updated");

        if (imageFile) {
          const safeRef = reference.replace(/\//g, '-');
          const destPath = path.resolve(__dirname, `../../images/${safeRef}.avif`);
          fs.copyFileSync(imageFile.path, destPath);
          console.log(`📁 Image saved to: ${destPath}`);
        }

        return resolve({
          statusCode: 200,
          body: JSON.stringify({ message: 'Reference updated successfully' })
        });
      } catch (err) {
        console.error("❌ Error updating data:", err);
        return resolve({
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to update data', details: err.message })
        });
      }
    });
  });
};

