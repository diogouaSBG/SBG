import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

const WEEK_DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
const ALL_DAYS  = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const CONSULTANTS = [
  "Ana Silva", "Bruno Costa", "Catarina Melo", "David Ferreira",
  "Elisa Ramos", "Filipe Santos", "Gonçalo Pereira", "Helena Cruz",
];
const TIMES = [
  "06:00","06:30","07:00","07:30","08:00","08:30","09:00","09:30",
  "10:00","10:30","11:00","11:30","12:00","13:00","14:00","15:00",
  "16:00","17:00","18:00","19:00","20:00",
];

const initWeek = () => Object.fromEntries(WEEK_DAYS.map(d => [d, []]));

const getMonday = (offset = 0) => {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1) + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toISODate = (d) => d.toISOString().slice(0, 10);

const fmtDate = (monday, idx) => {
  const d = new Date(monday);
  d.setDate(d.getDate() + idx);
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
};

const nightsBetween = (from, to) => {
  const a = ALL_DAYS.indexOf(from), b = ALL_DAYS.indexOf(to);
  if (a < 0 || b < 0 || b <= a) return null;
  return b - a;
};

const transport = (n) => {
  if (n === 0) return null;
  return n >= 3 ? { label: "🚗 Carro", color: "#22c55e" } : { label: "🚂 Comboio", color: "#f59e0b" };
};

const emptyForm = (day = "") => ({
  name: "", zone: "", departDay: day, departTime: "",
  returnDay: "", returnTime: "",
  portoType: "holiday",
  portoOther: "",
});

const getPortoLabel = (form) => {
  if (form.portoType === "holiday") return "🏨 Holiday Inn Express Exponor";
  return form.portoOther ? `🏨 ${form.portoOther}` : "🏨 Hotel";
};

// ── Sub-components ────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 32 }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 800, fontSize: size * 0.34, color: "#fff",
  }}>
    {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
  </div>
);

const Label = ({ children }) => (
  <div style={{ fontSize: 10, fontWeight: 800, color: "#3d4460", letterSpacing: "0.8px", marginBottom: 6, textTransform: "uppercase" }}>
    {children}
  </div>
);

const sel = {
  width: "100%", padding: "10px 12px", background: "#161928",
  border: "1px solid #1e2235", borderRadius: 10, color: "#dde1f0",
  fontSize: 13, marginBottom: 0, outline: "none", display: "block",
  boxSizing: "border-box", fontFamily: "inherit",
};

const Section = ({ color, label, children }) => (
  <div style={{ background: "#161928", border: "1px solid #1e2235", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
    <div style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: "0.6px", marginBottom: 10, textTransform: "uppercase" }}>{label}</div>
    {children}
  </div>
);

const LocOption = ({ selected, color, onClick, children }) => (
  <button onClick={onClick} style={{
    padding: "11px 14px", borderRadius: 10, border: "1px solid",
    borderColor: selected ? color : "#1e2235",
    background: selected ? color + "18" : "#161928",
    color: selected ? color : "#475569",
    fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left", transition: "all .15s",
  }}>
    {children}
  </button>
);

const NavBtn = ({ onClick, children }) => (
  <button onClick={onClick} style={{ background: "#161928", border: "none", color: "#dde1f0", width: 36, height: 36, borderRadius: 8, cursor: "pointer", fontSize: 20, lineHeight: 1 }}>{children}</button>
);

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [trips, setTrips]           = useState(initWeek());
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState(emptyForm());
  const [weekOffset, setWeekOffset] = useState(0);
  const [tab, setTab]               = useState("semana");
  const [toast, setToast]           = useState(null);
  const [expanded, setExpanded]     = useState(null);
  const [loading, setLoading]       = useState(false);

  const monday = getMonday(weekOffset);
  const weekStart = toISODate(monday);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const loadTrips = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .eq("week_start", weekStart);

    if (error) {
      showToast("Erro ao carregar viagens.", "error");
    } else {
      const grouped = initWeek();
      data.forEach(row => {
        if (grouped[row.depart_day]) grouped[row.depart_day].push({
          id: row.id,
          name: row.name,
          zone: row.zone,
          departDay: row.depart_day,
          departTime: row.depart_time,
          returnDay: row.return_day,
          returnTime: row.return_time,
          nights: row.nights,
          portoType: row.porto_type,
          portoOther: row.porto_other,
          portoLocation: row.porto_location,
        });
      });
      setTrips(grouped);
    }
    setLoading(false);
  }, [weekStart]);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  const addTrip = async () => {
    if (!form.name)        return showToast("Seleciona o teu nome.", "error");
    if (!form.zone.trim()) return showToast("Indica a tua zona em Lisboa.", "error");
    if (!form.departDay)   return showToast("Indica o dia de partida.", "error");
    if (!form.departTime)  return showToast("Indica a hora de partida de Lisboa.", "error");
    if (!form.returnDay)   return showToast("Indica o dia de regresso.", "error");
    if (!form.returnTime)  return showToast("Indica a hora de saída do Porto.", "error");
    if (form.portoType === "other" && !form.portoOther.trim())
      return showToast("Indica o nome do hotel.", "error");

    const nights = nightsBetween(form.departDay, form.returnDay);
    if (nights === null) return showToast("O regresso tem de ser após a partida.", "error");
    if ((trips[form.departDay] || []).find(t => t.name === form.name))
      return showToast("Já tens viagem registada nesse dia.", "error");

    const portoLocation = getPortoLabel(form);
    const { error } = await supabase.from("trips").insert({
      name: form.name,
      zone: form.zone,
      depart_day: form.departDay,
      depart_time: form.departTime,
      return_day: form.returnDay,
      return_time: form.returnTime,
      nights,
      porto_type: form.portoType,
      porto_other: form.portoOther,
      porto_location: portoLocation,
      week_start: weekStart,
    });

    if (error) return showToast("Erro ao guardar viagem.", "error");

    await loadTrips();
    setModal(null);
    showToast(`${form.name} registado(a) para ${form.departDay}!`);
  };

  const removeTrip = async (day, id) => {
    const { error } = await supabase.from("trips").delete().eq("id", id);
    if (error) return showToast("Erro ao remover viagem.", "error");
    await loadTrips();
  };

  const allTrips = Object.entries(trips)
    .flatMap(([day, arr]) => arr.map(t => ({ ...t, day })))
    .sort((a, b) => WEEK_DAYS.indexOf(a.day) - WEEK_DAYS.indexOf(b.day));

  const previewNights = form.departDay && form.returnDay ? nightsBetween(form.departDay, form.returnDay) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#0c0e16", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#dde1f0" }}>

      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.type === "error" ? "#ef4444" : "#22c55e",
          color: "#fff", padding: "12px 20px", borderRadius: 12,
          fontWeight: 700, fontSize: 13, boxShadow: "0 8px 30px rgba(0,0,0,.5)",
          animation: "fadeIn .25s ease",
        }}>
          {toast.type === "error" ? "⚠️" : "✅"} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: "1px solid #181b28", padding: "16px 24px", display: "flex", alignItems: "center", gap: 14, background: "#0c0e16", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🚄</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-.5px" }}>INETUM Viagens</div>
          <div style={{ fontSize: 11, color: "#3d4460" }}>Lisboa ↔ Porto</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {["semana", "lista"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700,
              background: tab === t ? "#6366f1" : "#161928",
              color: tab === t ? "#fff" : "#475569",
            }}>
              {t === "semana" ? "📅 Semana" : "📋 Lista"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Semana ── */}
      {tab === "semana" && (
        <div style={{ padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
            <NavBtn onClick={() => setWeekOffset(o => o - 1)}>‹</NavBtn>
            <span style={{ fontWeight: 700, fontSize: 16 }}>
              Semana de {monday.toLocaleDateString("pt-PT", { day: "2-digit", month: "long" })}
              {weekOffset === 0 && <span style={{ marginLeft: 10, fontSize: 11, background: "#6366f1", color: "#fff", padding: "3px 10px", borderRadius: 20 }}>Esta semana</span>}
            </span>
            <NavBtn onClick={() => setWeekOffset(o => o + 1)}>›</NavBtn>
            {loading && <span style={{ fontSize: 12, color: "#3d4460" }}>A carregar...</span>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
            {WEEK_DAYS.map((day, idx) => {
              const list = trips[day] || [];
              const tr   = transport(list.length);
              return (
                <div key={day} style={{ background: "#11141f", borderRadius: 16, border: "1px solid #181b28", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "13px 14px 9px", borderBottom: "1px solid #181b28", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{day}</div>
                      <div style={{ fontSize: 11, color: "#3d4460" }}>{fmtDate(monday, idx)}</div>
                    </div>
                    {tr && <span style={{ fontSize: 10, fontWeight: 700, color: tr.color, background: tr.color + "22", padding: "3px 8px", borderRadius: 20 }}>{tr.label}</span>}
                  </div>

                  <div style={{ flex: 1, padding: "10px 10px 4px" }}>
                    {list.length === 0 && <div style={{ fontSize: 11, color: "#1e2235", textAlign: "center", padding: "14px 0", fontStyle: "italic" }}>Ninguém ainda</div>}
                    {list.map(t => (
                      <div key={t.id} style={{ marginBottom: 6 }}>
                        <div onClick={() => setExpanded(expanded === t.id ? null : t.id)} style={{
                          display: "flex", alignItems: "center", gap: 7, background: "#191d2e", borderRadius: 10,
                          padding: "8px 10px", cursor: "pointer",
                          border: `1px solid ${expanded === t.id ? "#6366f150" : "transparent"}`,
                        }}>
                          <Avatar name={t.name} size={26} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                            <div style={{ fontSize: 10, color: "#3d4460" }}>📍 {t.zone} · 🕐 {t.departTime}</div>
                          </div>
                          <button onClick={e => { e.stopPropagation(); removeTrip(day, t.id); }} style={{ background: "none", border: "none", color: "#ef444450", cursor: "pointer", fontSize: 16, padding: 0 }}>×</button>
                        </div>
                        {expanded === t.id && (
                          <div style={{ background: "#13172a", borderRadius: "0 0 10px 10px", padding: "10px 12px", border: "1px solid #6366f130", borderTop: "none" }}>
                            {[
                              ["Partida Lisboa",  `${t.departDay} às ${t.departTime}`],
                              ["Regresso Porto",  `${t.returnDay} às ${t.returnTime}`],
                              ["Noites no Porto", `${t.nights} noite${t.nights !== 1 ? "s" : ""}`, "#a78bfa"],
                              ["Hotel",           t.portoLocation, "#f59e0b"],
                            ].map(([label, val, col]) => (
                              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 11 }}>
                                <span style={{ color: "#3d4460" }}>{label}</span>
                                <span style={{ fontWeight: 700, color: col || "#dde1f0" }}>{val}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {list.length > 0 && list.length < 3 && (
                      <div style={{ margin: "4px 0 8px" }}>
                        <div style={{ display: "flex", gap: 3 }}>
                          {[0,1,2].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i < list.length ? "#f59e0b" : "#1e2235" }} />)}
                        </div>
                        <div style={{ fontSize: 10, color: "#f59e0b", marginTop: 3 }}>Faltam {3 - list.length} para carro</div>
                      </div>
                    )}
                    {list.length >= 3 && <div style={{ fontSize: 10, color: "#22c55e", margin: "4px 0 8px", fontWeight: 700 }}>✓ Podem ir de carro!</div>}
                  </div>

                  <div style={{ padding: "0 10px 12px" }}>
                    <button onClick={() => { setForm(emptyForm(day)); setModal(day); }} style={{
                      width: "100%", padding: "9px", background: "#161928", border: "1px dashed #252a40",
                      borderRadius: 9, color: "#6366f1", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}>+ Registar</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 22, justifyContent: "center", flexWrap: "wrap" }}>
            {[["🚂","#f59e0b","< 3 → Comboio"],["🚗","#22c55e","≥ 3 → Carro"],["🏨","#f59e0b","Hotel"]].map(([ic,cl,lb]) => (
              <div key={lb} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#3d4460" }}><span style={{ color: cl }}>{ic}</span>{lb}</div>
            ))}
          </div>
          <div style={{ textAlign: "center", fontSize: 11, color: "#1e2235", marginTop: 6 }}>Clica num consultor para ver os detalhes</div>
        </div>
      )}

      {/* ── Lista ── */}
      {tab === "lista" && (
        <div style={{ padding: "22px 24px" }}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 18 }}>Todas as Viagens</div>
          {allTrips.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#1e2235" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🗓️</div>
              <div style={{ fontSize: 15 }}>Nenhuma viagem registada ainda</div>
            </div>
          ) : allTrips.map(t => (
            <div key={t.id} style={{ background: "#11141f", border: "1px solid #181b28", borderRadius: 14, padding: "15px 18px", display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
              <Avatar name={t.name} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "#3d4460", marginTop: 3, display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <span>📅 {t.day}</span>
                  <span>📍 {t.zone}</span>
                  <span>🕐 Parte {t.departTime}</span>
                  <span>🔄 Regressa {t.returnDay} {t.returnTime}</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", background: "#a78bfa18", padding: "3px 10px", borderRadius: 20 }}>🌙 {t.nights}n</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b" }}>{t.portoLocation}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(6px)" }} onClick={() => setModal(null)}>
          <div style={{ background: "#11141f", border: "1px solid #181b28", borderRadius: 22, padding: 28, width: 430, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 28px 80px rgba(0,0,0,.7)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 2 }}>Registar Viagem</div>
            <div style={{ fontSize: 13, color: "#3d4460", marginBottom: 22 }}>Semana de {monday.toLocaleDateString("pt-PT", { day: "2-digit", month: "long" })}</div>

            <Label>CONSULTOR</Label>
            <select value={form.name} onChange={e => f("name", e.target.value)} style={{ ...sel, marginBottom: 14 }}>
              <option value="">Seleciona o teu nome...</option>
              {CONSULTANTS.map(c => <option key={c}>{c}</option>)}
            </select>

            <Label>ZONA DE PARTIDA EM LISBOA</Label>
            <input placeholder="Ex: Cascais, Sintra, Almada, Oriente…" value={form.zone} onChange={e => f("zone", e.target.value)} style={{ ...sel, marginBottom: 14 }} />

            <Section color="#6366f1" label="🔵 Partida de Lisboa">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><Label>DIA</Label>
                  <select value={form.departDay} onChange={e => f("departDay", e.target.value)} style={sel}>
                    <option value="">Dia...</option>
                    {WEEK_DAYS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div><Label>HORA</Label>
                  <select value={form.departTime} onChange={e => f("departTime", e.target.value)} style={sel}>
                    <option value="">Hora...</option>
                    {TIMES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </Section>

            <Section color="#ec4899" label="🟣 Regresso do Porto">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><Label>DIA</Label>
                  <select value={form.returnDay} onChange={e => f("returnDay", e.target.value)} style={sel}>
                    <option value="">Dia...</option>
                    {ALL_DAYS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div><Label>HORA SAÍDA PORTO</Label>
                  <select value={form.returnTime} onChange={e => f("returnTime", e.target.value)} style={sel}>
                    <option value="">Hora...</option>
                    {TIMES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </Section>

            {previewNights !== null && (
              <div style={{ background: "#a78bfa18", border: "1px solid #a78bfa30", borderRadius: 10, padding: "10px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>🌙</span>
                <span style={{ fontSize: 14, color: "#a78bfa", fontWeight: 700 }}>{previewNights} noite{previewNights !== 1 ? "s" : ""} no Porto</span>
              </div>
            )}

            <Label>HOTEL NO PORTO</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              <LocOption selected={form.portoType === "holiday"} color="#f59e0b" onClick={() => f("portoType", "holiday")}>
                🏨 Holiday Inn Express Exponor
              </LocOption>
              <LocOption selected={form.portoType === "other"} color="#f59e0b" onClick={() => f("portoType", "other")}>
                🏨 Outro hotel...
              </LocOption>
              {form.portoType === "other" && (
                <input
                  autoFocus
                  placeholder="Nome do hotel..."
                  value={form.portoOther}
                  onChange={e => f("portoOther", e.target.value)}
                  style={{ ...sel, border: "1px solid #f59e0b60", background: "#f59e0b08" }}
                />
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => setModal(null)} style={{ padding: 13, background: "#161928", border: "1px solid #1e2235", borderRadius: 10, color: "#475569", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
              <button onClick={addTrip} style={{ padding: 13, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Confirmar ✓</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateX(60px) } to { opacity:1; transform:translateX(0) } }
        select option { background: #11141f; }
      `}</style>
    </div>
  );
}
