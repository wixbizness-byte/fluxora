"use client";

import { useEffect, useState, type FormEvent } from "react";
import styles from "./community-profile-portal.module.css";

type CommunityProfile = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  websiteUrl: string;
  socialUrl: string;
  isVerified: boolean;
};

type Submission = {
  id: number;
  slug: string;
  title: string;
  previewUrl: string;
  mediaType: "Image" | "Video";
  state: "pending" | "published" | "rejected";
  rejectionReason: string;
  submittedAt: string;
};

type ProfileResponse = {
  profile?: CommunityProfile;
  submissions?: Submission[];
  message?: string;
  error?: string;
};

export default function CommunityProfilePortal() {
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("submitted")) setNotice("Prompt submitted for review.");
    if (params.get("saved")) setNotice("Profile updated.");
    if (params.get("error")) setError(params.get("error") || "Could not update your profile.");
    const response = await fetch("/prompts/api/community-profile", {
      cache: "no-store",
      credentials: "include",
    });
    const body = await response.json().catch(() => ({})) as ProfileResponse;
    if (response.status === 401) {
      setProfile(null);
      setLoading(false);
      return;
    }
    if (!response.ok || !body.profile) {
      throw new Error(body.error || "Could not load your community profile.");
    }
    setProfile(body.profile);
    setSubmissions(body.submissions || []);
    setLoading(false);
  }

  useEffect(() => {
    Promise.resolve().then(load).catch((reason) => {
      setError(reason instanceof Error ? reason.message : "Could not load your community profile.");
      setLoading(false);
    });
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/prompts/api/community-profile", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: form.get("display_name"),
        username: form.get("username"),
        bio: form.get("bio"),
        avatar_url: form.get("avatar_url"),
        website_url: form.get("website_url"),
        social_url: form.get("social_url"),
      }),
    });
    const body = await response.json().catch(() => ({})) as ProfileResponse;
    if (!response.ok || !body.profile) {
      setError(body.error || "Could not update your profile.");
      setSaving(false);
      return;
    }
    setProfile(body.profile);
    setNotice(body.message || "Profile updated.");
    setSaving(false);
  }

  if (loading) {
    return <section className={styles.shell}><div className={styles.loading}>Loading your creator profile…</div></section>;
  }
  if (!profile) {
    return error ? <section className={styles.shell}><div className={styles.error}>{error}</div></section> : null;
  }

  return (
    <section className={styles.shell} aria-labelledby="creator-profile-heading">
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Fluxora creator profile</p>
          <h1 id="creator-profile-heading">{profile.displayName}</h1>
          <p>{profile.email}</p>
        </div>
        <div className={styles.headerActions}>
          <a href={`/prompts/u/${encodeURIComponent(profile.username)}`}>View public profile</a>
          <a href="/prompts/submit">Submit a prompt</a>
        </div>
      </header>

      {(notice || error) && <div className={error ? styles.error : styles.notice} role={error ? "alert" : "status"}>{error || notice}</div>}

      <form className={styles.form} onSubmit={save}>
        <label><span>Display name *</span><input name="display_name" required maxLength={60} defaultValue={profile.displayName} /></label>
        <label><span>Username *</span><input name="username" required minLength={3} maxLength={31} pattern="[a-z0-9_-]+" defaultValue={profile.username} /></label>
        <label className={styles.full}><span>Bio</span><textarea name="bio" rows={4} maxLength={280} defaultValue={profile.bio} /></label>
        <label className={styles.full}><span>Avatar URL</span><input name="avatar_url" type="url" maxLength={500} defaultValue={profile.avatarUrl} placeholder="https://..." /></label>
        <label><span>Website</span><input name="website_url" type="url" maxLength={500} defaultValue={profile.websiteUrl} /></label>
        <label><span>Social link</span><input name="social_url" type="url" maxLength={500} defaultValue={profile.socialUrl} /></label>
        <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Profile"}</button>
      </form>

      <section className={styles.submissions}>
        <div className={styles.submissionHeading}>
          <div><p className={styles.kicker}>Your submissions</p><h2>Review status</h2></div>
          <a href="/prompts/submit">New submission</a>
        </div>
        {submissions.length ? <div className={styles.submissionList}>{submissions.map((submission) => (
          <article key={submission.id}>
            {submission.previewUrl && (submission.mediaType === "Video"
              ? <video src={submission.previewUrl} muted playsInline preload="metadata" />
              : <img src={submission.previewUrl} alt="" loading="lazy" />)}
            <div>
              <h3>{submission.title}</h3>
              <span className={`${styles.state} ${styles[submission.state]}`}>{submission.state}</span>
              {submission.rejectionReason && <p><strong>Reviewer note:</strong> {submission.rejectionReason}</p>}
              {submission.state === "published" && <a href={`/prompts/prompt/${encodeURIComponent(submission.slug)}`}>Open published prompt</a>}
            </div>
          </article>
        ))}</div> : <div className={styles.empty}>No submissions yet.</div>}
      </section>
    </section>
  );
}
