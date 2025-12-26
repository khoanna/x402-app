import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: "",
});

const response = await openrouter.chat.send({
  model: "xiaomi/mimo-v2-flash:free",
  messages: [
    {
      role: "user",
      content: "Who is the GOAT of footbal? Ronaldo or Messi?",
    },
  ],
  streamOptions: {
    includeUsage: true,
  },
});
console.log("Total Tokens Used: ", response.usage?.totalTokens);
console.log("Message: ", response.choices[0].message.content);

