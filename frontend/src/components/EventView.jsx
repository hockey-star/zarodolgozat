import React from "react";

// event dizájn szügségeltetik

export default function EventView({ event, onChoose }) {
  if (!event) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center text-white"
      style={{
        backgroundImage: `url(${event.background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* sötét overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* tartalom */}
      <div className="relative z-10 max-w-4xl w-full px-10">
        {/* LORE */}
        <h2 className="text-4xl font-bold text-center mb-6">
          {event.title}
        </h2>

        <p className="text-lg text-center mb-12">
          {event.story}
        </p>

        {/* 2 NAGY GOMB – PathChoice feeling */}
        <div className="flex gap-10 justify-center">
          {event.choices.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => onChoose(choice)}
              className="w-72 h-40 text-2xl font-bold bg-black/60 hover:bg-black/80 border-2 border-white transition"
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
