// frontend/src/components/RestCampfire.jsx
import React from "react";
import campfireVideo from "../assets/backgrounds/campfire.mp4";
import "./RestCampfire.css";

// ✅ TYPEWRITER HOOK
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
        setDisplayed((prev) => prev + text.charAt(i));
        i++;
        setTimeout(tick, speed);
      } else {
        setDone(true);
      }
    }

    tick();

    return () => {
      cancelled = true; // ✅ EZ akadályozza meg az undefined-et
    };
  }, [text, speed]);

  return { displayed, done };
}

export default function RestCampfire({ onBackToPath, onGoHub, level }) {
  const title = "OPihenő a tábortűznél";
  const story =
    "A lángok csendesen ropognak az éjszakában. A sebek lassan gyógyulnak, de az út még hosszú. Eldöntheted: visszatérsz a harcba, vagy hazatérsz a hub biztonságába.";

  const typedTitle = useTypewriter(title, 45);
  const typedStory = useTypewriter(story, 18);

  return (
    <div className="fixed inset-0 flex items-center justify-center text-white">
      {/* Háttér videó */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={campfireVideo}
        autoPlay
        loop
        muted
      />

      {/* Sötét overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Tartalom */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center max-w-2xl">
        {/* CÍM – betűnként */}
        <h2 className="title text-3xl md:text-4xl font-bold drop-shadow-lg min-h-[3rem]">
          {typedTitle.displayed}
        </h2>

        {/* SZÖVEG – betűnként */}
        <p className="text-sm md:text-base text-gray-200 min-h-[6rem] leading-relaxed">
          {typedStory.displayed}
        </p>

        {/* GOMBOK – csak akkor jelenjenek meg, ha a szöveg kész */}
        {typedStory.done && (
          <div className="title flex flex-col md:flex-row gap-4 mt-4 animate-fade-in">
            <button
              onClick={onBackToPath}
              className="title px-6 py-3 rounded-lg bg-blue-800 hover:bg-blue-700 text-sm md:text-base shadow-lg shadow-black/40"
              
            >
              🔥 Vissza az ösvényre (Szint {level})
            </button>

            <button
              onClick={onGoHub}
              className="px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm md:text-base  shadow-lg shadow-black/40"
            >
              🏠 Hazamész a hubba
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
