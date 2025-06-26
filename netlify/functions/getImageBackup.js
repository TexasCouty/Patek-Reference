const { OpenAI } = require("openai");

exports.handler = async (event) => {
  console.log("📥 Incoming request to getImageBackup");

  try {
    if (!event.body) {
      console.error("❌ Missing request body");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing request body" }),
      };
    }

    const { reference } = JSON.parse(event.body);
    console.log("🔎 Requested reference:", reference);

    if (!reference) {
      console.error("❌ Missing 'reference' field in request body");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing 'reference' in request body" }),
      };
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY is not defined");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing OpenAI API key" }),
      };
    }

    console.log("🚀 Sending image generation request to OpenAI");

    const response = await openai.images.generate({
      prompt: `Patek Philippe watch with reference number ${reference}, product photo on white background`,
      n: 1,
      size: "512x512",
      response_format: "url"
    });

    console.log("📦 OpenAI response received:", response);

    const imageUrl = response?.data?.[0]?.url;

    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error("❌ Invalid response from OpenAI.");
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Invalid response from OpenAI." }),
      };
    }

    console.log("✅ Returning image URL:", imageUrl);

    return {
      statusCode: 200,
      body: JSON.stringify({ imageUrl }),
    };
  } catch (err) {
    console.error("🔥 Error during image fallback:", err.message || err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Unknown error occurred" }),
    };
  }
};
