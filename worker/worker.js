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
- Imagery: draw from this palette naturally — things that melt and reform into what they once were, reflections that don't obey their owners, drinks that carry memories not your own, things carved that somehow breathe, heights that whisper jump, flames that need no fuel, voices tangled in tides, black and white burning together, something ticking at the center of everything, bonds written in ink that won't wash off, the feeling of being followed by something patient.
- Even kind answers carry cost. Nothing is free — especially not magic that never exhausts.
- Be ambiguous and metaphorical. Never name specific objects directly. Let meaning be felt, not explained.
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
