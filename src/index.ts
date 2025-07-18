import { Context, Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { InteractionType, InteractionResponseType, verifyKey } from 'discord-interactions';
import { getRandomJoke } from './util';


interface Bindings extends CloudflareBindings {
  APP_ID: string;
  PUBLIC_KEY: string;
  TOKEN: string;
}

const app = new Hono<{ Bindings: Bindings }>();
app.use(logger(), prettyJSON());

app.post("/interactions", async (c: Context): Promise<Response> => {
  const signature = c.req.header('x-signature-ed25519')!
  const timestamp = c.req.header('x-signature-timestamp')!
  const body = await c.req.text()
  console.log('signature', signature);
  console.log('timestamp', timestamp);
  console.log('pub', c.env.PUBLIC_KEY);
  console.log('body', body);
  const isValid = await verifyKey(body, signature, timestamp, c.env.PUBLIC_KEY)

  if (!isValid) {
    return c.text('Bad_request_signature.', 401)
  }

  const { type, data } = JSON.parse(body)

  if (type === InteractionType.PING) {
    console.log('pong');
    return c.json({
      type: InteractionResponseType.PONG,
    });
  }

  if (type !== InteractionType.APPLICATION_COMMAND) {
    return c.text('Bad_Request', 400);
  }

  const response = {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: 'Unknown Command...',
    }
  };

  if (data.name === 'joke') {
    console.log('joke');
    try {
      const joke = await getRandomJoke();
      response.data.content = joke.joke;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      response.data.content = message;
    }
  }

  return c.json(response);
});

export default app;
