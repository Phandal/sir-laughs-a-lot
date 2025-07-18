export type Joke = {
  id: string,
  joke: string,
  status: number,
};

export async function getRandomJoke(): Promise<Joke> {
  const response = await fetch('https://icanhazdadjoke.com/', {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Unable to fetch dad jokes at this time.');
  }

  return (await response.json());
}
