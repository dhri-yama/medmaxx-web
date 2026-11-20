"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LAUNCH_AT } from "@/lib/config";

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function remaining(target: number, now: number): Parts {
  let ms = Math.max(0, target - now);
  const days = Math.floor(ms / 86_400_000);
  ms -= days * 86_400_000;
  const hours = Math.floor(ms / 3_600_000);
  ms -= hours * 3_600_000;
  const minutes = Math.floor(ms / 60_000);
  ms -= minutes * 60_000;
  const seconds = Math.floor(ms / 1_000);
  return { days, hours, minutes, seconds };
}

// Each digit slides in when it changes.
function Digit({ value }: { value: string }) {
  return (
    <span className="digit">
      <motion.span
        key={value}
        initial={{ y: "-70%", opacity: 0 }}
        animate={{ y: "0%", opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
        style={{ display: "block" }}
      >
        {value}
      </motion.span>
    </span>
  );
}

function Unit({ label, value }: { label: string; value: number | null }) {
  const text = value === null ? "--" : String(value).padStart(2, "0");
  return (
    <div className="unit">
      <div className="digits">
        {text.split("").map((char, i) => (
          <Digit key={i} value={char} />
        ))}
      </div>
      <div className="unit-label">{label}</div>
    </div>
  );
}

export default function Countdown() {
  // Starts empty so the server render and first client render match; filled after mount.
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    const tick = () => setParts(remaining(LAUNCH_AT.getTime(), Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="countdown" role="timer" aria-label="Time until MedMaxx launches">
      <Unit label="days" value={parts?.days ?? null} />
      <Unit label="hours" value={parts?.hours ?? null} />
      <Unit label="minutes" value={parts?.minutes ?? null} />
      <Unit label="seconds" value={parts?.seconds ?? null} />
    </div>
  );
}
