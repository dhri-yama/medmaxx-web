import Countdown from "./components/Countdown";
import HandsBackdrop from "./components/HandsBackdrop";
import Reveal from "./components/Reveal";
import WaitlistForm from "./components/WaitlistForm";

export default function Home() {
  return (
    <main className="dot-field">
      <HandsBackdrop />
      <div className="page">
        <Reveal>
          <span className="badge">Early access</span>
        </Reveal>

        <Reveal delay={0.15}>
          <h1 className="headline">
            Practise PYQs, flashcards and mock tests in one place.
          </h1>
          <p className="intro">
            Join the MedMaxx waitlist now and get early-access pricing when we open.
          </p>
        </Reveal>

        <Countdown />

        <Reveal delay={1.2} className="card">
          <h2>Join the waitlist</h2>
          <p>No spam. We only email you about the launch.</p>
          <WaitlistForm />
        </Reveal>

        <a
          className="social"
          href="https://www.instagram.com/medmaxx88/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="MedMaxx on Instagram"
          title="Instagram"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2zM12 0C8.7 0 8.3 0 7.1.1 2.7.3.3 2.7.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.2 4.4 2.6 6.8 7 7 1.2.1 1.6.1 4.9.1s3.7 0 4.9-.1c4.4-.2 6.8-2.6 7-7 .1-1.2.1-1.6.1-4.9s0-3.7-.1-4.9c-.2-4.4-2.6-6.8-7-7C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.9 1.4 1.4 0 0 0 0-2.9z" />
          </svg>
        </a>

        <p className="fine">
          We only use your email for MedMaxx launch news.{" "}
          <a href="/privacy">Privacy policy</a>
        </p>
      </div>
    </main>
  );
}
