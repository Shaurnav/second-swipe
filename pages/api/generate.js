import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.KEYREMOVED,
});
const openai = new OpenAIApi(configuration);

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured, please follow instructions in README.md",
      }
    });
    return;
  }

  const condition = req.body.condition || '';
  if (condition.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please enter a valid condition",
      }
    });
    return;
  }

  try {
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: generatePrompt(condition),
      temperature: 0.6,
    });
    res.status(200).json({ result: completion.data.choices[0].text });
  } catch(error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: 'An error occurred during your request.',
        }
      });
    }
  }
}

function generatePrompt(category, condition, price) {
  return `I want to resell a product in the ${category} that is in ${condition} condition. I originally bought it for ${price}. 
  I should resell it for $`;
}
