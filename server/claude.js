import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function generateBackgroundInfo(tracks) {
  try {
    const tracksList = tracks
      .map((t, i) => `${i + 1}. "${t.name}" by ${t.artist}`)
      .join('\n');

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Generate a brief, fun 1-2 sentence background/fun fact for each of these songs. Return as JSON array with "name", "artist", and "background" fields:\n\n${tracksList}`
        }
      ]
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Failed to parse Claude response');

    const backgroundData = JSON.parse(jsonMatch[0]);
    return backgroundData;
  } catch (error) {
    console.error('Claude API error:', error.message);
    return tracks.map(t => ({
      name: t.name,
      artist: t.artist,
      background: `A great track by ${t.artist}.`
    }));
  }
}
