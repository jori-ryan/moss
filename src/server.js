const express = require('express');
const app = express();
const port = 8533;
const chatCompletion = require('./chat/chatCompletion');
const log = require('./log')

app.use(express.json());

app.post('/chat/completions', (req, res) => {
  const input = chatCompletion.getChatCompletionInput(req);

  chatCompletion.getChatCompletion(input).then(output => {
    res.send(output);
  });
});

app.get('/models', (req, res) => {
  log.add('Models gotten by openWebUi');
  const response = {
    "object": "list",
    "data": [
      {
        "id": "moss_llama",
        "object": "model",
      },
      {
        "id": "moss_claude",
        "object": "model",
      }
    ]
  }

  res.send(response);
});

app.listen(port, () => {
  const shouldLogToConsole = true;
  log.add(`#################### Server started on port ${port} ####################`, shouldLogToConsole);
});
