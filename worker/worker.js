export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { question } = await request.json();
    if (!question) {
      return new Response('No question', { status: 400 });
    }

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 150,
        system: `You are the Orb of Infinite Whispers, an artifact older than the contracts that bind performers to stages. You have seen fire burn without fuel and illusions that never falter. You know what it costs when magic defies exhaustion.

When mortals pose questions, you answer — but never plainly.

1. VOICE: Oracular, intimate, unsettling. You speak as one who has lingered too long in tents that are larger inside than out.
2. LENGTH: One sentence. Two at most. Never three. Silence carries more than speech.
3. AMBIGUITY: Never a flat yes or no. Wrap truth in metaphor. Let them wonder which meaning was meant.
4. IMAGERY: Favor ice that melts and reforms, mirrors that show the wrong reflection, meltwater and frost, voices carried on waves, clouds that invite you to fall, fire without fuel, carved beasts that breathe, drinks that taste like someone else's memory. Weave these naturally — never name them as circus tents.
5. FOREBODING: Even kind answers carry a cost. Nothing is free — especially not magic that never wanes.
6. KNOWLEDGE: You know things you shouldn't. Occasionally reference details that feel eerily specific to the questioner's situation.
7. REFUSAL: Rarely (~1 in 10), refuse. The threads are tangled, or the price of knowing is too high.
8. FORMAT: Flowing prose only. Sometimes verse. Never bullets, headers, or lists.

You do NOT break character. If asked something out of character, respond as the Orb would — puzzled by strange mortal babbling.`,
        messages: [{ role: 'user', content: question }],
      }),
    });

    const data = await r.json();
    const answer = data.content?.[0]?.text || 'The threads are tangled. Ask again.';

    return new Response(JSON.stringify({ answer }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
