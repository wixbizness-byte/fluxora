import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type QuestionRow = {
  id: string;
  question_key: string;
  question_type: "single" | "multi" | "text";
  required: boolean;
  max_selections: number | null;
};

type OptionRow = {
  question_id: string;
  value: string;
};

type ToolRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  image_url: string | null;
  redirect_url: string;
  access_level: "All" | "Premium" | "Creator";
  tool_type: "Tool" | "CustomGPT" | "Workflow";
  status: string;
};

type RecommendationRow = {
  tool_id: string;
  enabled: boolean;
  guidance: string;
};

type AnalyzeBody = {
  answers?: Record<string, unknown>;
};

type DeepSeekResult = {
  profile_title?: unknown;
  profile_summary?: unknown;
  recommended_tool_id?: unknown;
  recommendation_reason?: unknown;
};

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const REQUEST_TIMEOUT_MS = 10_000;

function supabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || "",
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
  };
}

async function supabaseGet<T>(path: string): Promise<T> {
  const { url, key } = supabaseConfig();
  if (!url || !key) throw new Error("Supabase is not configured.");

  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Supabase request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

function cleanString(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeAnswers(
  input: Record<string, unknown>,
  questions: QuestionRow[],
  options: OptionRow[],
) {
  const normalized: Record<string, string | string[]> = {};

  for (const question of questions) {
    const raw = input[question.question_key];

    if (question.question_type === "text") {
      const value = cleanString(raw, 500);
      if (question.required && !value) {
        throw new Error(`Missing required answer: ${question.question_key}`);
      }
      normalized[question.question_key] = value;
      continue;
    }

    const allowed = new Set(
      options
        .filter((option) => option.question_id === question.id)
        .map((option) => option.value),
    );

    if (question.question_type === "multi") {
      const values = Array.isArray(raw)
        ? raw.map((value) => cleanString(value, 80)).filter(Boolean)
        : [];

      if (question.required && values.length === 0) {
        throw new Error(`Missing required answer: ${question.question_key}`);
      }

      if (question.max_selections && values.length > question.max_selections) {
        throw new Error(`Too many selections: ${question.question_key}`);
      }

      if (values.some((value) => !allowed.has(value))) {
        throw new Error(`Invalid answer: ${question.question_key}`);
      }

      normalized[question.question_key] = [...new Set(values)];
      continue;
    }

    const value = cleanString(raw, 80);
    if (question.required && !value) {
      throw new Error(`Missing required answer: ${question.question_key}`);
    }
    if (value && !allowed.has(value)) {
      throw new Error(`Invalid answer: ${question.question_key}`);
    }
    normalized[question.question_key] = value;
  }

  return normalized;
}

function tokenize(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 3),
  );
}

function fallbackPick(
  answers: Record<string, string | string[]>,
  tools: Array<ToolRow & { guidance: string }>,
) {
  const answerText = Object.values(answers)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .join(" ");

  const answerTokens = tokenize(answerText);

  const scored = tools.map((tool) => {
    const toolTokens = tokenize(
      `${tool.slug} ${tool.title} ${tool.short_description || ""} ${tool.guidance}`,
    );
    let score = 0;
    answerTokens.forEach((token) => {
      if (toolTokens.has(token)) score += 1;
    });

    const niche = String(answers.niche || "");
    const goal = String(answers.goal || "");
    if ((goal === "affiliate" || niche === "product") && tool.slug.includes("affiliate")) score += 8;
    if (niche === "drama" && tool.slug.includes("drama")) score += 8;
    if (niche === "fashion" && tool.slug.includes("fashion")) score += 8;
    if (niche === "skincare" && tool.slug.includes("skincare")) score += 8;
    if (niche === "automotive" && tool.slug.includes("automotive")) score += 8;

    return { tool, score };
  });

  scored.sort((a, b) => b.score - a.score || a.tool.title.localeCompare(b.tool.title));
  return scored[0]?.tool || tools[0];
}

function resultPayload(
  tool: ToolRow & { guidance: string },
  profileTitle: string,
  profileSummary: string,
  reason: string,
  source: "deepseek" | "fallback",
) {
  return {
    source,
    profile: {
      title: profileTitle,
      summary: profileSummary,
    },
    recommendation: {
      id: tool.id,
      slug: tool.slug,
      name: tool.title,
      description: tool.short_description || "",
      imageUrl: tool.image_url || "",
      url: tool.redirect_url,
      access: tool.access_level,
      type: tool.tool_type,
      reason,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalyzeBody;
    const rawAnswers =
      body.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
        ? body.answers
        : null;

    if (!rawAnswers) {
      return NextResponse.json({ error: "answers is required." }, { status: 400 });
    }

    const [questions, options, recommendationRows, toolRows] = await Promise.all([
      supabaseGet<QuestionRow[]>(
        "start_questions?select=id,question_key,question_type,required,max_selections&is_active=eq.true&order=position.asc",
      ),
      supabaseGet<OptionRow[]>(
        "start_question_options?select=question_id,value&is_active=eq.true",
      ),
      supabaseGet<RecommendationRow[]>(
        "start_recommendable_tools?select=tool_id,enabled,guidance&enabled=eq.true",
      ),
      supabaseGet<ToolRow[]>(
        "tools?select=id,slug,title,short_description,image_url,redirect_url,access_level,tool_type,status&status=eq.active",
      ),
    ]);

    const answers = normalizeAnswers(rawAnswers, questions, options);
    const recommendationById = new Map(
      recommendationRows.map((row) => [row.tool_id, row]),
    );

    const allowedTools = toolRows
      .filter((tool) => recommendationById.has(tool.id))
      .map((tool) => ({
        ...tool,
        guidance: recommendationById.get(tool.id)?.guidance || "",
      }));

    if (allowedTools.length === 0) {
      return NextResponse.json(
        { error: "No onboarding recommendations are currently enabled." },
        { status: 503 },
      );
    }

    const fallbackTool = fallbackPick(answers, allowedTools);
    if (!fallbackTool) {
      return NextResponse.json({ error: "No recommendation available." }, { status: 503 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY || "";
    const model = process.env.DEEPSEEK_MODEL || "deepseek-flash";

    if (!apiKey) {
      return NextResponse.json(
        resultPayload(
          fallbackTool,
          "Your Fluxora creator profile",
          "Fluxora matched your answers to an approved starting point.",
          fallbackTool.guidance ||
            "This resource best matches the answers you selected in the onboarding quiz.",
          "fallback",
        ),
      );
    }

    const allowedCatalog = allowedTools.map((tool) => ({
      id: tool.id,
      slug: tool.slug,
      name: tool.title,
      type: tool.tool_type,
      access: tool.access_level,
      description: tool.short_description || "",
      guidance: tool.guidance,
    }));

    const systemPrompt = [
      "You are Fluxora's onboarding router.",
      "Return ONLY valid JSON.",
      "Choose exactly one recommended_tool_id from the supplied available_recommendations array.",
      "Never invent tools, IDs, URLs, access levels, or product names.",
      "Use the quiz answers and optional free text to identify the shortest useful starting point.",
      "Keep profile_title under 60 characters.",
      "Keep profile_summary under 260 characters.",
      "Keep recommendation_reason under 320 characters.",
      'JSON shape: {"profile_title":"...","profile_summary":"...","recommended_tool_id":"uuid-from-list","recommendation_reason":"..."}',
    ].join("\n");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(DEEPSEEK_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: JSON.stringify({
                answers,
                available_recommendations: allowedCatalog,
              }),
            },
          ],
          response_format: { type: "json_object" },
          reasoning_effort: "low",
          temperature: 0.2,
          max_tokens: 500,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`DeepSeek failed (${response.status})`);

      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) {
        throw new Error("DeepSeek returned an empty response.");
      }

      const parsed = JSON.parse(content) as DeepSeekResult;
      const toolId = cleanString(parsed.recommended_tool_id, 80);
      const selected = allowedTools.find((tool) => tool.id === toolId);

      if (!selected) {
        throw new Error("DeepSeek returned a tool outside the allowlist.");
      }

      return NextResponse.json(
        resultPayload(
          selected,
          cleanString(parsed.profile_title, 60) || "Your Fluxora creator profile",
          cleanString(parsed.profile_summary, 260) ||
            "Fluxora matched your answers to a focused starting point.",
          cleanString(parsed.recommendation_reason, 320) ||
            selected.guidance ||
            "This resource best matches your onboarding answers.",
          "deepseek",
        ),
      );
    } catch (error) {
      console.warn("start analyzer fallback", error);
      return NextResponse.json(
        resultPayload(
          fallbackTool,
          "Your Fluxora creator profile",
          "Fluxora matched your answers to an approved starting point.",
          fallbackTool.guidance ||
            "This resource best matches the answers you selected in the onboarding quiz.",
          "fallback",
        ),
      );
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid onboarding request.";
    const status =
      message.startsWith("Missing required") ||
      message.startsWith("Invalid answer") ||
      message.startsWith("Too many selections")
        ? 400
        : 500;

    console.error("start analyze failed", error);
    return NextResponse.json(
      { error: status === 400 ? message : "Unable to analyze onboarding answers." },
      { status },
    );
  }
}
