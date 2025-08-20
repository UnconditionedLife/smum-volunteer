// SplashScreen.jsx
import React, { useEffect, useRef, useState } from "react";
import SmumLogo from "../assets/SmumLogo.jsx";

export default function SplashScreen({ onFinish, onShrinkEnd }) {
  const [isShrinking, setIsShrinking] = useState(false);
  const logoRef = useRef(null);

  useEffect(() => {
    // Start shrink a bit sooner
    const t1 = setTimeout(() => setIsShrinking(true), 800);

    // Callbacks tied to the actual end of the CSS transition
    const el = logoRef.current;
    const handleEnd = () => {
      onShrinkEnd?.();
      onFinish?.();
    };

    // Robust: listen once, with a safety timeout in case the event doesn’t fire
    el?.addEventListener("transitionend", handleEnd, { once: true });
    const safety = setTimeout(() => {
      el?.removeEventListener("transitionend", handleEnd);
      handleEnd();
    }, 2000); // > your transition (0.8s) + cushion

    return () => {
      clearTimeout(t1);
      clearTimeout(safety);
      el?.removeEventListener("transitionend", handleEnd);
    };
  }, [onFinish, onShrinkEnd]);

  return (
<div className="splash-screen">
      <div className="splash-content">
        <SmumLogo
          ref={logoRef}
          className="splash-logo"
          style={{
            transform: isShrinking
              ? "translateY(-28vh) scale(0.35)"
              : "translateY(0) scale(1)",
          }}
        />
        <div className="splash-text" style={{ marginTop: 12 }}>
          <div style={{ marginBottom: -26 }}><h3>Welcome to the Volunteer Portal</h3></div>
          <div><h3>Bienvenido al Portal de Voluntarios</h3></div>
          <div style={{ marginTop: -8 }}><i>Making a difference, one volunteer at a time.</i></div>
          <div style={{ marginTop: -6 }}><i>Marcando la diferencia, un voluntario a la vez.</i></div>
        </div>
      </div>
    </div>
  );
}