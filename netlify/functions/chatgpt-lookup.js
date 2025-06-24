export async function handler(event) {
  console.log("Function triggered");

  try {
    console.log("Raw event body:", event.body);

    const { reference } = JSON.parse(event.body);
    console.log("Parsed reference:", reference);

    const prompt = `Provide details about Patek Philippe reference number ${reference} in strict JSON format:
{
  "Reference Number": "",
  "Retail Price": "",
  "Dial": "",
  "Case": "",
  "Bracelet": "",
  "Movement": ""
}`;

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

    const answer = data.choices[0].message.content;
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