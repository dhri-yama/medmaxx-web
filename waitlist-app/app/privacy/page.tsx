import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy · MedMaxx",
  description: "How MedMaxx handles the email addresses collected for the waitlist.",
};

export default function PrivacyPage() {
  return (
    <main className="legal">
      <a className="back" href="/">
        ← Back to the waitlist
      </a>

      <h1>Privacy policy</h1>
      <p className="updated">Last updated: 20 November 2026</p>

      <section>
        <h2>What we collect</h2>
        <p>
          When you join the waitlist we collect the email address you enter. If you arrive
          through a link with a source tag (for example <code>?src=youtube</code>), we store
          that tag with your sign-up so we know which channel brought you in. We don&apos;t
          collect your name, payment details or anything else through this page.
        </p>
      </section>

      <section>
        <h2>Why we collect it</h2>
        <p>
          We use your email only to send MedMaxx launch news and to tell you when early access
          opens. We don&apos;t sell it or share it with advertisers.
        </p>
      </section>

      <section>
        <h2>Where it is stored</h2>
        <p>
          Sign-ups are stored in a database hosted by Supabase. Only the MedMaxx team can read
          the waitlist. The public key used by this page can only add rows; it cannot read them.
        </p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          We keep your email until you ask us to remove it or the waitlist is no longer needed,
          whichever comes first.
        </p>
      </section>

      <section>
        <h2>Your choices</h2>
        <p>
          You can ask us to see, correct or delete the email we hold for you, or to stop
          receiving launch news. Send us a direct message on Instagram at{" "}
          <a href="https://www.instagram.com/medmaxx88/" target="_blank" rel="noopener noreferrer">
            <strong>@medmaxx88</strong>
          </a>
          .
        </p>
      </section>
    </main>
  );
}
