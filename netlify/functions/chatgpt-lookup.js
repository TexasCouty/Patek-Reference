export async function handler(event) {
  console.log("Function triggered");

  try {
    console.log("Raw event body:", event.body);

    const { reference } = JSON.parse(event.body);
    console.log("Parsed reference:", reference);

    const prompt = `Provide ONLY raw JSON, no code block or markdown, for Patek Philippe reference number ${reference} in this concise style:
{
  "Reference Number": "exact reference",
  "Retail Price": "short dollar amount",
  "Dial": "short phrase like 'Blue'",
  "Case": "one word like 'Steel'",
  "Bracelet": "same short format",
  "Movement": "short caliber only",
  "Image URL": "realistic public image URL for this reference or a placeholder like 'https://www.patek.com/img/watch_placeholder.jpg' if unavailable"
}
Example for style:
{
  "Reference Number": "5711/1A",
  "Retail Price": "$34,893",
  "Dial": "Blue",
  "Case": "Steel",
  "Bracelet": "Steel",
  "Movement": "Caliber 26‑330 S C",
  "Image URL": "https://www.patek.com/img/5711_1A.jpg"
}
Answer for ${reference} only in this short JSON style. If no real image exists, provide a placeholder link. No other text.`;

    console.log("Prompt to OpenAI:", prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    console.log("OpenAI API status:", response.status);

    const data = await response.json();
    console.log("OpenAI raw response:", JSON.stringify(data));

    const answer = data.choices[0].message.content.trim();
    console.log("Extracted answer:", answer);

    return {
      statusCode: 200,
      body: JSON.stringify({ answer }),
    };
  } catch (error) {
    console.error("Error in function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.toString() }),
    };
  }
}

