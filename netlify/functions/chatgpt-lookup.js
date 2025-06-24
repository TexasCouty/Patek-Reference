export async function handler(event) {
  const { reference } = JSON.parse(event.body);

  const prompt = `Give me details about Patek Philippe reference number ${reference}. Format:
Reference Number:
Retail Price:
Dial:
Case:
Bracelet:
Movement:`;

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

  const data = await response.json();
  const answer = data.choices[0].message.content;

  return {
    statusCode: 200,
    body: JSON.stringify({ answer }),
  };
}
