import OpenAI from "openai";

export default function getMagicBall(apiKey: string) {
    const client = new OpenAI({
        apiKey: apiKey,
    });
    return {
         askForIntention: async (input: string) => await client.chat.completions.create({
             messages: [{ role: 'user', content: `
                Classify the input text into one of these topics:
                - Add a completely new article
                - Expand an existing article with new thoughts
                Put only a topic name in the output.
                
                Input: "${input}"
                Output:`
             }],
             model: 'gpt-4o-mini',
         }),
    };
}
