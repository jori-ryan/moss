const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { OpenAIEmbeddings } = require("@langchain/openai");
const fs = require('fs');
require('dotenv').config();
const log = require('../log')

const storagePath = './vectorstore.json';

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small",
});

module.exports = {
  async addLongTermMemories(messages) {
    const vectorStore = await this.loadVectorStore();
    const documents = [];
    const memoryPair = [];

    messages.forEach(memory => {
      // Store memories in pairs of user query and assistant response.
      // The user query always comes before assistant the assistant response.
      const isUserMessage = memory.role === 'user' && memoryPair.length === 0;
      const isAssistantMessage = memory.role === 'assistant' && memoryPair.length === 1;

      if (isUserMessage || isAssistantMessage) {
        memoryPair.push(memory);
      }

      if (memoryPair.length === 2) {
        // Store the combined memoryPair content.
        // Store metadata for separating the content into user and assistant messages on retrieval.
        const document = {
          pageContent: memoryPair[0].content + memoryPair[1].content,
          metadata: { 
            userStart: 0,
            userEnd: memoryPair[0].content.length,
            assistantStart: memoryPair[0].content.length,
            assistantEnd: memoryPair[0].content.length + memoryPair[1].content.length
          },
        };
        documents.push(document);

        // Clear the memory pair to prepare for the next pair
        memoryPair.splice(0, memoryPair.length);;
      }
    });

    await vectorStore.addDocuments(documents);
    await this.saveVectorStore(vectorStore);
  },
  async getLongTermMemories(prompt, memoryCount = 10) {
    const vectorStore = await this.loadVectorStore();
    //const filter = (doc) => doc.metadata.source === "https://example.com";

    const similaritySearchResults = await vectorStore.similaritySearch(
      prompt,
      memoryCount
      //filter
    );

    const messages = [];
    similaritySearchResults.forEach(document => {
      messages.push({
        role: 'user',
        content: document.pageContent.slice(document.metadata.userStart, document.metadata.userEnd)
      });

      messages.push({
        role: 'assistant',
        content: document.pageContent.slice(document.metadata.assistantStart, document.metadata.assistantEnd)
      });
    });
    
    return { messages };
  },
  async saveVectorStore(vectorStore) {
    const docs = vectorStore.memoryVectors;
    
    fs.writeFile(storagePath, JSON.stringify(docs), (err) => {
      if (err) throw err;
    });
  },
  async loadVectorStore() {
    try {
      const data = fs.readFileSync(storagePath);
      let savedData = JSON.parse(data);

      // Convert content to pageContent because this will be required for addDocuments.
      // vectorStore.memoryVectors returns an object with content
      // vectorStore.addDocuments takes an object with pageContent
      savedData.forEach(element => {
        element['pageContent'] = element['content'];
        delete element['content'];
      });

      const vectorStore = new MemoryVectorStore(embeddings);
      await vectorStore.addDocuments(savedData);
      
      return vectorStore;
      
    } catch (error) {
      log.add('ERROR LOADING VECTOR STORE', error);
      return new MemoryVectorStore(embeddings);
    }
  }
}
