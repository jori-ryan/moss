const { default: ollama } = require('ollama');
const log = require('../log')

module.exports = {
  async chatCompletion(input) {
    log.add('Llama chat completion start')
    
    return ollama.chat({
      model: 'llama3.2',
      messages: input.messages
    }).then((response) => {
      log.add('Llama success');
      return response?.message?.content || '';
    }).catch((error) => {
      log.add('Llama error', error);
      return 'ERROR IN LLAMA COMPLETION';
    });
  }
  
}