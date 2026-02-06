// frontend/src/components/Beallitasok.jsx
import React, { useMemo, useState } from "react";
import { usePlayer } from "../context/PlayerContext.jsx";
import "./Beallitasok.css";

const CLASS_CONFIG = {
  6: { key: "warrior", displayName: "Harcos", sprite: "/ui/player/warriorsquare.png" },
  7: { key: "mage", displayName: "Varázsló", sprite: "/ui/player/magesquare.png" },
  8: { key: "archer", displayName: "Íjász", sprite: "/ui/player/ijasz.png" },
};

const TABS = [
  { key: "hang", label: "Hang" },
  { key: "nyelv", label: "Nyelv" },
  { key: "profil", label: "Profil" },
  { key: "statisztika", label: "Statisztika" },
  { key: "admin", label: "Admin mód" },
];

export default function BeallitasokModal({ onClose }) {
  const { player } = usePlayer() || {};

  const [activeTab, setActiveTab] = useState("hang");
  const [isClosing, setIsClosing] = useState(false);

  // ✅ Hang alapból ON
  const [musicOn, setMusicOn] = useState(true);
  const [sfxOn, setSfxOn] = useState(true);
  const [masterOn, setMasterOn] = useState(true);
  const [musicVol, setMusicVol] = useState(70);
  const [sfxVol, setSfxVol] = useState(80);
  const [masterVol, setMasterVol] = useState(90);

  // Nyelv (placeholder)
  const [lang, setLang] = useState("hu");

  // Profil edit (név/email)
  const [editOpen, setEditOpen] = useState(false);
  const [editField, setEditField] = useState("username"); // "username" | "email"
  const [editValue, setEditValue] = useState("");

  const profileSprite = useMemo(() => {
    const cid = Number(player?.class_id);
    return CLASS_CONFIG[cid]?.sprite || "";
  }, [player?.class_id]);

  const username = player?.username || "Ismeretlen";
  const email = player?.email || player?.mail || "";
  const maskedEmail = useMemo(() => maskEmail(email), [email]);

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => onClose?.(), 300);
  };

  const openEdit = (fieldKey) => {
    setEditField(fieldKey);
    setEditValue("");
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditValue("");
  };

  const handleProfileChange = () => {
    // ✅ placeholder
    alert(
      `${editField === "username" ? "Felhasználónév" : "Email"} változtatás (placeholder): ${editValue}`
    );
    closeEdit();
  };

  return (
    <div
      className={`fixed inset-0 bg-black/70 flex justify-center items-center z-50 beallitasok-overlay ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={`beallitasok beallitasok-container relative w-[86%] h-[82%] p-6 ${
          isClosing ? "closing" : ""
        }`}
      >
        <button
          type="button"
          onClick={handleClose}
          className="beallitasok-close kilepes"
          aria-label="Bezárás"
        >
          X
        </button>

        {/* ✅ Tabs feljebb + kattintásra felcsúszás */}
        <div className="beallitasok-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`beallitasok-tab ${activeTab === t.key ? "active" : ""}`}
              onClick={() => {
                setActiveTab(t.key);
                closeEdit();
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ✅ panel ráül a tabokra (mappa feeling), de nem vágja le őket */}
        <div className="beallitasok-panelWrap">
          <div className="beallitasok-body invMinden">
            {/* HANG */}
            {activeTab === "hang" && (
              <div className="beallitasok-panel invStatsBorder">
                <div className="beallitasok-panel-title invEquipmentText">HANG</div>

                <AudioRow
                  label="Zene"
                  enabled={musicOn}
                  onToggle={() => setMusicOn((v) => !v)}
                  value={musicVol}
                  onChange={setMusicVol}
                />
                <AudioRow
                  label="Effektek"
                  enabled={sfxOn}
                  onToggle={() => setSfxOn((v) => !v)}
                  value={sfxVol}
                  onChange={setSfxVol}
                />
                <AudioRow
                  label="Master"
                  enabled={masterOn}
                  onToggle={() => setMasterOn((v) => !v)}
                  value={masterVol}
                  onChange={setMasterVol}
                />

                <div className="beallitasok-note invInvValassz">
                  Placeholder: később ténylegesen mentjük/alkalmazzuk.
                </div>
              </div>
            )}

            {/* NYELV */}
            {activeTab === "nyelv" && (
              <div className="beallitasok-panel invStatsBorder">
                <div className="beallitasok-panel-title invEquipmentText">NYELV</div>

                <div className="beallitasok-langWrapBig">
                  <button
                    type="button"
                    className={`beallitasok-langBtnBig invInvEquipBtn ${
                      lang === "hu" ? "selected" : ""
                    }`}
                    onClick={() => setLang("hu")}
                  >
                    <span className="pixel-flag-big flag-hu" aria-hidden="true" />
                    <span className="beallitasok-langTextBig">MAGYAR</span>
                  </button>

                  <button
                    type="button"
                    className={`beallitasok-langBtnBig invInvEquipBtn ${
                      lang === "en" ? "selected" : ""
                    }`}
                    onClick={() => setLang("en")}
                  >
                    <span className="pixel-flag-big flag-us" aria-hidden="true" />
                    <span className="beallitasok-langTextBig">ENGLISH</span>
                  </button>
                </div>

                <div className="beallitasok-note invInvValassz">
                  Placeholder: később tényleges nyelvváltás + mentés.
                </div>
              </div>
            )}

            {/* PROFIL */}
            {activeTab === "profil" && (
              <div className="beallitasok-panel invStatsBorder">
                <div className="beallitasok-panel-title invEquipmentText">PROFIL</div>

                <div className="beallitasok-profileCenter">
                  {/* ✅ nagyobb, vastagabb körvonal, no shadow */}
                  <div className="beallitasok-avatarOutline">
                    {profileSprite ? (
                      <img
                        src={profileSprite}
                        alt="Profilkép"
                        className="beallitasok-avatarImg"
                      />
                    ) : (
                      <div className="beallitasok-avatarFallback invInvValassz">(Nincs kép)</div>
                    )}
                  </div>

                  {/* ✅ középen marad, ceruza nem tolja el */}
                  <div className="beallitasok-inlineField">
                    <div className="beallitasok-inlineText invCharacterText">{username}</div>
                    <button
                      type="button"
                      className="beallitasok-pencil"
                      title="Felhasználónév módosítása"
                      onClick={() => openEdit("username")}
                    >
                      ✎
                    </button>
                  </div>

                  <div className="beallitasok-inlineField">
                    <div className="beallitasok-inlineText invEquipmentText">
                      {maskedEmail || "—"}
                    </div>
                    <button
                      type="button"
                      className="beallitasok-pencil"
                      title="Email módosítása"
                      onClick={() => openEdit("email")}
                    >
                      ✎
                    </button>
                  </div>

                  <div className="beallitasok-note invInvValassz">
                    Jelszó változtatás nincs.
                  </div>
                </div>
              </div>
            )}

            {/* STATISZTIKA */}
            {activeTab === "statisztika" && (
              <div className="beallitasok-panel invStatsBorder">
                <div className="beallitasok-panel-title invEquipmentText">STATISZTIKA</div>
                <div className="beallitasok-coming invInvValassz">Később lesz megoldva.</div>
              </div>
            )}

            {/* ADMIN */}
            {activeTab === "admin" && (
              <div className="beallitasok-panel invStatsBorder">
                <div className="beallitasok-panel-title invEquipmentText">ADMIN MÓD</div>
                <div className="beallitasok-coming invInvValassz">
                  Később lesz megoldva (csak adminok).
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit popup */}
        {editOpen && (
          <div className="beallitasok-editOverlay" onClick={closeEdit}>
            <div
              className="beallitasok-editModal invStatsBorder"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="beallitasok-editHeader invEquipedItems">
                <div className="beallitasok-editTitle invEquipmentText">
                  {editField === "username" ? "FELHASZNÁLÓNÉV" : "EMAIL"} VÁLTOZTATÁS
                </div>
                <button
                  type="button"
                  className="beallitasok-editClose invInvItemClear"
                  onClick={closeEdit}
                  aria-label="Bezár"
                >
                  X
                </button>
              </div>

              <div className="beallitasok-editBody invItemsBorder">
                <div className="beallitasok-editLabel invStatName">Új érték</div>

                <input
                  className="beallitasok-input"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  type="text"
                  placeholder={editField === "email" ? "pl. valami@email.com" : "pl. uj_felhasznalo"}
                />

                <div className="beallitasok-editActions">
                  <button type="button" className="invInvUnEquipBtn" onClick={closeEdit}>
                    Mégse
                  </button>
                  <button
                    type="button"
                    className="invInvEquipBtn"
                    onClick={handleProfileChange}
                    disabled={!editValue.trim()}
                    style={{
                      opacity: editValue.trim() ? 1 : 0.6,
                      cursor: editValue.trim() ? "pointer" : "not-allowed",
                    }}
                  >
                    Változtat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* helpers */

function AudioRow({ label, enabled, onToggle, value, onChange }) {
  return (
    <div className={`beallitasok-row invStatsDiv ${!enabled ? "audio-disabled" : ""}`}>
      <div className="beallitasok-label invStatName">{label}</div>

      <div className="beallitasok-audioRight">
        <Toggle enabled={enabled} onToggle={onToggle} />
        <Slider value={value} onChange={onChange} disabled={!enabled} />
        <div className="beallitasok-audioValue">{value}</div>
      </div>
    </div>
  );
}

function Slider({ value, onChange, disabled }) {
  return (
    <input
      className="beallitasok-slider pixelRange"
      type="range"
      min="0"
      max="100"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

function Toggle({ enabled, onToggle }) {
  return (
    <button
      type="button"
      className={`beallitasok-toggle ${enabled ? "on" : "off selected"}`}
      onClick={onToggle}
      aria-pressed={enabled}
    >
      {enabled ? "ON" : "OFF"}
    </button>
  );
}

function maskEmail(email) {
  if (!email || typeof email !== "string") return "";
  const at = email.indexOf("@");
  if (at <= 0) return email;

  const local = email.slice(0, at);
  const domain = email.slice(at);

  if (local.length <= 2) return local + "*****" + domain;

  const first2 = local.slice(0, 2);
  const last2 = local.length >= 4 ? local.slice(-2) : local.slice(-1);
  return `${first2}*****${last2}${domain}`;
}
