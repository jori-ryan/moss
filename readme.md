## About
  This project is a Node-based API that serves as an intermediary between various LLMs (large language models) and Open Web UI. The purpose of this project is to create a personalized and extremely customizabe way to interact with LLMs.
  
  Here are some ways that this approach to interacting with LLms is more versatile than the standard chat interfaces offered by companies like Open AI and Anthropic.
  
    * Long term memory (implemented in this project using LangChain)
    * Fine control of prompts
    * Conditional prompts
    * Multistage prompts
    * Interactions with multiple LLMs from different companies.
    * Interactions with non-LLM projects.
    * Access to cutting edge models through API tokens instead of paying for subscriptions. This can be more cost effective, depending on the volume of use.

## Roadmap
  * Store short term memories so that they persist across chats.
  * Support for separate agents with their own memories.
  * Support for multiple accounts that can not access each other's agents.
  * Add a database for LangChain vector stores. Currently, the project uses text files for vector stores.

## Setup
  * Follow the Open Web UI docker setup instructions Open Web UI provides a user interface that can be routed through this project.
    - https://docs.openwebui.com/
  * Install ollama. This provides a free local LLM for small, free queries.
    - https://ollama.com/

### Run project ###
  * Create a .env file in the main project folder with valid OpenAi and Anthropic API keys in the following format
      OPENAI_API_KEY=""
      ANTHROPIC_API_KEY=""
  * From this project's main folder, run "npm run start"
  * Open Open Web UI (You may need to change the port, depending on how you set up Open Web UI). http://localhost:3000/
    * Connect Open Web UI to this project
      * Click the user icon in the upper right
      * Click "Settings"
      * Click "Admin Settings"
      * Click "Connections"
      * Set "OpenAI API" to the following (this will make Open Web UI send OpenAI API requests to this project)
        http://host.docker.internal:8533
    * Set up the model
      * Click Workspace on the upper left side of the screen (right under New Chat).
      * Click + to add a model
      * Set "Name*" and "Model ID*" to the following.
        moss_claude
      * A system prompt can optionally be used.
      * Alternativevely, you can add another model with the system prompt and set "Base Model (From)" to moss_claude.
