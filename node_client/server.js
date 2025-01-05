import express from "express";
import http from "http";
import { Server } from "socket.io";
import { readJsonFile, writeJsonFile, resolvePath } from "./fileUtils.js";
import dotenv from "dotenv";
import OpenAI from "openai";
import {
  scoresSchema,
  summarySchema,
  default_final_scores,
} from "./schemas.js";
// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const dataFilePath = resolvePath("data/appData.json");

app.use(express.json());

// Route: Fetch All Scores
app.get("/fetch-scores", (req, res) => {
  try {
    const data = readJsonFile(dataFilePath, { conversations: [] });
    const scores = data.conversations.map((conversation) => ({
      finalScores: conversation.finalScores || default_final_scores,
      generalMoodScore: conversation.generalMoodScore,
    }));
    res.status(200).json(scores);
  } catch (error) {
    console.error("Error fetching scores:", error.message);
    res.status(500).json({ error: "Failed to fetch scores." });
  }
});

// Socket.IO for real-time chat
io.on("connection", (socket) => {
  console.log("User connected via WebSocket");

  socket.on("message", async (data) => {
    const action = data.action;

    switch (action) {
      case "start":
        await handleStart(socket);
        break;
      case "chat":
        await handleChat(socket, data.message);
        break;
      case "end":
        await handleEnd(socket);
        break;
      default:
        socket.emit("error", "Invalid action.");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected from WebSocket");
  });
});

// Function: Handle Start Chat
async function handleStart(socket) {
  try {
    const data = readJsonFile(dataFilePath, {
      username: "",
      conversations: [],
      summary_of_past_conversations: "",
    });

    // Use the existing summary from appData.json
    const existingSummary = data.summary_of_past_conversations;

    // Determine the initial prompt
    const initialPrompt = existingSummary
      ? `Based on this summary of past conversations: "${existingSummary}", start a new conversation with the user. 
         Be engaging and empathetic. Don't talk in the third person; use "you" or "your" when referring to the user.`
      : `No prior summary is available. Start a new conversation by asking the user about their current life, such as their emotional state, daily challenges, or things they've been experiencing recently. 
         Be empathetic and engaging. Avoid referencing any past conversations.`;

    // Generate the initial response from ChatGPT
    const response = await chatWithGPT(initialPrompt);

    // Add a new conversation entry
    const newConversation = {
      chat: [],
      finalScores: {},
      generalMoodScore: 0,
    };
    data.conversations.push(newConversation);
    writeJsonFile(dataFilePath, data);

    // Send the assistant's first message
    socket.emit("message", { role: "assistant", content: response });
  } catch (error) {
    console.error("Error starting chat:", error.message);
    socket.emit("error", "Failed to start chat.");
  }
}

// Function: Handle Chat Message
async function handleChat(socket, userMessage) {
  try {
    const data = readJsonFile(dataFilePath, { conversations: [] });
    const currentConversation =
      data.conversations[data.conversations.length - 1];

    if (!currentConversation) {
      socket.emit("error", "No active conversation.");
      return;
    }

    currentConversation.chat.push({ role: "user", content: userMessage });

    const context = currentConversation.chat
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n");

    const response = await chatWithGPT(
      `Continue the conversation with this context:\n${context}\nUser: ${userMessage}. Don't offer general tips on how to handle the situation, just keep asking more detailed questions about how they're coping with the current situation.`
    );

    currentConversation.chat.push({ role: "assistant", content: response });
    writeJsonFile(dataFilePath, data);

    socket.emit("message", { role: "assistant", content: response });
  } catch (error) {
    console.error("Error processing chat:", error.message);
    socket.emit("error", "Failed to process chat.");
  }
}

// Function: Handle End Chat
async function handleEnd(socket) {
  try {
    const data = readJsonFile(dataFilePath, {
      conversations: [],
      summary_of_past_conversations: "",
    });

    const currentConversation =
      data.conversations[data.conversations.length - 1];

    if (!currentConversation) {
      socket.emit("error", "No active conversation.");
      return;
    }

    // Step 1: Analyze the current conversation
    const analysisPrompt = `Analyze the following conversation and provide scores for symptoms and general mood according to the JSON schema, if the user didnt mention one of the problems there PUT ZERO DONT INVENT STUFF. This is the conversation:\n${JSON.stringify(
      currentConversation.chat
    )}`;

    const analysis = await chatWithGPT(analysisPrompt, scoresSchema);

    currentConversation.finalScores = analysis.finalScores || {};
    currentConversation.generalMoodScore = analysis.generalMoodScore || null;

    // Step 2: Generate an updated summary
    const previousSummary = data.summary_of_past_conversations;
    const currentChatText = currentConversation.chat
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    const summaryPrompt = `You are summarizing conversations. The previous summary is: "${previousSummary}". 
    The current conversation is: \n${currentChatText}.
    Write a concise summary for the current conversation and combine it with the previous summary to create an updated summary.`;

    const newSummary = await chatWithGPT(summaryPrompt, summarySchema);

    // Update the summary_of_past_conversations in the appData.json
    data.summary_of_past_conversations =
      newSummary.summary || "No conversations to summarize.";

    // Step 3: Save the updated data back to appData.json
    writeJsonFile(dataFilePath, data);

    // Notify the user that the conversation has ended and saved
    socket.emit(
      "endChatConfirmation",
      "Conversation ended, analyzed, and saved."
    );
  } catch (error) {
    console.error("Error ending chat:", error.message);
    socket.emit("error", "Failed to end chat.");
  }
}

// Helper: Chat with GPT
async function chatWithGPT(prompt, schema = null) {
  try {
    const requestPayload = {
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 1500,
    };

    if (schema) {
      requestPayload.response_format = {
        type: "json_schema",
        json_schema: {
          name: schema.name,
          schema: schema.schema,
        },
      };
    }

    const completion = await openai.chat.completions.create(requestPayload);
    const content = completion.choices[0].message.content;

    return schema ? JSON.parse(content) : content.trim();
  } catch (error) {
    console.error("Error communicating with ChatGPT:", error.message);
    throw new Error("ChatGPT request failed.");
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
