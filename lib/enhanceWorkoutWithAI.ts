import "dotenv/config";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function enhanceWorkoutWithAI(workout: any) {
  console.log("AI LAYER CALLED");

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional strength coach. Return ONLY valid JSON. Do not include markdown or explanations.",
        },
        {
          role: "user",
          content: `
Enhance this workout.

Rules:
- Do NOT remove exercises
- Keep same IDs
- Add or improve "notes"
- Keep "superset_with" as string or null
- Return ONLY valid JSON

Workout:
${JSON.stringify(workout)}
          `.trim(),
        },
      ],
    });

    const content = res.choices?.[0]?.message?.content;

    if (!content) return workout;

    // strict cleanup (handles markdown + whitespace)
    const cleaned = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!parsed?.exercises || !Array.isArray(parsed.exercises)) {
      return workout;
    }

    return parsed;
  } catch (err) {
    console.log("AI fallback triggered:", err);
    return workout;
  }
}