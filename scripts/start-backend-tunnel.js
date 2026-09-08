const ngrok = require('@expo/ngrok');

(async () => {
  try {
    const url = await ngrok.connect({ addr: 8080, proto: 'http', region: 'us' });
    console.log(url);
    setInterval(() => {}, 1000);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
