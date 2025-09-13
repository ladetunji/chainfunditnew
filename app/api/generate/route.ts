import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt, length } = await req.json();

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "chainfundit-campaign",
      },
      body: JSON.stringify({
        model: "openrouter/horizon-alpha",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that helps users write compelling fundraising campaign stories.",
          },
          {
            role: "user",
            content: `Write a ${length} fundraising campaign story based on this prompt: ${prompt}`,
          },
        ],
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("❌ OpenRouter error:", err);
    return NextResponse.json({ error: "Failed to fetch story" }, { status: 500 });
  }
}