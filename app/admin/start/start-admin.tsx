"use client";

import { useEffect, useMemo, useState } from "react";
import {
  deleteRow,
  getSession,
  insertRow,
  queryOne,
  queryRows,
  updateRow,
  upsertRow,
} from "../../lib/supabase";
import styles from "./start-admin.module.css";

type QuestionType = "single" | "multi" | "text";

type QuestionRow = {
  id: string;
  question_key: string;
  position: number;
  question: string;
  helper_text: string;
  why_text: string;
  question_type: QuestionType;
  required: boolean;
  max_selections: number | null;
  is_active: boolean;
};

type OptionRow = {
  id: string;
  question_id: string;
  value: string;
  label: string;
  description: string;
  icon_key: string;
  position: number;
  is_active: boolean;
};

type ToolRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  image_url: string | null;
  access_level: "All" | "Premium" | "Creator";
  tool_type: "Tool" | "CustomGPT" | "Workflow";
  status: string;
  sort_order: number;
};

type RecommendationRow = {
  tool_id: string;
  enabled: boolean;
  guidance: string;
};

const MAX_QUESTIONS = 10;

function makeTempId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export default function StartAdminClient() {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<"questions" | "tools">("questions");
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [tools, setTools] = useState<ToolRow[]>([]);
  const [recommendations, setRecommendations] = useState<Record<string, RecommendationRow>>({});
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const session = await getSession();
      if (!session) {
        if (!cancelled) setChecking(false);
        return;
      }

      const admin = await queryOne<{ user_id: string }>(
        "site_admins",
        `select=user_id&user_id=eq.${encodeURIComponent(session.user.id)}`,
        true,
      );

      if (cancelled) return;
      if (!admin.data || admin.error) {
        setChecking(false);
        return;
      }

      setIsAdmin(true);
      setChecking(false);
    }

    boot().catch((error) => {
      if (!cancelled) {
        setNotice(error instanceof Error ? error.message : "Unable to verify admin access.");
        setChecking(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function loadAll() {
    setNotice("Loading Start configuration…");

    const [questionResult, optionResult, toolResult, recResult] = await Promise.all([
      queryRows<QuestionRow>("start_questions", "select=*&order=position.asc,created_at.asc", true),
      queryRows<OptionRow>("start_question_options", "select=*&order=question_id.asc,position.asc,created_at.asc", true),
      queryRows<ToolRow>(
        "tools",
        "select=id,slug,title,short_description,image_url,access_level,tool_type,status,sort_order&status=eq.active&order=sort_order.asc,title.asc",
        true,
      ),
      queryRows<RecommendationRow>("start_recommendable_tools", "select=tool_id,enabled,guidance", true),
    ]);

    const error = questionResult.error || optionResult.error || toolResult.error || recResult.error;
    if (error) {
      setNotice(error.message);
      return;
    }

    setQuestions(questionResult.data || []);
    setOptions(optionResult.data || []);
    setTools(toolResult.data || []);
    setRecommendations(
      Object.fromEntries((recResult.data || []).map((row) => [row.tool_id, row])),
    );
    setNotice("Start configuration loaded.");
  }

  const activeCount = useMemo(
    () => questions.filter((question) => question.is_active).length,
    [questions],
  );

  function patchQuestion(id: string, patch: Partial<QuestionRow>) {
    setQuestions((current) =>
      current.map((question) => (question.id === id ? { ...question, ...patch } : question)),
    );
  }

  function patchOption(id: string, patch: Partial<OptionRow>) {
    setOptions((current) =>
      current.map((option) => (option.id === id ? { ...option, ...patch } : option)),
    );
  }

  function addQuestion() {
    if (questions.length >= MAX_QUESTIONS) {
      setNotice(`Fluxora Start is limited to ${MAX_QUESTIONS} questions.`);
      return;
    }

    const nextPosition = Math.min(
      MAX_QUESTIONS,
      questions.reduce((max, item) => Math.max(max, Number(item.position) || 0), 0) + 1,
    );

    const id = makeTempId("new-question");
    setQuestions((current) => [
      ...current,
      {
        id,
        question_key: `question_${nextPosition}`,
        position: nextPosition,
        question: "New onboarding question",
        helper_text: "",
        why_text: "",
        question_type: "single",
        required: true,
        max_selections: null,
        is_active: false,
      },
    ]);
    setNotice("New question added as a draft. Save it before adding answers.");
  }

  async function saveQuestion(question: QuestionRow) {
    setBusy(question.id);
    setNotice("Saving question…");

    const payload = {
      question_key: slugify(question.question_key) || `question_${question.position}`,
      position: Math.max(1, Math.min(MAX_QUESTIONS, Number(question.position) || 1)),
      question: question.question.trim(),
      helper_text: question.helper_text.trim(),
      why_text: question.why_text.trim(),
      question_type: question.question_type,
      required: question.required,
      max_selections:
        question.question_type === "multi"
          ? Math.max(1, Math.min(10, Number(question.max_selections) || 2))
          : null,
      is_active: question.is_active,
    };

    if (!payload.question) {
      setNotice("Question text is required.");
      setBusy("");
      return;
    }

    const result = question.id.startsWith("new-question-")
      ? await insertRow<QuestionRow>("start_questions", payload)
      : await updateRow<QuestionRow>("start_questions", question.id, payload);

    if (result.error || !result.data) {
      setNotice(result.error?.message || "Question could not be saved.");
      setBusy("");
      return;
    }

    setQuestions((current) =>
      current.map((item) => (item.id === question.id ? result.data! : item)),
    );
    setNotice("Question saved.");
    setBusy("");
  }

  async function removeQuestion(question: QuestionRow) {
    if (!confirm(`Delete “${question.question}”? Its answers will also be deleted.`)) return;

    if (question.id.startsWith("new-question-")) {
      setQuestions((current) => current.filter((item) => item.id !== question.id));
      return;
    }

    setBusy(question.id);
    const result = await deleteRow("start_questions", question.id);
    if (result.error) {
      setNotice(result.error.message);
    } else {
      setQuestions((current) => current.filter((item) => item.id !== question.id));
      setOptions((current) => current.filter((item) => item.question_id !== question.id));
      setNotice("Question deleted.");
    }
    setBusy("");
  }

  function addOption(question: QuestionRow) {
    if (question.id.startsWith("new-question-")) {
      setNotice("Save the question before adding answers.");
      return;
    }

    const current = options.filter((option) => option.question_id === question.id);
    if (current.length >= 20) {
      setNotice("A question can have at most 20 answer options.");
      return;
    }

    const position = current.reduce((max, item) => Math.max(max, item.position), 0) + 1;
    setOptions((all) => [
      ...all,
      {
        id: makeTempId("new-option"),
        question_id: question.id,
        value: `option_${position}`,
        label: "New answer",
        description: "",
        icon_key: "sparkle",
        position,
        is_active: true,
      },
    ]);
  }

  async function saveOption(option: OptionRow) {
    setBusy(option.id);
    setNotice("Saving answer…");

    const payload = {
      question_id: option.question_id,
      value: slugify(option.value) || `option_${option.position}`,
      label: option.label.trim(),
      description: option.description.trim(),
      icon_key: slugify(option.icon_key) || "sparkle",
      position: Math.max(1, Math.min(20, Number(option.position) || 1)),
      is_active: option.is_active,
    };

    if (!payload.label) {
      setNotice("Answer label is required.");
      setBusy("");
      return;
    }

    const result = option.id.startsWith("new-option-")
      ? await insertRow<OptionRow>("start_question_options", payload)
      : await updateRow<OptionRow>("start_question_options", option.id, payload);

    if (result.error || !result.data) {
      setNotice(result.error?.message || "Answer could not be saved.");
    } else {
      setOptions((current) =>
        current.map((item) => (item.id === option.id ? result.data! : item)),
      );
      setNotice("Answer saved.");
    }
    setBusy("");
  }

  async function removeOption(option: OptionRow) {
    if (!confirm(`Delete answer “${option.label}”? `)) return;

    if (option.id.startsWith("new-option-")) {
      setOptions((current) => current.filter((item) => item.id !== option.id));
      return;
    }

    setBusy(option.id);
    const result = await deleteRow("start_question_options", option.id);
    if (result.error) setNotice(result.error.message);
    else {
      setOptions((current) => current.filter((item) => item.id !== option.id));
      setNotice("Answer deleted.");
    }
    setBusy("");
  }

  function patchRecommendation(toolId: string, patch: Partial<RecommendationRow>) {
    setRecommendations((current) => ({
      ...current,
      [toolId]: {
        tool_id: toolId,
        enabled: current[toolId]?.enabled || false,
        guidance: current[toolId]?.guidance || "",
        ...patch,
      },
    }));
  }

  async function saveRecommendation(tool: ToolRow) {
    const row = recommendations[tool.id] || {
      tool_id: tool.id,
      enabled: false,
      guidance: "",
    };

    setBusy(tool.id);
    setNotice(`Saving ${tool.title}…`);
    const result = await upsertRow<RecommendationRow>(
      "start_recommendable_tools",
      {
        tool_id: tool.id,
        enabled: row.enabled,
        guidance: row.guidance.trim(),
      },
      "tool_id",
    );

    if (result.error || !result.data) {
      setNotice(result.error?.message || "Recommendation setting could not be saved.");
    } else {
      setRecommendations((current) => ({ ...current, [tool.id]: result.data! }));
      setNotice("Recommendation setting saved.");
    }
    setBusy("");
  }

  if (checking) {
    return (
      <section className={styles.stateCard}>
        <span>Protected workspace</span>
        <h1>Checking Start admin access</h1>
        <p>Verifying your Fluxora Admin session…</p>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className={styles.stateCard}>
        <span>Protected workspace</span>
        <h1>Start Admin</h1>
        <p>Sign in through the main Fluxora Admin first, then return here.</p>
        <a className={styles.primaryButton} href="/admin">Open Admin sign-in</a>
      </section>
    );
  }

  return (
    <div className={styles.workspace}>
      <header className={styles.header}>
        <div>
          <span className={styles.kicker}>Start / Onboarding</span>
          <h1>Control the Fluxora onboarding quiz.</h1>
          <p>
            Edit up to 10 questions and choose which active resources from /tools can be
            recommended. DeepSeek integration is added in Phase 2.
          </p>
        </div>
        <div className={styles.headerMeta}>
          <strong>{activeCount}</strong>
          <span>active questions</span>
        </div>
      </header>

      <nav className={styles.tabs} aria-label="Start admin sections">
        <button
          type="button"
          className={tab === "questions" ? styles.activeTab : ""}
          onClick={() => setTab("questions")}
        >
          Quiz Questions
        </button>
        <button
          type="button"
          className={tab === "tools" ? styles.activeTab : ""}
          onClick={() => setTab("tools")}
        >
          Recommendation Set
        </button>
      </nav>

      <p className={styles.notice} aria-live="polite">{notice}</p>

      {tab === "questions" ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Quiz Questions</h2>
              <p>Position controls order. Public /start receives only active questions and active answers.</p>
            </div>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={addQuestion}
              disabled={questions.length >= MAX_QUESTIONS}
            >
              Add question
            </button>
          </div>

          <div className={styles.questionList}>
            {questions
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((question) => {
                const questionOptions = options
                  .filter((option) => option.question_id === question.id)
                  .sort((a, b) => a.position - b.position);

                return (
                  <article className={styles.questionCard} key={question.id}>
                    <div className={styles.questionTop}>
                      <span>Question {question.position}</span>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={question.is_active}
                          onChange={(event) =>
                            patchQuestion(question.id, { is_active: event.target.checked })
                          }
                        />
                        Active
                      </label>
                    </div>

                    <div className={styles.grid}>
                      <label>
                        Question
                        <textarea
                          value={question.question}
                          onChange={(event) =>
                            patchQuestion(question.id, { question: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        Helper text
                        <textarea
                          value={question.helper_text}
                          onChange={(event) =>
                            patchQuestion(question.id, { helper_text: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        Why we ask
                        <textarea
                          value={question.why_text}
                          onChange={(event) =>
                            patchQuestion(question.id, { why_text: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        Question key
                        <input
                          value={question.question_key}
                          onChange={(event) =>
                            patchQuestion(question.id, { question_key: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        Type
                        <select
                          value={question.question_type}
                          onChange={(event) => {
                            const type = event.target.value as QuestionType;
                            patchQuestion(question.id, {
                              question_type: type,
                              max_selections: type === "multi" ? question.max_selections || 2 : null,
                            });
                          }}
                        >
                          <option value="single">Single choice</option>
                          <option value="multi">Multi choice</option>
                          <option value="text">Free text</option>
                        </select>
                      </label>
                      <label>
                        Position
                        <input
                          type="number"
                          min={1}
                          max={MAX_QUESTIONS}
                          value={question.position}
                          onChange={(event) =>
                            patchQuestion(question.id, { position: Number(event.target.value) })
                          }
                        />
                      </label>
                      {question.question_type === "multi" && (
                        <label>
                          Max selections
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={question.max_selections || 2}
                            onChange={(event) =>
                              patchQuestion(question.id, {
                                max_selections: Number(event.target.value),
                              })
                            }
                          />
                        </label>
                      )}
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(event) =>
                            patchQuestion(question.id, { required: event.target.checked })
                          }
                        />
                        Required
                      </label>
                    </div>

                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        disabled={busy === question.id}
                        onClick={() => void saveQuestion(question)}
                      >
                        Save question
                      </button>
                      <button
                        type="button"
                        className={styles.dangerButton}
                        disabled={busy === question.id}
                        onClick={() => void removeQuestion(question)}
                      >
                        Delete
                      </button>
                    </div>

                    {question.question_type !== "text" && (
                      <div className={styles.answers}>
                        <div className={styles.answersHeader}>
                          <div>
                            <strong>Answers</strong>
                            <span>{questionOptions.length} configured</span>
                          </div>
                          <button
                            type="button"
                            className={styles.secondaryButton}
                            onClick={() => addOption(question)}
                          >
                            Add answer
                          </button>
                        </div>

                        {questionOptions.map((option) => (
                          <div className={styles.answerRow} key={option.id}>
                            <input
                              aria-label="Answer label"
                              value={option.label}
                              onChange={(event) =>
                                patchOption(option.id, { label: event.target.value })
                              }
                              placeholder="Answer label"
                            />
                            <input
                              aria-label="Answer value"
                              value={option.value}
                              onChange={(event) =>
                                patchOption(option.id, { value: event.target.value })
                              }
                              placeholder="answer_value"
                            />
                            <input
                              aria-label="Description"
                              value={option.description}
                              onChange={(event) =>
                                patchOption(option.id, { description: event.target.value })
                              }
                              placeholder="Short description"
                            />
                            <input
                              aria-label="Icon key"
                              value={option.icon_key}
                              onChange={(event) =>
                                patchOption(option.id, { icon_key: event.target.value })
                              }
                              placeholder="icon"
                            />
                            <input
                              className={styles.positionInput}
                              aria-label="Position"
                              type="number"
                              min={1}
                              max={20}
                              value={option.position}
                              onChange={(event) =>
                                patchOption(option.id, { position: Number(event.target.value) })
                              }
                            />
                            <label className={styles.miniToggle}>
                              <input
                                type="checkbox"
                                checked={option.is_active}
                                onChange={(event) =>
                                  patchOption(option.id, { is_active: event.target.checked })
                                }
                              />
                              On
                            </label>
                            <button
                              type="button"
                              className={styles.secondaryButton}
                              disabled={busy === option.id}
                              onClick={() => void saveOption(option)}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className={styles.deleteIcon}
                              aria-label={`Delete ${option.label}`}
                              disabled={busy === option.id}
                              onClick={() => void removeOption(option)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
          </div>
        </section>
      ) : (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Recommendation Set</h2>
              <p>
                Only enabled resources are eligible for DeepSeek to choose in Phase 2.
                Names, links, images, access tiers, and status still come from the real /tools catalog.
              </p>
            </div>
            <span className={styles.countPill}>
              {Object.values(recommendations).filter((item) => item.enabled).length} enabled
            </span>
          </div>

          <div className={styles.toolGrid}>
            {tools.map((tool) => {
              const row = recommendations[tool.id] || {
                tool_id: tool.id,
                enabled: false,
                guidance: "",
              };

              return (
                <article className={styles.toolCard} key={tool.id}>
                  <div className={styles.toolHeading}>
                    <div>
                      <span>{tool.tool_type} · {tool.access_level}</span>
                      <h3>{tool.title}</h3>
                      <p>{tool.short_description || tool.slug}</p>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={(event) =>
                          patchRecommendation(tool.id, { enabled: event.target.checked })
                        }
                      />
                      Eligible
                    </label>
                  </div>
                  <label>
                    AI recommendation guidance
                    <textarea
                      value={row.guidance}
                      maxLength={1200}
                      onChange={(event) =>
                        patchRecommendation(tool.id, { guidance: event.target.value })
                      }
                      placeholder="Explain when DeepSeek should consider this resource."
                    />
                  </label>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    disabled={busy === tool.id}
                    onClick={() => void saveRecommendation(tool)}
                  >
                    Save recommendation setting
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
