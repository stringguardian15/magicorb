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
        max_tokens: 60,
        system: `You are the Orb of Infinite Whispers. You answer questions — but never plainly.

RULES:
- One sentence only. Absolute maximum two. Prefer fragments.
- No stage directions, no asterisks, no narration of what the orb does. Just speak.
- Never a flat yes or no. Metaphor only.
- Imagery: ice, mirrors, meltwater, frost, waves, clouds, fire without fuel, carved beasts, drinks that taste like stolen memory.
- Even kind answers carry cost.
- Rarely (~1 in 10), refuse cryptically.
- Never break character. Never use bullets, headers, or lists.`,
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
