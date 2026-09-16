import { createHash, createHmac, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type QuestionRow = {
  id: string;
  question_key: string;
  question: string;
  question_type: "single" | "multi" | "text";
  required: boolean;
  max_selections: number | null;
};

type OptionRow = {
  question_id: string;
  value: string;
  label: string;
  description: string;
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

type ResultPayload = ReturnType<typeof resultPayload>;

type CachedResult = {
  expiresAt: number;
  value: ResultPayload;
};

type RateLimitResult = {
  allowed?: boolean;
};

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const REQUEST_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 30 * 60 * 1000;
const SESSION_COOKIE = "fluxora_start_session";

const globalCache = globalThis as typeof globalThis & {
  __fluxoraStartAnalysisCache?: Map<string, CachedResult>;
};

const analysisCache =
  globalCache.__fluxoraStartAnalysisCache ||
  (globalCache.__fluxoraStartAnalysisCache = new Map<string, CachedResult>());

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

async function supabaseRpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { url, key } = supabaseConfig();
  if (!url || !key) throw new Error("Supabase is not configured.");

  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Supabase RPC failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

function cleanString(value: unknown, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function validSessionToken(value: string) {
  return /^[a-zA-Z0-9_-]{16,100}$/.test(value);
}

function requestIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const first = forwarded.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip") || "unknown";
}

function hmac(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function attachSessionCookie(
  response: NextResponse,
  token: string,
  shouldSet: boolean,
) {
  if (shouldSet) {
    response.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });
  }
  return response;
}

async function consumeRateLimit(
  request: NextRequest,
  sessionToken: string,
) {
  const secret = process.env.START_RATE_LIMIT_SECRET || "";
  if (!secret) return { allowed: true };

  const sessionHash = hmac(`session:${sessionToken}`, secret);
  const ipHash = hmac(`ip:${requestIp(request)}`, secret);

  try {
    return await supabaseRpc<RateLimitResult>("consume_start_analysis_limits", {
      p_session_hash: sessionHash,
      p_ip_hash: ipHash,
    });
  } catch (error) {
    // Do not take onboarding offline if only the limiter is unavailable.
    console.warn("start rate limiter unavailable", error);
    return { allowed: true };
  }
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

function semanticAnswers(
  answers: Record<string, string | string[]>,
  questions: QuestionRow[],
  options: OptionRow[],
) {
  return questions.map((question) => {
    const raw = answers[question.question_key];
    if (question.question_type === "text") {
      return {
        id: question.question_key,
        question: question.question,
        answer: typeof raw === "string" ? raw : "",
      };
    }

    const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const selected = values.map((value) => {
      const option = options.find(
        (candidate) =>
          candidate.question_id === question.id && candidate.value === value,
      );
      return {
        value,
        label: option?.label || value,
        description: option?.description || "",
      };
    });

    return {
      id: question.question_key,
      question: question.question,
      answer: question.question_type === "multi" ? selected : selected[0] || null,
    };
  });
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
  semantic: ReturnType<typeof semanticAnswers>,
  tools: Array<ToolRow & { guidance: string }>,
) {
  const answerText = [
    ...Object.values(answers).flatMap((value) =>
      Array.isArray(value) ? value : [value],
    ),
    JSON.stringify(semantic),
  ].join(" ");

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

  scored.sort(
    (a, b) => b.score - a.score || a.tool.title.localeCompare(b.tool.title),
  );
  return scored[0]?.tool || tools[0];
}

function resultPayload(
  tool: ToolRow & { guidance: string },
  profileTitle: string,
  profileSummary: string,
  reason: string,
  source: "deepseek" | "fallback" | "cache",
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

function hasFreeText(
  answers: Record<string, string | string[]>,
  questions: QuestionRow[],
) {
  return questions.some(
    (question) =>
      question.question_type === "text" &&
      typeof answers[question.question_key] === "string" &&
      String(answers[question.question_key]).trim().length > 0,
  );
}

function cacheKey(
  answers: Record<string, string | string[]>,
  semantic: ReturnType<typeof semanticAnswers>,
  tools: Array<ToolRow & { guidance: string }>,
  model: string,
) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        answers,
        semantic,
        model,
        tools: tools.map((tool) => ({
          id: tool.id,
          guidance: tool.guidance,
          title: tool.title,
        })),
      }),
    )
    .digest("hex");
}

function getCached(key: string) {
  const cached = analysisCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    analysisCache.delete(key);
    return null;
  }
  return cached.value;
}

function setCached(key: string, value: ResultPayload) {
  if (analysisCache.size > 300) {
    const now = Date.now();
    for (const [entryKey, entry] of analysisCache) {
      if (entry.expiresAt <= now) analysisCache.delete(entryKey);
    }
    if (analysisCache.size > 300) {
      const first = analysisCache.keys().next().value as string | undefined;
      if (first) analysisCache.delete(first);
    }
  }

  analysisCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export async function POST(request: NextRequest) {
  const existingToken = request.cookies.get(SESSION_COOKIE)?.value || "";
  const sessionToken = validSessionToken(existingToken)
    ? existingToken
    : randomUUID();
  const shouldSetCookie = sessionToken !== existingToken;

  try {
    const rate = await consumeRateLimit(request, sessionToken);
    if (rate.allowed === false) {
      const response = NextResponse.json(
        {
          error:
            "Too many onboarding analyses from this session. Please wait a few minutes and try again.",
        },
        { status: 429 },
      );
      response.headers.set("Retry-After", "600");
      return attachSessionCookie(response, sessionToken, shouldSetCookie);
    }

    const body = (await request.json()) as AnalyzeBody;
    const rawAnswers =
      body.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
        ? body.answers
        : null;

    if (!rawAnswers) {
      return attachSessionCookie(
        NextResponse.json({ error: "answers is required." }, { status: 400 }),
        sessionToken,
        shouldSetCookie,
      );
    }

    const [questions, options, recommendationRows, toolRows] = await Promise.all([
      supabaseGet<QuestionRow[]>(
        "start_questions?select=id,question_key,question,question_type,required,max_selections&is_active=eq.true&order=position.asc",
      ),
      supabaseGet<OptionRow[]>(
        "start_question_options?select=question_id,value,label,description&is_active=eq.true",
      ),
      supabaseGet<RecommendationRow[]>(
        "start_recommendable_tools?select=tool_id,enabled,guidance&enabled=eq.true",
      ),
      supabaseGet<ToolRow[]>(
        "tools?select=id,slug,title,short_description,image_url,redirect_url,access_level,tool_type,status&status=eq.active",
      ),
    ]);

    const answers = normalizeAnswers(rawAnswers, questions, options);
    const semantic = semanticAnswers(answers, questions, options);
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
      return attachSessionCookie(
        NextResponse.json(
          { error: "No onboarding recommendations are currently enabled." },
          { status: 503 },
        ),
        sessionToken,
        shouldSetCookie,
      );
    }

    const fallbackTool = fallbackPick(answers, semantic, allowedTools);
    if (!fallbackTool) {
      return attachSessionCookie(
        NextResponse.json(
          { error: "No recommendation available." },
          { status: 503 },
        ),
        sessionToken,
        shouldSetCookie,
      );
    }

    const apiKey = process.env.DEEPSEEK_API_KEY || "";
    const model = process.env.DEEPSEEK_MODEL || "deepseek-flash";
    const cacheable = !hasFreeText(answers, questions);
    const key = cacheable
      ? cacheKey(answers, semantic, allowedTools, model)
      : "";

    if (key) {
      const cached = getCached(key);
      if (cached) {
        const response = NextResponse.json({ ...cached, source: "cache" });
        return attachSessionCookie(response, sessionToken, shouldSetCookie);
      }
    }

    if (!apiKey) {
      const value = resultPayload(
        fallbackTool,
        "Your Fluxora creator profile",
        "Fluxora matched your answers to an approved starting point.",
        fallbackTool.guidance ||
          "This resource best matches the answers you selected in the onboarding quiz.",
        "fallback",
      );
      if (key) setCached(key, value);
      return attachSessionCookie(
        NextResponse.json(value),
        sessionToken,
        shouldSetCookie,
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
      "Use the supplied question text, selected answer labels/descriptions, and optional free text.",
      "Identify the shortest useful starting point for this creator.",
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
                quiz: semantic,
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

      if (!response.ok) {
        throw new Error(`DeepSeek failed (${response.status})`);
      }

      const payload = await response.json();
      const responseContent = payload?.choices?.[0]?.message?.content;
      if (typeof responseContent !== "string" || !responseContent.trim()) {
        throw new Error("DeepSeek returned an empty response.");
      }

      const parsed = JSON.parse(responseContent) as DeepSeekResult;
      const toolId = cleanString(parsed.recommended_tool_id, 80);
      const selected = allowedTools.find((tool) => tool.id === toolId);

      if (!selected) {
        throw new Error("DeepSeek returned a tool outside the allowlist.");
      }

      const value = resultPayload(
        selected,
        cleanString(parsed.profile_title, 60) || "Your Fluxora creator profile",
        cleanString(parsed.profile_summary, 260) ||
          "Fluxora matched your answers to a focused starting point.",
        cleanString(parsed.recommendation_reason, 320) ||
          selected.guidance ||
          "This resource best matches your onboarding answers.",
        "deepseek",
      );

      if (key) setCached(key, value);

      return attachSessionCookie(
        NextResponse.json(value),
        sessionToken,
        shouldSetCookie,
      );
    } catch (error) {
      console.warn("start analyzer fallback", error);

      const value = resultPayload(
        fallbackTool,
        "Your Fluxora creator profile",
        "Fluxora matched your answers to an approved starting point.",
        fallbackTool.guidance ||
          "This resource best matches the answers you selected in the onboarding quiz.",
        "fallback",
      );

      if (key) setCached(key, value);

      return attachSessionCookie(
        NextResponse.json(value),
        sessionToken,
        shouldSetCookie,
      );
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid onboarding request.";
    const status =
      message.startsWith("Missing required") ||
      message.startsWith("Invalid answer") ||
      message.startsWith("Too many selections")
        ? 400
        : 500;

    console.error("start analyze failed", error);
    return attachSessionCookie(
      NextResponse.json(
        {
          error:
            status === 400
              ? message
              : "Unable to analyze onboarding answers.",
        },
        { status },
      ),
      sessionToken,
      shouldSetCookie,
    );
  }
}
