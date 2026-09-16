import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type QuestionRow = {
  id: string;
  question_key: string;
  position: number;
  question: string;
  helper_text: string;
  why_text: string;
  question_type: "single" | "multi" | "text";
  required: boolean;
  max_selections: number | null;
};

type OptionRow = {
  id: string;
  question_id: string;
  value: string;
  label: string;
  description: string;
  icon_key: string;
  position: number;
};

function config() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || "",
    key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "",
  };
}

async function supabaseGet<T>(path: string): Promise<T> {
  const { url, key } = config();
  if (!url || !key) throw new Error("Supabase is not configured.");

  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export async function GET() {
  try {
    const questions = await supabaseGet<QuestionRow[]>(
      "start_questions?select=id,question_key,position,question,helper_text,why_text,question_type,required,max_selections&is_active=eq.true&order=position.asc,created_at.asc",
    );

    const ids = questions.map((question) => question.id);
    const options = ids.length
      ? await supabaseGet<OptionRow[]>(
          `start_question_options?select=id,question_id,value,label,description,icon_key,position&is_active=eq.true&question_id=in.(${ids.join(",")})&order=position.asc,created_at.asc`,
        )
      : [];

    return NextResponse.json({
      version: 1,
      maxQuestions: 10,
      questions: questions.map((question) => ({
        id: question.question_key,
        position: question.position,
        question: question.question,
        helperText: question.helper_text,
        whyText: question.why_text,
        type: question.question_type,
        required: question.required,
        maxSelections: question.max_selections,
        options: options
          .filter((option) => option.question_id === question.id)
          .map((option) => ({
            value: option.value,
            label: option.label,
            description: option.description,
            icon: option.icon_key,
            position: option.position,
          })),
      })),
    });
  } catch (error) {
    console.error("start config failed", error);
    return NextResponse.json({ error: "Unable to load onboarding config." }, { status: 503 });
  }
}
