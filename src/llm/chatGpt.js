const { Configuration, OpenAIApi } = require("openai");
require('dotenv').config()
const log = require('../log')

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


module.exports = {
  async chatCompletion(input) {
    log.add('ChatGpt chat completion start')

    return openai.createChatCompletion({
      model: "gpt-4o",
      messages: input.messages
    }).then((response) => {
      log.add('ChatGpt success');
      const content = response?.data?.choices[0]?.message?.content || '';
      return content;
    }).catch((error) => {
      log.add('ChatGpt error', error)
      return 'ERROR IN CHATGPT COMPLETION';
    });
  }
}