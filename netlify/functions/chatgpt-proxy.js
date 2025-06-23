exports.handler = async function (event) {
  try {
    const { reference } = JSON.parse(event.body);

    const prompt = `Give a detailed breakdown for the Patek Philippe reference ${reference}. Include:
✅ Collection
✅ Case
✅ Dial
✅ Strap
✅ Movement
✅ Water Resistance`;

    // ✅ Use native fetch
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

    // ✅ Log entire response for debugging
    console.log('OpenAI response:', JSON.stringify(data, null, 2));

    if (!data.choices || !data.choices[0]) {
      // Return error if response is unexpected
      return {
        statusCode: 500,
        body: JSON.stringify({
          reply: `OpenAI error: ${JSON.stringify(data)}`
        })
      };
    }

    // ✅ Safe return
    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: data.choices[0].message.content
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        reply: `Server error: ${error.message}`
      })
    };
  }
};
