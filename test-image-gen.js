// File: test-image-gen.js
const { OpenAI } = require("openai");

// 🔧 OPTION 1 — Set your API key directly here:
const openai = new OpenAI({
  apiKey: "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", // ← Replace this with your actual key
});

(async () => {
  try {
    const result = await openai.images.generate({
      prompt: "A luxury wristwatch product photo on white background",
      n: 1,
      size: "256x256",
      response_format: "url",
    });

    console.log("✅ Success! Image URL:");
    console.log(result.data[0].url);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();