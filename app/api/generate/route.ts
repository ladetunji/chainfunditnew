import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { prompt, length } = await req.json();
    if (!prompt || !length) {
      return NextResponse.json({ error: "Missing prompt or length" }, { status: 400 });
    }

    const wordLimit = length === "short" ? 50 : length === "medium" ? 100 : 200;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that writes inspiring campaign stories for fundraising.`,
        },
        {
          role: "user",
          content: `Write a ${length} fundraiser story (max ${wordLimit} words) about: ${prompt}`,
        },
      ],
    });
    console.log("OpenAI response:", completion);

    const generated = completion.choices[0]?.message?.content;
    return NextResponse.json({ generated });
  } catch (err) {
    console.error("Error generating story:", err);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}