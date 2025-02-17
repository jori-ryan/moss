// Llms
const llama = require('../llm/llama');
const chatGpt = require('../llm/chatGpt');
const claude = require('../llm/claude');

// Utilities
const langChain = require('../memory/langChain');
const log = require('../log')

// Constants
const titleRequestBeginning = 'Create a concise, 3-5 word title with an emoji as a title for the chat history, in the given language.';
const titleRequestBeginningReplacement = 'Create a concise, 3-5 word title with an emoji as a title for the chat history.';

module.exports = {
  async getChatCompletion(input, isSummary = false, shortTermMemoryLimit = 3) {
    let llmName = input.llmName;
  
    const llmInput = {
      messages: input.messages,
      agentName: input.agentName
    };
  
    const isTitleRequest = this.getIsTitleRequest(llmInput.messages);
    const isTagRequest = this.getIsTagRequest(llmInput.messages);
  
    if (isTitleRequest) {
      // Alter the title request because the wording of the default title prompt confuses Llama about which language the title shoudl use.
      // Without this, Llama tends to use Spanish for the titles of English chats.
      llmInput.messages = this.replaceTitleRequest(llmInput.messages);
    }
  
    if (isTitleRequest || isTagRequest) {
      // handle the title and tag requests through Llama because it runs locally without consuming tokens from an external service.
      llmName = 'llama';
    } else if (!isSummary) {
      const systemMessageCount = llmInput.messages.filter(message => message.role === 'system').length;
      
      // Store long term memories using the langChain vector store
      const longTermMemoryCount = llmInput.messages.length - systemMessageCount - shortTermMemoryLimit;
      if (longTermMemoryCount > 0) {
        const longTermMemories = llmInput.messages.slice(systemMessageCount, longTermMemoryCount);
        
        await langChain.addLongTermMemories(longTermMemories);
  
        // Remove the long term memories from messages. This leaves only the system message and the short term memories.
        llmInput.messages.splice(systemMessageCount, longTermMemoryCount);
      }

      const longTermMemoriesSummary = await this.getLongTermMemories(input);
      // Alter the system message to include long term memories.
      if (longTermMemoriesSummary.length > 0) {
        llmInput.messages[0].content += ` Memories: ${longTermMemoriesSummary}`;
      }
    }
  
    llm = this.getLlmModel(llmName);

    // Anthropic handles the system prompt as a separate input, instead of handling the system prompt as the first message.
    if (llmName === 'claude' && llmInput.messages[0]?.role === 'system') {
      const systemPrompt = llmInput.messages[0].content;
      llmInput.system = systemPrompt;
      log.add(`SystemPrompt: ${systemPrompt}`);
      llmInput.messages.splice(0, 1);
    }
  
    return llm.chatCompletion(llmInput).then((aiResponse) => {
      if (aiResponse) {
        const output = {
          "choices": [{
            "index": 0,
            "message": {
              "role": "assistant",
              "content": aiResponse
            }
          }]
        }
        return output;
      }
    });
  },
  
  async getChatSummary(input, sentenceNumber, summaryPromptAddition = '') {
    const summaryInput = structuredClone(input);
    const systemMessageCount = summaryInput.messages.filter(message => message.role === 'system').length;
    summaryInput.messages.splice(0, systemMessageCount);
  
    const systemPrompt = {
      role: 'system',
      content: `Write a concise summary using ${sentenceNumber} short sentences. Do not mention that you are summarizing. The summary must include the entire conversation. Do not focus on the final message. ${summaryPromptAddition}`
    };
  
    const messagesPrompt = {
      role: 'user',
      content: `Summarize this conversation: ${JSON.stringify(summaryInput.messages)}`
    }
  
    summaryInput.messages = [systemPrompt, messagesPrompt];
  
    const isSummary = true;
    const summary = await this.getChatCompletion(summaryInput, isSummary);
    return summary.choices[0].message.content;
  },
  
  getChatCompletionInput(req) {
    const modelParts = req.body.model.split('_');
    const agentName = modelParts[0];
    let llmName = modelParts[1];
  
    return {
      messages: req.body.messages,
      agentName,
      llmName
    }
  },

  getIsTitleRequest(messages){
    return messages[0]?.content?.startsWith(titleRequestBeginning);
  },

  replaceTitleRequest(messages) {
    if (messages[0].content.startsWith(titleRequestBeginning)) {
      messages[0].content = messages[0].content.replace(titleRequestBeginning, titleRequestBeginningReplacement);
    }
    return messages;
  },

  getIsTagRequest(messages) {
    const tagRequestBeginning = '### Task:\nGenerate 1-3 broad tags categorizing the main themes of the chat history';
    return messages[0]?.content?.startsWith(tagRequestBeginning);
  },

  async getLongTermMemories(input) {   
    const numberOfSummarySetences = 5;
    const summary = await this.getChatSummary(input, numberOfSummarySetences);
    log.add(`summary: ${summary}`);
    if (summary.length > 0) {
      const longTermMemories = await langChain.getLongTermMemories(summary);

      const summaryPromptAddition = 'Summarize these long term memories. Each pair of user message and assistant response is from a separate interaction, not one long conversation.';
      return await this.getChatSummary(longTermMemories, numberOfSummarySetences, summaryPromptAddition);
    } else {
      return '';
    }
  },

  getLlmModel(llmName) {
    switch (llmName) {
      case 'chatGpt':
        return chatGpt;
      case 'claude':
        return claude;
      default:
        return llama;
    }
  }
}
