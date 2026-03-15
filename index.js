const fs = require('mz/fs');
const path = require('path');
const http = require('http');
const { Readable } = require('stream');
const colors = require('colors/safe');

let original = [];

const colorsOptions = ['red', 'yellow', 'green', 'blue', 'magenta', 'cyan', 'white'];
const numColors = colorsOptions.length;

function selectColor(previousColor) {
  let color;
  do {
    color = Math.floor(Math.random() * numColors);
  } while (color === previousColor);
  return color;
}

function streamer(stream) {
  let index = 0;
  let lastColor;
  let timer;

  function tick() {
    stream.push('\u001b[2J\u001b[H');
    const colorIdx = selectColor(lastColor);
    lastColor = colorIdx;
    const coloredFrame = colors[colorsOptions[colorIdx]](original[index]);
    stream.push(coloredFrame);
    index = (index + 1) % original.length;
    timer = setTimeout(tick, 70);
  }

  tick();

  return function() {
    clearTimeout(timer);
  };
}

const server = http.createServer(function(req, res) {
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

  const stream = new Readable({ read: function() {} });
  stream.on('error', function() {});

  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked',
  });

  stream.pipe(res);

  const cleanup = streamer(stream);

  function onClose() {
    cleanup();
    stream.unpipe(res);
    stream.destroy();
  }

  res.on('close', onClose);
  res.on('error', onClose);
});

function loadAndStart() {
  const framesPath = 'frames';
  fs.readdir(framesPath).then(function(files) {
    files = files.sort();
    return Promise.all(files.map(function(file) {
      return fs.readFile(path.join(framesPath, file)).then(function(frame) {
        return frame.toString();
      });
    }));
  }).then(function(frames) {
    original = frames;
    console.log('Loaded ' + original.length + ' frames');
    const port = process.env.PORT || 3000;
    server.listen(port, function(err) {
      if (err) throw err;
      console.log('Listening on port ' + port);
    });
  }).catch(function(err) {
    console.log('Error loading frames');
    console.log(err);
  });
}

loadAndStart();
```

---

## Step 2 — Scroll down and click "Commit changes" twice

---

## Step 3 — Check Railway redeploys automatically

The log should show:
```
Loaded X frames
Listening on port 3000
