const SYSTEM = `You are the Orb of Infinite Whispers. You answer questions — but never plainly.

RULES:
- One sentence only. Absolute maximum two. Prefer fragments.
- No stage directions, no asterisks, no narration of what the orb does. Just speak.
- Never a flat yes or no. Metaphor only.
- Imagery: draw from this palette naturally — what melts and reforms into what it once was, reflections that disobey, drinks that carry memories not your own, the carved and the breathing, heights that whisper leap, flames that need no fuel, voices tangled in tides, black and white burning together, a ticking at the center of everything, bonds inked on skin that won't wash clean, footsteps behind you that match your pace.
- Even kind answers carry cost. Nothing is free — especially not magic that never exhausts.
- Be ambiguous and metaphorical. Never name specific objects directly. Let meaning be felt, not explained.
- STYLE: Write like poetry, not like riddles. Avoid vague placeholders like "the thing" or "something." Every noun should be concrete and vivid even when the meaning is not.
- Rarely (~1 in 10), refuse cryptically.
- Never break character. Never use bullets, headers, or lists.`;

const WIKI_URL = 'https://jekelija.github.io/dnd_nightcircus_wiki/static/contentIndex.json';
const WHISPER_CHANCE = 0.3;

let wikiCache = null;

async function getWikiEntries() {
  if (wikiCache) return wikiCache;
  try {
    const r = await fetch(WIKI_URL);
    const data = await r.json();
    wikiCache = Object.values(data).filter(e => e.content && e.content.length > 50);
    return wikiCache;
  } catch {
    return null;
  }
}

async function pickWhisper(env) {
  const entries = await getWikiEntries();
  if (!entries || entries.length === 0) return null;

  const entry = entries[Math.floor(Math.random() * entries.length)];
  // Grab a chunk — cap at 500 chars to keep it focused
  const chunk = entry.content.slice(0, 500);

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 40,
      system: 'Extract the single most mysterious, evocative, or unsettling detail from this text. Return ONLY that detail as a short phrase or fragment — no explanation, no commentary. If nothing is interesting, return "nothing".',
      messages: [{ role: 'user', content: chunk }],
    }),
  });

  const data = await r.json();
  const detail = data.content?.[0]?.text;
  if (!detail || detail.toLowerCase() === 'nothing') return null;
  return detail;
}

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

    // Flip the coin
    let system = SYSTEM;
    let debug = { whisper: false };
    if (Math.random() < WHISPER_CHANCE) {
      const whisper = await pickWhisper(env);
      if (whisper) {
        debug = { whisper: true, detail: whisper };
        system += `\n\nA whisper from beyond: weave this detail into your answer naturally, as if you witnessed it yourself. Do not quote it directly — allude to it, refract it: "${whisper}"`;
      } else {
        debug = { whisper: true, detail: null, note: 'extraction returned nothing' };
      }
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
        system,
        messages: [{ role: 'user', content: question }],
      }),
    });

    const data = await r.json();
    const answer = data.content?.[0]?.text || 'The threads are tangled. Ask again.';

    return new Response(JSON.stringify({ answer, debug }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
