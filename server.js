require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai"); // Correct import

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Correct OpenAI setup
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/strategy", async (req, res) => {
  try {
    const { game, situation } = req.body;
    const prompt = `Provide a detailed strategy for ${game} in this situation: ${situation}.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ strategy: response.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

