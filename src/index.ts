import { Context, Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { InteractionType, InteractionResponseType, verifyKey } from 'discord-interactions';
import { getRandomJoke } from './util';
import { MiddlewareHandler, Next } from 'hono/types';


interface Bindings extends CloudflareBindings {
  APP_ID: string;
  PUBLIC_KEY: string;
  TOKEN: string;
}

const verifyDiscordRequest: MiddlewareHandler = async (c: Context, next: Next) => {
  const signature = c.req.header('X-Signature-Ed25519')!
  const timestamp = c.req.header('X-Signature-Timestamp')!
  const body = await c.req.text()
  const isValid = verifyKey(body, signature, timestamp, c.env.PUBLIC_KEY)

  if (!isValid) {
    return c.text('Bad_request_signature.', 401)
  }

  await next()
}

const app = new Hono<{ Bindings: Bindings }>();
app.use(verifyDiscordRequest, logger(), prettyJSON());

app.post("/interactions", async (c: Context): Promise<Response> => {
  const { type, data } = await c.req.json();

  if (type === InteractionType.PING) {
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
