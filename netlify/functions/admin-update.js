const fs = require('fs');
const path = require('path');
const multiparty = require('multiparty');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  return new Promise((resolve, reject) => {
    const form = new multiparty.Form();

    form.parse(event, async (err, fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return resolve({ statusCode: 400, body: JSON.stringify({ error: 'Invalid form data' }) });
      }

      const reference = fields.reference?.[0];
      const retail_price = fields.retail_price?.[0];
      const imageFile = files.image?.[0];

      if (!reference || !retail_price) {
        return resolve({ statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) });
      }

      const jsonPath = path.resolve(__dirname, '../../patek_refs.json');
      const raw = fs.readFileSync(jsonPath, 'utf8');
      const data = JSON.parse(raw);

      let existing = data.find(entry => entry.reference === reference);
      if (existing) {
        existing.retail_price = retail_price;
      } else {
        data.push({ reference, retail_price });
      }

      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');

      if (imageFile) {
        const safeRef = reference.replace(/\//g, '-');
        const destPath = path.resolve(__dirname, `../../images/${safeRef}.avif`);
        fs.copyFileSync(imageFile.path, destPath);
        console.log(`✅ Image saved: ${destPath}`);
      }

      return resolve({
        statusCode: 200,
        body: JSON.stringify({ message: 'Reference updated successfully' })
      });
    });
  });
};
