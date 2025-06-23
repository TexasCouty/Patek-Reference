const fetch = require('node-fetch');

exports.handler = async function(event) {
  const { reference } = JSON.parse(event.body);

  const prompt = `Give a detailed breakdown for the Patek Philippe reference ${reference}. Include:
✅ Collection
✅ Case
✅ Dial
✅ Strap
✅ Movement
✅ Water Resistance`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify({ reply: data.choices[0].message.content })
  };
};
