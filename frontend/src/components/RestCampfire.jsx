// frontend/src/components/RestCampfire.jsx
import React from "react";
import campfireVideo from "../assets/backgrounds/campfire.mp4";
import "./RestCampfire.css";

function useTypewriter(text, speed = 35) {
  const [displayed, setDisplayed] = React.useState("");
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    let i = 0;
    let cancelled = false;
    setDisplayed("");
    setDone(false);

    function tick() {
      if (cancelled) return;
      if (i < text.length) {
        setDisplayed((p) => p + text.charAt(i));
        i++;
        setTimeout(tick, speed);
      } else {
        setDone(true);
      }
    }

    tick();
    return () => { cancelled = true; };
  }, [text, speed]);

  return { displayed, done };
}

export default function RestCampfire({ onBackToPath, onGoHub, level }) {
  const title = "pPihenő a tábortűznél";
  const story =
    "aA lángok csendesen ropognak az éjszakában. A sebek lassan gyógyulnak, de az út még hosszú. Eldöntheted: visszatérsz a harcba, vagy hazatérsz a hub biztonságába.";

  const typedTitle = useTypewriter(title, 45);
  const typedStory = useTypewriter(story, 18);

  return (
    <div className="campfire-root">
      <video className="campfire-video" src={campfireVideo} autoPlay loop muted />

      {/* cinematic csíkok */}
      <div className="cinematic-bar top" />
      <div className="cinematic-bar bottom" />

      {/* vignette + enyhe vörös füst */}
      <div className="campfire-vignette" />
      <div className="campfire-embers" />

      <div className="campfire-content">
        <h2 className="campfire-title">{typedTitle.displayed}</h2>

        <p className="campfire-text">{typedStory.displayed}</p>

        <div className="campfire-actions-slot">
          {typedStory.done && (
            <div className="campfire-actions">
              <button onClick={onBackToPath} className="button">
                Vissza az ösvényre (Szint {level})
              </button>
              <button onClick={onGoHub} className="button">
                Hazamész a hubba
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
