import { useEffect, useState } from "react";

const mascots = [
  ["🦈👟", "Tralalero Tralala"],
  ["🐊✈️", "Bombardiro Crocodilo"],
  ["🪵🥁", "Tung Tung Tung Sahur"],
  ["☕🩰", "Ballerina Cappuccina"],
  ["🐒🍌", "Chimpanzini Bananini"],
  ["🌵🐘", "Lirilì Larilà"],
] as const;

const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function confetti() {
  if (calm()) return;
  const colors = ["#4f46e5", "#ec4899", "#facc15", "#22c55e", "#06b6d4"];
  for (let i = 0; i < 120; i++) {
    const piece = document.createElement("i");
    piece.className = "confetti";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 300}px`);
    document.body.append(piece);
    piece.addEventListener("animationend", () => piece.remove());
  }
}

let showScreamer = () => {};
export function screamer() {
  // ponytail: 1-in-4 on a wrong answer, tune here if it gets too much
  if (!calm() && Math.random() < 0.25) showScreamer();
}

function scream() {
  const audio = new AudioContext(),
    osc = audio.createOscillator(),
    gain = audio.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(900, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(120, audio.currentTime + 0.8);
  gain.gain.setValueAtTime(0.3, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.9);
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + 0.9);
  osc.onended = () => audio.close();
}

export function Brainrot() {
  const [scary, setScary] = useState(false);
  useEffect(() => {
    showScreamer = () => {
      setScary(true);
      scream();
      setTimeout(() => setScary(false), 900);
    };
  }, []);
  return (
    <>
      <div className="brainrot-parade" aria-hidden="true">
        {mascots.map(([emoji, name], i) => (
          <span
            key={name}
            className="brainrot"
            style={{
              top: `${12 + i * 14}vh`,
              animationDuration: `${18 + i * 5}s`,
              animationDelay: `${-i * 4}s`,
            }}
          >
            <b>{emoji}</b>
            <small>{name}</small>
          </span>
        ))}
      </div>
      {scary && (
        <div className="screamer" role="alert">
          <b>👹</b>
          <strong>NON MAIS T’ES SÉRIEUX, OHIO ?!</strong>
        </div>
      )}
    </>
  );
}
