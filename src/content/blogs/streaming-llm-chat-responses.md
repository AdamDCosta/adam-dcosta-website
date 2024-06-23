---
title: "✨ Streaming LLM Chat Responses (Nuxt, Typescript, OpenAI)"
slug: "streaming-llm-chat-responses"
date: "15/06/24"
image: "/images/node-streaming.webp"
---

#webdev #beginners #typescript #ai #llm #node #nuxt

## Introduction

Are you a javascript developer and interested in building AI agents or LLM apps? Do you need to stream the LLM responses from your server to the client? I recently needed to do exactly that and thought I'd share what I learned along the way.

In this post I will cover the concept of streaming OpenAI messages from a node server to a client. LLMs are slow and streaming messages to the user helps to cover up this fact. The key concepts I'll demonstrate are: generator functions, server-sent events and EventSources in Node.js.

I've built a simple chatbot app with all these concepts that you can check out [here](https://github.com/AdamDCosta/chat-streaming-example). I built it with Nuxt, so I had a server out of the box. The examples below will also use Nuxt. I've tried to keep them simple so they can be applied to any framework or vanilla app.

Let's start on the server.

## ⚙️ Generator Functions

Generator functions are special types of functions that return an iterator. You can pause and resume their execution and they are great for handling async operations.

Defined with an asterisk after the function keyword:

```js
function* getNumbers() {
  yield 1;
  yield 2;
  yield 3;
}

const gen = getNumbers();

console.log(gen.next()); // { value: 1, done: false }
console.log(gen.next()); // { value: 2, done: false }
console.log(gen.next()); // { value: 3, done: false }
console.log(gen.next()); // { value: undefined, done: true }
```

What's going on here?

Generator functions return an iterator, which is an object that contains methods like `next()` `return` and `throw`. It also has a state. When we invoke the `next()` method for the first time, the state updates to `Running` and then returns the first yielded value (in this case: 1). In the example above, the fourth time you call `gen.next()`, it will return `{ value: undefined, done: true }`. This is because the generator function `getNumbers` only yields three values (1, 2, and 3). After the third yield, there are no more yield statements, so the generator function is done, and `gen.next()` returns an object with value as `undefined` and `done` as `true`. This is because generator functions implicitly return `undefined`.

For the purposes of this post however, the cool thing about generator functions is that you can iterate over them with a for loop:

```js
function* getNumbers() {
  yield 1;
  yield 2;
  yield 3;
}

for (const value of getNumbers()) {
  console.log(value);
} // 1 2 3
```

And this is super handy when it comes to streaming responses from an LLM. I'm using the node OpenAI library for this example:

```js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

export default async function* chatCompletion() {
  const stream = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [{ role: "user", content: "Test content" }],
    stream: true,
  });

  for await (const chunk of stream) {
    yield chunk.choices[0]?.delta?.content || "";
  }
}
```

## ↗️ SERVER-SENT EVENTS

Server-sent events (SSE) allows you to push real-time updates to a client over a persistent HTTP connection. Usefule for live updates like sports scores, news feeds etc. We can use SSE in conjunction with our `chatCompletion` generator function to stream the chunks of text to a client.

I'm using Nuxt's Nitro server for my example, how you set headers may differ depending on the framework you're using. First we set the correct headers. Then we can iterate over our chatCompletion generator function. It's important to note that SSE responses should be sent in a specific format. Each message should be prefixed with "data: " and suffixed with two newline characters "\n\n".

```js
export default defineEventHandler(async (event) => {
  // Set the correct headers to establish and maintain the SSE connection
  setHeader(event, "cache-control", "no-cache");
  setHeader(event, "connection", "keep-alive");
  // this tells the client the server is going to be sending events over this connection
  setHeader(event, "content-type", "text/event-stream");
  setResponseStatus(event, 200);

  // iterate over our chatCompletion generator function
  for await (const chunk of chatCompletion()) {
    if (!event.node.res.writableEnded) {
      // send the chunk
      event.node.res.write(`data: ${chunk}\n\n`);
    } else {
      break;
    }
  }

  // end the response process once all the chunks have been yielded
  if (!event.node.res.writableEnded) {
    res.end();
  }
});
```

We now have what we need on our server. I've left out error handling to keep these examples as simple as possible. Let's look at the client.

## ⚡ Event Sourcing

We can now use an event source in our client to listen and use the events that our SSE endpoint is pushing. I'll use the standard `EventSource` api:

```ts
const getChatCompletion = async () => {
  responseError.value = "";
  let connectionOpen = false;

  // Create a new EventSource object that will open a persistent connection to the server at /api/chat
  const assistantEventSource = new EventSource(`/api/chat`);

  // Define a cleanup function that will close the EventSource connection
  const cleanup = () => {
    assistantEventSource.close();
  };

  // Define an event listener for the 'open' event, which is fired when a connection to the server is opened
  assistantEventSource.onopen = () => {
    // Set connectionOpen to true when the connection is successfully opened
    connectionOpen = true;
  };

  // Define a new message with the role of 'assistant' and an empty content
  const newMessage = ref<ChatMessage>({
    role: "assistant",
    content: "",
  });

  // this is where I'm storing the conversation
  currentChatMessages.value.push(newMessage.value);

  // Define an event listener for the 'message' event, which is fired when a message is received from the server
  assistantEventSource.onmessage = async (event) => {
    // Append the received data to the content of the new message
    newMessage.value.content += event.data;
  };

  // Define an event listener for the 'error' event, which is fired when an error occurs
  assistantEventSource.onerror = (event) => {
    // If the connection was open, set connectionOpen to false
    if (connectionOpen) {
      connectionOpen = false;
    } else {
      // If the connection was not open, set the responseError value to an error message
      responseError.value = "An error occurred with the connection.";
    }
    // Call the cleanup function to close the connection
    cleanup();
  };
};
```

And this should work. All you need to do now is create your UI, handle errors and you've got yourself a basic AI chatbot with streamed responses!

## Conclusion

Integrating real-time chat functionalities with server-sent events and generator functions in a Node environment provides a powerful way to enhance user experience in web applications. Whether you are looking to develop an AI-driven chat interface or simply stream data efficiently from server to client, the concepts above should give you a solid foundation to work from. The combination of server-sent events and the asynchronous control afforded by generator functions creates a seamless and interactive user experience. I hope this has been useful - there may be better ways to do the same thing but this is how I figured it out. Nothing beats learning through doing!

The team at Text Alchemy used these concepts to help build the development server for our open-source prompt-chaining library [RetortJS](https://www.textalchemy.ai/retortjs).

Check out my [repo](https://github.com/AdamDCosta/chat-streaming-example) if you'd like to see the full code. I'd love to hear alternative strategies or problems you have faced using any of these techniques.
