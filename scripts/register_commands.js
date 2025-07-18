const url = new URL('https://discord.com');

url.pathname = `api/v10/applications/${process.env.APP_ID}/commands`;

const requestBody = {
  name: 'joke',
  description: 'Get a random dad joke',
}

console.log(url.toString());

const response = await fetch(url, {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bot ${process.env.TOKEN}`
  },
  method: 'post',
  body: JSON.stringify(requestBody),
});

if (!response.ok) {
  console.error('Error creating commands', response.status);
  console.error(JSON.stringify(await response.json(), null, 2));
  process.exit(1);
}

console.log('Successfully created commands');
