import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function suggestAltText(
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system:
      "You are an accessibility expert. Generate a concise, descriptive alt text for this image as it would appear in a PDF document. Focus on conveying the meaningful content of the image. Be specific but brief (1-2 sentences maximum). Do not start with 'Image of' or 'Picture of'.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as
                | "image/jpeg"
                | "image/png"
                | "image/gif"
                | "image/webp",
              data: imageBase64,
            },
          },
          { type: "text", text: "Please provide alt text for this image." },
        ],
      },
    ],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from API");
  return block.text.trim();
}
