export async function handler(event) {
  console.log("Function triggered");

  try {
    console.log("Raw event body:", event.body);

    const { reference } = JSON.parse(event.body);
    console.log("Parsed reference:", reference);

    const prompt = `Provide ONLY raw JSON, no markdown, for Patek Philippe reference ${reference} in this concise style:
{
  "Reference Number": "...",
  "Retail Price": "...",
  "Collection": "short name like 'Nautilus' or 'Aquanaut'",
  "Dial": "...",
  "Case": "...",
  "Bracelet": "...",
  "Movement": "..."
}
Example:
{
  "Reference Number": "5711/1A",
  "Retail Price": "$34,893",
  "Collection": "Nautilus",
  "Dial": "Blue",
  "Case": "Steel",
  "Bracelet": "Steel",
  "Movement": "Caliber 26‑330 S C"
}
Answer for ${reference} in this JSON format only. No extra text.`;

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
