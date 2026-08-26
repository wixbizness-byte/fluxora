"use client";

import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
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
  showProgressionPublic: boolean;
  showInProgressionLeaderboard: boolean;
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

type AuthorizationResponse = {
  uploadUrl?: string;
  token?: string;
  error?: string;
};

type UploadResponse = {
  url?: string;
  error?: string;
};

const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const AVATAR_LIMIT = 5 * 1024 * 1024;

export default function CommunityProfilePortal() {
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [draggingAvatar, setDraggingAvatar] = useState(false);
  const avatarInput = useRef<HTMLInputElement | null>(null);

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
    setAvatarUrl(body.profile.avatarUrl || "");
    setSubmissions(body.submissions || []);
    setLoading(false);
  }

  useEffect(() => {
    Promise.resolve().then(load).catch((reason) => {
      setError(reason instanceof Error ? reason.message : "Could not load your community profile.");
      setLoading(false);
    });
  }, []);

  async function uploadAvatar(file: File) {
    setAvatarError("");
    if (!AVATAR_TYPES.has(file.type)) {
      setAvatarError("Choose a JPEG, PNG, WebP, or AVIF image.");
      return;
    }
    if (file.size <= 0 || file.size > AVATAR_LIMIT) {
      setAvatarError("Avatar images must be 5 MB or smaller.");
      return;
    }

    setAvatarUploading(true);
    try {
      const authorizationResponse = await fetch("/prompts/api/media-upload/authorize", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          contentType: file.type,
          size: file.size,
          kind: "avatar",
        }),
      });
      const authorization = await authorizationResponse.json().catch(() => ({})) as AuthorizationResponse;
      if (!authorizationResponse.ok || !authorization.uploadUrl || !authorization.token) {
        throw new Error(authorization.error || "Could not authorize the avatar upload.");
      }

      const uploadResponse = await fetch(authorization.uploadUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authorization.token}`,
          "Content-Type": file.type,
        },
        body: file,
      });
      const uploaded = await uploadResponse.json().catch(() => ({})) as UploadResponse;
      if (!uploadResponse.ok || !uploaded.url) {
        throw new Error(uploaded.error || "The avatar upload failed.");
      }
      setAvatarUrl(uploaded.url);
      setNotice("Avatar uploaded. Save your profile to apply it.");
    } catch (reason) {
      setAvatarError(reason instanceof Error ? reason.message : "The avatar upload failed. Try again.");
    } finally {
      setAvatarUploading(false);
      if (avatarInput.current) avatarInput.current.value = "";
    }
  }

  function chooseAvatar(file: File | undefined) {
    if (file) void uploadAvatar(file);
  }

  function dropAvatar(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDraggingAvatar(false);
    if (!avatarUploading) chooseAvatar(event.dataTransfer.files?.[0]);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (avatarUploading) return;
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
        show_progression_public: form.get("show_progression_public") === "on",
        show_in_progression_leaderboard: form.get("show_in_progression_leaderboard") === "on",
      }),
    });
    const body = await response.json().catch(() => ({})) as ProfileResponse;
    if (!response.ok || !body.profile) {
      setError(body.error || "Could not update your profile.");
      setSaving(false);
      return;
    }
    setProfile(body.profile);
    setAvatarUrl(body.profile.avatarUrl || "");
    setNotice(body.message || "Profile updated.");
    setSaving(false);
  }

  if (loading) {
    return <section className={styles.shell}><div className={styles.loading}>Loading your creator profile…</div></section>;
  }
  if (!profile) {
    return error ? <section className={styles.shell}><div className={styles.error}>{error}</div></section> : null;
  }

  const avatarInitial = (profile.displayName || profile.username || "F").trim().charAt(0).toUpperCase() || "F";

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
          <a href="/prompts/leaderboard">Leaderboard</a>
          <a href="/prompts/submit">Submit a prompt</a>
        </div>
      </header>

      {(notice || error) && <div className={error ? styles.error : styles.notice} role={error ? "alert" : "status"}>{error || notice}</div>}

      <form key={`${profile.id}:${profile.showProgressionPublic}:${profile.showInProgressionLeaderboard}`} className={styles.form} onSubmit={save}>
        <label><span>Display name *</span><input name="display_name" required maxLength={60} defaultValue={profile.displayName} /></label>
        <label><span>Username *</span><input name="username" required minLength={3} maxLength={31} pattern="[a-z0-9_-]+" defaultValue={profile.username} /></label>
        <label className={styles.full}><span>Bio</span><textarea name="bio" rows={4} maxLength={280} defaultValue={profile.bio} /></label>

        <label className={`${styles.full} ${styles.privacyToggle}`}>
          <input name="show_progression_public" type="checkbox" defaultChecked={profile.showProgressionPublic} />
          <span>
            <strong>Show Fluxora progression publicly</strong>
            <small>Displays your level, total XP, unlocked achievement badges, longest streak, and referral rank on your public creator profile. Gmail, access details, wallet, devices, and recent activity stay private.</small>
          </span>
        </label>

        <label className={`${styles.full} ${styles.privacyToggle}`}>
          <input name="show_in_progression_leaderboard" type="checkbox" defaultChecked={profile.showInProgressionLeaderboard} />
          <span>
            <strong>Include me in community leaderboards</strong>
            <small>Separately opts your public creator identity into XP, achievement, and longest-streak rankings. This requires public progression above; turning public progression off automatically removes you from the leaderboard.</small>
          </span>
        </label>

        <div className={`${styles.avatarField} ${styles.full}`}>
          <span className={styles.avatarLabel}>Avatar</span>
          <div className={styles.avatarRow}>
            <div className={styles.avatarPreview} aria-label="Current avatar preview">
              {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{avatarInitial}</span>}
            </div>
            <div
              className={`${styles.avatarDropzone} ${draggingAvatar ? styles.dragging : ""}`}
              onDragEnter={(event) => { event.preventDefault(); if (!avatarUploading) setDraggingAvatar(true); }}
              onDragOver={(event) => { event.preventDefault(); if (!avatarUploading) setDraggingAvatar(true); }}
              onDragLeave={() => setDraggingAvatar(false)}
              onDrop={dropAvatar}
            >
              <input
                ref={avatarInput}
                className={styles.avatarFileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                disabled={avatarUploading}
                onChange={(event) => chooseAvatar(event.target.files?.[0])}
              />
              <p>{avatarUploading ? "Uploading…" : "Drop an image here or choose one."}</p>
              <small>JPEG, PNG, WebP, or AVIF · max 5 MB</small>
              <div className={styles.avatarActions}>
                <button type="button" disabled={avatarUploading} onClick={() => avatarInput.current?.click()}>
                  {avatarUrl ? "Replace" : "Choose image"}
                </button>
                {avatarUrl && <button className={styles.removeAvatar} type="button" disabled={avatarUploading} onClick={() => { setAvatarUrl(""); setAvatarError(""); }}>
                  Remove avatar
                </button>}
              </div>
              {avatarError && <p className={styles.avatarError} role="alert">{avatarError}</p>}
            </div>
          </div>
          <input name="avatar_url" type="hidden" value={avatarUrl} />
        </div>

        <button type="submit" disabled={saving || avatarUploading}>{saving ? "Saving…" : "Save Profile"}</button>
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
