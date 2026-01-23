import React, { useState } from "react";
import "./EventView.css";

export default function EventView({ event, onChoose }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!event) return null;

  return (
    <div className="event-root">
      {/* ALAP HÁTTÉR (Pulzáló, fekete-fehér) */}
      <div 
        className="event-bg base" 
        style={{ backgroundImage: `url(${event.background})` }} 
      />

      {/* BAL OLDALI ÉLES HÁTTÉR */}
      <div 
        className={`event-bg left ${hoveredIdx === 0 ? "active" : ""}`}
        style={{ backgroundImage: `url(${event.background})` }} 
      />

      {/* JOBB OLDALI ÉLES HÁTTÉR */}
      <div 
        className={`event-bg right ${hoveredIdx === 1 ? "active" : ""}`}
        style={{ backgroundImage: `url(${event.background})` }} 
      />

      {/* TARTALOM OVERLAY */}
      <div className="event-ui-overlay">
        <h2 className="event-main-title">{event.title}</h2>
        <div className="event-story-box">
  <p>{event.story}</p>
</div>


        {/* A KÉT HATALMAS INTERAKTÍV OLDAL */}
        <div className="event-sides-container">
          {event.choices.map((choice, idx) => (
            <div
              key={idx}
              className="event-side"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onChoose(choice)}
            >
              <div className="event-choice-label">
                {choice.label}
              </div>
              
              {hoveredIdx === idx && (
                <div className="event-tooltip-wrapper">
                  <div className="event-tooltip">Kattints a választáshoz</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}