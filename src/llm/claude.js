const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config()
const log = require('../log')

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

module.exports = {
  async chatCompletion(input) {
    const payload = {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: input.messages,
    };

    if (input.system) {
      payload.system = [{ text: input.system, type: 'text' }];
    }

    return client.messages.create(payload)
    .then((response) => {
      log.add('Claude success');
      const content = response.content[0].text;
      return content;
    }).catch((error) => {
      log.add('Claude error', error)
      return 'ERROR IN CLAUDE COMPLETION';
    });
  }
}