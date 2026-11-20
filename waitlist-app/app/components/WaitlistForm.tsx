"use client";

import { FormEvent, useEffect, useState } from "react";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/config";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Status = { message: string; kind: "" | "ok" | "err" };

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [honey, setHoney] = useState(""); // hidden field; real visitors never fill it
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<Status>({ message: "", kind: "" });
  const [source, setSource] = useState<string | null>(null);

  // Optional traffic source, e.g. /?src=youtube. Stored with the sign-up only.
  useEffect(() => {
    try {
      const src = new URLSearchParams(window.location.search).get("src");
      if (src) {
        setSource(src.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 64) || null);
      }
    } catch {
      setSource(null);
    }
  }, []);

  function show(message: string, kind: Status["kind"] = "") {
    setStatus({ message, kind });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (honey) return; // bot filled the honeypot; pretend success

    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean) || clean.length > 254) {
      show("Please enter a valid email address.", "err");
      return;
    }

    setPending(true);
    show("Adding you…");
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ email: clean, source }),
      });

      if (res.ok || res.status === 201) {
        setEmail("");
        show("You're on the list. We'll be in touch.", "ok");
      } else {
        let body: { code?: string } = {};
        try {
          body = await res.json();
        } catch {
          body = {};
        }
        if (res.status === 409 || body.code === "23505") {
          show("You're already on the waitlist.", "ok");
        } else if (res.status === 400 || body.code === "23514") {
          show("Please enter a valid email address.", "err");
        } else {
          show("Something went wrong. Please try again in a moment.", "err");
        }
      }
    } catch {
      show("Network error. Check your connection and try again.", "err");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <div>
        <label className="label" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          placeholder="student@example.com"
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <input
        className="honeypot"
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={honey}
        onChange={(e) => setHoney(e.target.value)}
      />

      <button className="button" type="submit" disabled={pending}>
        Join the waitlist
      </button>

      <p className={`status ${status.kind}`} role="status" aria-live="polite">
        {status.message}
      </p>
    </form>
  );
}
