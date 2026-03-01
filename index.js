const fs = require('mz/fs');
const path = require('path');
const http = require('http');
const { Readable } = require('stream');
const colors = require('colors/safe');

let original = [];

const colorsOptions = ['red', 'yellow', 'green', 'blue', 'magenta', 'cyan', 'white'];
const numColors = colorsOptions.length;

const selectColor = previousColor => {
  let color;
  do {
    color = Math.floor(Math.random() * numColors);
  } while (color === previousColor);
  return color;
};

function streamer(stream) {
  const frames = original;
  let index = 0;
  let lastColor;
  let timer;

  function tick() {
    stream.push('\u001b[2J\u001b[H');
    const colorIdx = lastColor = selectColor(lastColor);
    const coloredFrame = colors[colorsOptions[colorIdx]](frames[index]);
    stream.push(coloredFrame);
    index = (index + 1) % frames.length;
    timer = setTimeout(tick, 70);
  }

  tick();

  return () => {
    clearTimeout(timer);
  };
}

const server = http.createServer((req, res) => {
  if (req.url === '/healthcheck') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok' }));
  }

  if (
    req.headers &&
    req.headers['user-agent'] &&
    !req.headers['user-agent'].includes('curl')
  ) {
    res.writeHead(302, { Location: 'https://github.com/k85601/detective-pikachu-dance.io' });
    return res.end();
  }

  const stream = new Readable({ read() {} });
  stream.on('error', () => {});

  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked',
  });

  stream.pipe(res);

  const cleanupLoop = streamer(stream);

  const onClose = () => {
    cleanupLoop();
    stream.unpipe(res);
    stream.destroy();
  };

  res.on('close', onClose);
  res.on('error', onClose);
});

async function loadAndStart() {
  const framesPath = 'frames';
  const files = (await fs.readdir(framesPath)).sort();

  original = await Promise.all(files.map(async (file) => {
    const frame = await fs.readFile(path.join(framesPath, file));
    return frame.toString();
  }));

  console.log('Loaded ' + original.length + ' frames');

  const port = process.env.PORT || 3000;
  server.listen(port, function(err) {
    if (err) throw err;
    console.log('Listening on http://localhost:' + port);
  });
}

loadAndStart().catch(function(err) {
  console.log('Error loading frames');
  console.log(err);
});
