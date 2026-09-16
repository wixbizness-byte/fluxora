"use client";

import {
  ArrowLeft,
  ArrowUpRight,
  Car,
  ChartNoAxesColumnIncreasing,
  Check,
  CircleHelp,
  Clock3,
  Compass,
  Droplets,
  Facebook,
  FileText,
  Film,
  Image as ImageIcon,
  Instagram,
  Layers3,
  Lightbulb,
  Music2,
  Shirt,
  ShoppingBag,
  Sparkles,
  Store,
  UserRound,
  WandSparkles,
  Wrench,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageContainer, SiteHeader } from "../components/fluxora";
import { TELEGRAM_COMMUNITY_URL } from "../lib/community-links";
import StartSilkBackdrop, { type StartFxScene } from "./start-silk-backdrop";
import styles from "./start-guide.module.css";

type QuizOption = {
  value: string;
  label: string;
  description: string;
  icon: string;
  position: number;
};

type QuizQuestion = {
  id: string;
  position: number;
  question: string;
  helperText: string;
  whyText: string;
  type: "single" | "multi" | "text";
  required: boolean;
  maxSelections: number | null;
  options: QuizOption[];
};

type QuizConfig = {
  version: number;
  maxQuestions: number;
  questions: QuizQuestion[];
};

type Recommendation = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  url: string;
  access: "All" | "Premium" | "Creator";
  type: "Tool" | "CustomGPT" | "Workflow";
  reason: string;
};

type AnalyzeResult = {
  source: "deepseek" | "fallback";
  profile: {
    title: string;
    summary: string;
  };
  recommendation: Recommendation;
};

type AnswerValue = string | string[];
type Stage = "intro" | "quiz" | "analyzing" | "results";

const ICONS: Record<string, LucideIcon> = {
  bag: ShoppingBag,
  film: Film,
  image: ImageIcon,
  compass: Compass,
  store: Store,
  shirt: Shirt,
  drop: Droplets,
  car: Car,
  sparkle: Sparkles,
  tiktok: Music2,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  help: CircleHelp,
  user: UserRound,
  wand: WandSparkles,
  chart: ChartNoAxesColumnIncreasing,
  layers: Layers3,
  bulb: Lightbulb,
  doc: FileText,
  clock: Clock3,
  wrench: Wrench,
};

const PROFILE_LABELS: Record<string, string> = {
  goal: "Goal",
  niche: "Niche",
  platform: "Platform",
  level: "Experience",
  blocker: "Main blocker",
  help: "Preferred start",
};

function iconFor(key: string) {
  return ICONS[key] || Sparkles;
}

function answerLabel(question: QuizQuestion, answer: AnswerValue | undefined) {
  if (question.type === "text") return typeof answer === "string" ? answer : "";
  if (question.type === "multi") {
    const values = Array.isArray(answer) ? answer : [];
    return values
      .map((value) => question.options.find((option) => option.value === value)?.label || value)
      .join(", ");
  }
  const value = typeof answer === "string" ? answer : "";
  return question.options.find((option) => option.value === value)?.label || value;
}

function typeLabel(type: Recommendation["type"]) {
  return type === "CustomGPT" ? "GPT" : type;
}

export default function StartGuide() {
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [configError, setConfigError] = useState("");
  const [stage, setStage] = useState<Stage>("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [quizError, setQuizError] = useState("");
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState<AnalyzeResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/start/config", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load the onboarding quiz.");
        return response.json() as Promise<QuizConfig>;
      })
      .then((data) => {
        if (!cancelled) setConfig(data);
      })
      .catch((error) => {
        if (!cancelled) {
          setConfigError(error instanceof Error ? error.message : "Unable to load the onboarding quiz.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.FluxFX?.go(stage as StartFxScene, step + 1);
    }, 0);
    window.scrollTo({ top: 0, behavior: "auto" });
    return () => window.clearTimeout(timer);
  }, [stage, step]);

  const questions = config?.questions || [];
  const current = questions[step];

  const progress = questions.length ? ((step + 1) / questions.length) * 100 : 0;

  const profileRows = useMemo(() => {
    if (!config || !result) return [];
    return config.questions
      .filter((question) => question.type !== "text" && answers[question.id])
      .slice(0, 6)
      .map((question) => ({
        key: question.id,
        label: PROFILE_LABELS[question.id] || question.question,
        value: answerLabel(question, answers[question.id]),
      }));
  }, [answers, config, result]);

  function startQuiz(reset = false) {
    if (!config || config.questions.length === 0) {
      setConfigError("No active onboarding questions are configured.");
      return;
    }
    if (reset) {
      setAnswers({});
      setResult(null);
    }
    setQuizError("");
    setStep(0);
    setStage("quiz");
  }

  function selectSingle(question: QuizQuestion, value: string) {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: value }));
    setQuizError("");
    window.FluxFX?.nudge(0.45);
  }

  function toggleMulti(question: QuizQuestion, value: string) {
    setAnswers((currentAnswers) => {
      const selected = Array.isArray(currentAnswers[question.id])
        ? (currentAnswers[question.id] as string[])
        : [];
      const exists = selected.includes(value);
      let next = exists ? selected.filter((item) => item !== value) : [...selected, value];

      if (!exists && question.maxSelections && next.length > question.maxSelections) {
        next = next.slice(0, question.maxSelections);
      }

      return { ...currentAnswers, [question.id]: next };
    });
    setQuizError("");
    window.FluxFX?.nudge(0.45);
  }

  function updateText(question: QuizQuestion, value: string) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [question.id]: value.slice(0, 500),
    }));
  }

  function canContinue(question: QuizQuestion) {
    if (!question.required) return true;
    const answer = answers[question.id];
    if (question.type === "multi") return Array.isArray(answer) && answer.length > 0;
    return typeof answer === "string" && answer.trim().length > 0;
  }

  async function continueQuiz() {
    if (!current) return;
    if (!canContinue(current)) {
      setQuizError("Choose an option to continue.");
      return;
    }

    if (step < questions.length - 1) {
      setStep((value) => value + 1);
      setQuizError("");
      return;
    }

    await analyze();
  }

  async function analyze() {
    setQuizError("");
    setStage("analyzing");
    setAnalysisStep(0);

    let interval = 0;
    const started = Date.now();
    interval = window.setInterval(() => {
      setAnalysisStep((value) => Math.min(3, value + 1));
    }, 360);

    try {
      const response = await fetch("/api/start/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to build your recommendation.");
      }

      const elapsed = Date.now() - started;
      if (elapsed < 1300) {
        await new Promise((resolve) => window.setTimeout(resolve, 1300 - elapsed));
      }

      setAnalysisStep(4);
      setResult(payload as AnalyzeResult);
      window.setTimeout(() => setStage("results"), 180);
    } catch (error) {
      setStage("quiz");
      setQuizError(
        error instanceof Error ? error.message : "Unable to build your recommendation.",
      );
    } finally {
      window.clearInterval(interval);
    }
  }

  function back() {
    if (step > 0) {
      setStep((value) => value - 1);
      setQuizError("");
    } else {
      setStage("intro");
    }
  }

  async function copyPlan() {
    if (!result) return;
    const lines = [
      "My Fluxora plan",
      ...profileRows.map((row) => `${row.label}: ${row.value}`),
      `Start with: ${result.recommendation.name}`,
      `Reason: ${result.recommendation.reason}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
    } catch {
      // Clipboard support is optional.
    }
  }

  return (
    <main className={`fluxora-theme ${styles.page}`} data-home-theme="gold">
      <StartSilkBackdrop />

      <SiteHeader
        links={[
          { href: "/tools", label: "Tools", target: "_blank" },
          { href: "/prompts", label: "Prompts", target: "_blank" },
        ]}
        cta={{
          href: TELEGRAM_COMMUNITY_URL,
          label: "Join Community",
          target: "_blank",
        }}
      />

      <div className={styles.contentLayer}>
        {stage === "intro" && (
          <section className={styles.intro}>
            <PageContainer className={styles.introInner}>
              <h1>Tell us what you want to make. We&apos;ll find your best way to grow.</h1>
              <div className={styles.introActions}>
                <button
                  className={styles.primaryButton}
                  type="button"
                  onClick={() => startQuiz(false)}
                  disabled={!config}
                >
                  {config ? "Start the quiz" : "Loading quiz…"}
                </button>
                <a
                  className={styles.ghostButton}
                  href="/tools"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Browse tools
                </a>
              </div>
              <p>Takes about a minute. No sign-up needed.</p>
              {configError && <div className={styles.errorBox}>{configError}</div>}
            </PageContainer>
          </section>
        )}

        {stage === "quiz" && current && (
          <>
            <section className={styles.quiz}>
              <div className={styles.quizTop}>
                <button className={styles.backButton} type="button" onClick={back} aria-label="Go back">
                  <ArrowLeft size={18} />
                </button>
                <div className={styles.progressTrack}>
                  <span style={{ width: `${progress}%` }} />
                </div>
                <strong>{step + 1} / {questions.length}</strong>
              </div>

              <div className={styles.questionBlock}>
                <span className={styles.eyebrow}>{PROFILE_LABELS[current.id] || "Your answer"}</span>
                <h1>{current.question}</h1>
                <p className={styles.questionHelp}>{current.helperText}</p>
                {current.whyText && (
                  <div className={styles.whyBox}>
                    <CircleHelp size={18} />
                    <p><strong>Why we ask:</strong> {current.whyText}</p>
                  </div>
                )}

                {current.type === "text" ? (
                  <div className={styles.textAreaWrap}>
                    <textarea
                      maxLength={500}
                      value={typeof answers[current.id] === "string" ? answers[current.id] as string : ""}
                      onChange={(event) => updateText(current, event.target.value)}
                      placeholder="Tell Fluxora what you are trying to make."
                    />
                    <span>
                      {typeof answers[current.id] === "string" ? (answers[current.id] as string).length : 0} / 500
                    </span>
                  </div>
                ) : (
                  <div className={styles.optionGrid}>
                    {current.options.map((option) => {
                      const Icon = iconFor(option.icon);
                      const selected =
                        current.type === "multi"
                          ? Array.isArray(answers[current.id]) &&
                            (answers[current.id] as string[]).includes(option.value)
                          : answers[current.id] === option.value;

                      return (
                        <button
                          key={option.value}
                          className={`${styles.optionCard} ${selected ? styles.optionSelected : ""}`}
                          type="button"
                          onClick={() =>
                            current.type === "multi"
                              ? toggleMulti(current, option.value)
                              : selectSingle(current, option.value)
                          }
                        >
                          <span className={styles.optionIcon}><Icon size={19} /></span>
                          <span className={styles.optionText}>
                            <strong>{option.label}</strong>
                            <small>{option.description}</small>
                          </span>
                          <span className={styles.selectionMark}>
                            {selected ? <Check size={14} /> : null}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {quizError && <p className={styles.quizError}>{quizError}</p>}
              </div>
            </section>

            <nav className={styles.quizBar} aria-label="Quiz navigation">
              <div className={styles.quizBarInner}>
                <span>{current.required ? "Choose an option to continue." : "This question is optional."}</span>
                <button className={styles.primaryButton} type="button" onClick={() => void continueQuiz()}>
                  {step === questions.length - 1 ? "Build my plan" : "Continue"}
                </button>
              </div>
            </nav>
          </>
        )}

        {stage === "analyzing" && (
          <section className={styles.analyzing} aria-live="polite">
            <h1>Building your Fluxora plan</h1>
            {[
              "Reading your answers",
              "Understanding your creator profile",
              "Matching you with Fluxora",
              "Building your recommendation",
            ].map((label, index) => (
              <div
                className={`${styles.analysisRow} ${index < analysisStep ? styles.analysisDone : ""} ${index === analysisStep ? styles.analysisActive : ""}`}
                key={label}
              >
                <span>{index < analysisStep ? <Check size={14} /> : index + 1}</span>
                {label}
              </div>
            ))}
          </section>
        )}

        {stage === "results" && result && (
          <section className={styles.results}>
            <PageContainer className={styles.resultsWrap}>
              <div className={styles.resultsHead}>
                <span className={styles.readyPill}><Check size={14} /> Your plan is ready</span>
                <h1>Start with the right tool first.</h1>
                <p>{result.profile.summary}</p>
              </div>

              <div className={styles.resultHero}>
                <aside className={styles.profileCard}>
                  <span className={styles.eyebrow}>Creator profile</span>
                  <h2>{result.profile.title}</h2>
                  <div className={styles.profileRows}>
                    {profileRows.map((row) => (
                      <div key={row.key}>
                        <span>{row.label}</span>
                        <strong>{row.value}</strong>
                      </div>
                    ))}
                  </div>
                </aside>

                <article className={styles.toolCard}>
                  <div className={styles.toolVisual}>
                    {result.recommendation.imageUrl ? (
                      <img src={result.recommendation.imageUrl} alt="" />
                    ) : (
                      <div className={styles.goldWave} aria-hidden="true" />
                    )}
                  </div>
                  <div className={styles.toolBody}>
                    <span className={styles.toolBadge}>
                      {typeLabel(result.recommendation.type)} · {result.recommendation.access}
                    </span>
                    <h2>{result.recommendation.name}</h2>
                    <p>{result.recommendation.reason}</p>
                    <a
                      className={styles.primaryButton}
                      href={result.recommendation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open recommendation <ArrowUpRight size={16} />
                    </a>
                  </div>
                </article>
              </div>

              <div className={styles.routeHeading}>
                <span className={styles.eyebrow}>Suggested order</span>
                <h2>Keep the first route simple.</h2>
                <p>Start with these three moves in this order.</p>
              </div>

              <div className={styles.routeGrid}>
                {[
                  {
                    number: "01",
                    title: result.recommendation.name,
                    copy: "Open the recommended starting point and make one test output.",
                    href: result.recommendation.url,
                    action: "Open recommendation",
                  },
                  {
                    number: "02",
                    title: "Fluxora Tools",
                    copy: "Open the wider catalog after you know what your first workflow still needs.",
                    href: "/tools",
                    action: "View tools",
                  },
                  {
                    number: "03",
                    title: "Prompt Gallery",
                    copy: "Browse supporting prompts after your main tool route is clear.",
                    href: "/prompts",
                    action: "Browse prompts",
                  },
                ].map((item) => (
                  <article className={styles.routeCard} key={item.number}>
                    <span>{item.number}</span>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                    <a href={item.href} target="_blank" rel="noopener noreferrer">
                      {item.action} <ArrowUpRight size={14} />
                    </a>
                  </article>
                ))}
              </div>

              <div className={styles.communityCard}>
                <div>
                  <span className={styles.eyebrow}>Continue with Fluxora</span>
                  <h2>Join the Fluxora community.</h2>
                  <p>Get updates, creator help, experiments, and practical feedback after you choose your starting route.</p>
                </div>
                <a
                  className={styles.primaryButton}
                  href={TELEGRAM_COMMUNITY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join Community <ArrowUpRight size={16} />
                </a>
              </div>

              <div className={styles.resultActions}>
                <button className={styles.ghostButton} type="button" onClick={() => void copyPlan()}>
                  Copy my plan
                </button>
                <button className={styles.quietButton} type="button" onClick={() => startQuiz(true)}>
                  Retake quiz
                </button>
              </div>
            </PageContainer>
          </section>
        )}
      </div>
    </main>
  );
}
