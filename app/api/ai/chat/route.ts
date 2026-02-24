import { NextRequest, NextResponse } from "next/server";
import { buildPageAwareSystemPrompt } from "@/lib/ai/pageAwareSystemPrompt";

export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

interface ChatRequestBody {
  messages: ChatMessage[];
  context: unknown;
  pathname?: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key configuration error" },
      { status: 500 },
    );
  }

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { messages, context, pathname } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "Messages array is required" },
      { status: 400 },
    );
  }

  const systemPrompt = buildPageAwareSystemPrompt(context, pathname ?? "");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (res.status === 401) {
      return NextResponse.json(
        { error: "API key configuration error" },
        { status: 401 },
      );
    }

    if (res.status === 429) {
      return NextResponse.json(
        {
          error:
            "I'm receiving too many requests, please wait a moment and try again",
        },
        { status: 429 },
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "Something went wrong, please try again" },
        { status: res.status },
      );
    }

    const json = (await res.json()) as any;
    const text: string | undefined =
      json?.choices?.[0]?.message?.content ??
      (Array.isArray(json?.choices?.[0]?.message?.content)
        ? json.choices[0].message.content
            .map((c: any) => c?.text ?? "")
            .join("")
        : undefined);

    if (!text) {
      return NextResponse.json(
        { error: "Empty response from OpenAI" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error("AI chat route error:", error);
    return NextResponse.json(
      { error: "Something went wrong, please try again" },
      { status: 500 },
    );
  }
}

