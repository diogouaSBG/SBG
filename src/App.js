import React, { useState, useMemo } from 'react';
import { PlaygroundMap } from './PlaygroundMap';
import { useLocation } from './useLocation';
import { usePlaygrounds } from './usePlaygrounds';

// ─── Constants ───────────────────────────────────────────────────────────────

const RADII = [
  { label: '500 m', value: 500 },
  { label: '1 km', value: 1000 },
  { label: '2 km', value: 2000 },
  { label: '5 km', value: 5000 },
];

const EQUIPMENT = [
  { key: 'swing', label: 'Baloiços', icon: '🪁' },
  { key: 'slide', label: 'Escorrega', icon: '🛝' },
  { key: 'climbingframe', label: 'Escalada', icon: '🧗' },
  { key: 'sandpit', label: 'Caixa de Areia', icon: '🏖️' },
  { key: 'seesaw', label: 'Balancé', icon: '⚖️' },
  { key: 'merry_go_round', label: 'Carrossel', icon: '🎠' },
];

const SURFACES = {
  sand: 'Areia', rubber: 'Borracha', grass: 'Relva',
  concrete: 'Betão', wood: 'Madeira', paving_stones: 'Calçada',
  asphalt: 'Asfalto', gravel: 'Gravilha', dirt: 'Terra',
};

const LISBON = { lat: 38.7169, lon: -9.1399, accuracy: null };

// ─── Utilities ───────────────────────────────────────────────────────────────

function fmtDist(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Toggle({ on, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '5px 0' }}>
      <div
        onClick={() => onChange(!on)}
        style={{
          width: 38, height: 22, borderRadius: 11, flexShrink: 0,
          background: on ? '#22c55e' : '#2d3748',
          position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: on ? 19 : 3,
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
      <span style={{ fontSize: 13, color: on ? '#e2e8f0' : '#94a3b8' }}>{label}</span>
    </label>
  );
}

function PlaygroundCard({ p, selected, onClick }) {
  const chips = [];
  if (p.lit) chips.push({ text: '💡 Iluminado', color: '#f59e0b' });
  if (p.fence) chips.push({ text: '🔒 Vedado', color: '#3b82f6' });
  if (p.wheelchair) chips.push({ text: '♿ Acessível', color: '#8b5cf6' });
  if (p.surface) chips.push({ text: SURFACES[p.surface] || p.surface, color: '#64748b' });

  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 12px', marginBottom: 6, borderRadius: 10,
        background: selected ? 'rgba(34,197,94,0.1)' : '#1e2133',
        border: `1px solid ${selected ? '#22c55e' : 'transparent'}`,
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', flex: 1, lineHeight: 1.3 }}>
          {p.name}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {p.distance != null ? fmtDist(p.distance) : '–'}
        </span>
      </div>
      {p.address && (
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{p.address}</div>
      )}
      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {chips.map(c => (
            <span key={c.text} style={{
              fontSize: 10, padding: '2px 6px', borderRadius: 4,
              background: `${c.color}22`, color: c.color, fontWeight: 600,
            }}>
              {c.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailPanel({ p, onClose }) {
  const rows = [
    ['Distância', p.distance != null ? fmtDist(p.distance) : '–'],
    ['Piso', SURFACES[p.surface] || p.surface || '–'],
    ['Iluminação', p.lit ? 'Sim ✓' : 'Não'],
    ['Vedado', p.fence ? 'Sim ✓' : 'Não'],
    ['Acessível', p.wheelchair ? 'Sim ✓' : 'Não'],
    p.minAge != null && ['Idade mínima', `${p.minAge} anos`],
    p.maxAge != null && ['Idade máxima', `${p.maxAge} anos`],
    p.openingHours && ['Horário', p.openingHours],
  ].filter(Boolean);

  const eqLabels = p.equipment.map(k => EQUIPMENT.find(e => e.key === k)).filter(Boolean);

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: 'rgba(15,17,23,0.97)', backdropFilter: 'blur(10px)',
      borderTop: '1px solid #2d2f3e', padding: '16px 20px 20px',
      maxHeight: '45%', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>🛝 {p.name}</h2>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
            {p.address || `${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: '#2d2f3e', border: 'none', color: '#94a3b8',
            borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
            fontSize: 12, fontFamily: 'inherit', flexShrink: 0, marginLeft: 12,
          }}
        >
          ✕ Fechar
        </button>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
        gap: 8, marginBottom: eqLabels.length > 0 ? 12 : 0,
      }}>
        {rows.map(([label, value]) => (
          <div key={label} style={{ background: '#1e2133', borderRadius: 8, padding: '7px 10px' }}>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginTop: 2 }}>{value}</div>
          </div>
        ))}
      </div>

      {eqLabels.length > 0 && (
        <>
          <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            Equipamentos
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {eqLabels.map(e => (
              <span key={e.key} style={{
                fontSize: 12, padding: '4px 10px', borderRadius: 6,
                background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontWeight: 600,
              }}>
                {e.icon} {e.label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [radius, setRadius] = useState(1000);
  const [filterLit, setFilterLit] = useState(false);
  const [filterFenced, setFilterFenced] = useState(false);
  const [filterWheelchair, setFilterWheelchair] = useState(false);
  const [filterEquip, setFilterEquip] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const { location, error: locErr, loading: locLoading, request, setManual } = useLocation();
  const { playgrounds, loading: pgLoading, error: pgErr } = usePlaygrounds(location);

  const filtered = useMemo(() => {
    return playgrounds.filter(p => {
      if (p.distance != null && p.distance > radius) return false;
      if (filterLit && !p.lit) return false;
      if (filterFenced && !p.fence) return false;
      if (filterWheelchair && !p.wheelchair) return false;
      if (filterEquip.length > 0 && !filterEquip.every(eq => p.equipment.includes(eq))) return false;
      return true;
    });
  }, [playgrounds, radius, filterLit, filterFenced, filterWheelchair, filterEquip]);

  const toggleEquip = (key) =>
    setFilterEquip(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const hasFilters = filterLit || filterFenced || filterWheelchair || filterEquip.length > 0;

  const clearFilters = () => {
    setFilterLit(false);
    setFilterFenced(false);
    setFilterWheelchair(false);
    setFilterEquip([]);
  };

  const selectPlayground = (p) =>
    setSelected(prev => prev?.id === p.id ? null : p);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: '#0f1117', color: '#e2e8f0',
      fontFamily: "'DM Sans', sans-serif", overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 56, flexShrink: 0,
        background: '#161927', borderBottom: '1px solid #2d2f3e',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>🛝</span>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>Parques Infantis</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Encontre parques perto de si</div>
          </div>
        </div>
        <button
          onClick={request}
          disabled={locLoading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, border: 'none',
            background: locLoading ? '#374151' : '#6366f1', color: '#fff',
            fontWeight: 600, fontSize: 13, cursor: locLoading ? 'default' : 'pointer',
            fontFamily: 'inherit', transition: 'background 0.2s',
          }}
        >
          📍 {locLoading ? 'A localizar...' : 'Atualizar localização'}
        </button>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <div style={{
          width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column',
          background: '#161927', borderRight: '1px solid #2d2f3e', overflow: 'hidden',
        }}>
          {/* Filter toggle header */}
          <div
            onClick={() => setFiltersOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 16px', cursor: 'pointer', userSelect: 'none',
              borderBottom: '1px solid #2d2f3e', flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1 }}>
              🔍 Filtros{hasFilters && (
                <span style={{
                  background: '#6366f1', color: '#fff', borderRadius: 4,
                  padding: '1px 5px', fontSize: 10, marginLeft: 6,
                }}>
                  ATIVOS
                </span>
              )}
            </span>
            <span style={{ color: '#64748b', fontSize: 11 }}>{filtersOpen ? '▲' : '▼'}</span>
          </div>

          {/* Filter panel */}
          {filtersOpen && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #2d2f3e', flexShrink: 0 }}>

              {/* Radius */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
                  Raio de pesquisa
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {RADII.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setRadius(r.value)}
                      style={{
                        flex: 1, padding: '5px 0', borderRadius: 6, border: 'none',
                        background: radius === r.value ? '#22c55e' : '#2d3748',
                        color: radius === r.value ? '#fff' : '#94a3b8',
                        fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'inherit', transition: 'all 0.15s',
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feature toggles */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
                  Características
                </div>
                <Toggle on={filterLit} onChange={setFilterLit} label="Iluminado à noite" />
                <Toggle on={filterFenced} onChange={setFilterFenced} label="Vedado / Fechado" />
                <Toggle on={filterWheelchair} onChange={setFilterWheelchair} label="Acessível (cadeira de rodas)" />
              </div>

              {/* Equipment chips */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
                  Equipamentos
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {EQUIPMENT.map(e => {
                    const active = filterEquip.includes(e.key);
                    return (
                      <button
                        key={e.key}
                        onClick={() => toggleEquip(e.key)}
                        style={{
                          padding: '4px 9px', borderRadius: 6,
                          border: `1px solid ${active ? '#22c55e' : 'transparent'}`,
                          background: active ? 'rgba(34,197,94,0.12)' : '#2d3748',
                          color: active ? '#22c55e' : '#64748b',
                          fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all 0.15s',
                        }}
                      >
                        {e.icon} {e.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Results count */}
          <div style={{
            padding: '8px 16px', borderBottom: '1px solid #2d2f3e', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              {pgLoading
                ? '⏳ A carregar...'
                : `${filtered.length} parque${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`
              }
            </span>
            {hasFilters && (
              <button
                onClick={clearFilters}
                style={{
                  fontSize: 11, color: '#6366f1', background: 'none', border: 'none',
                  cursor: 'pointer', fontFamily: 'inherit', padding: 0,
                }}
              >
                Limpar filtros
              </button>
            )}
          </div>

          {/* Playground list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
            {!location && !locLoading && (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: '#64748b' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📍</div>
                <p style={{ margin: '0 0 12px', fontSize: 13, lineHeight: 1.5 }}>
                  Ative a geolocalização para ver parques próximos
                </p>
                {locErr && (
                  <button
                    onClick={() => setManual(LISBON.lat, LISBON.lon)}
                    style={{
                      padding: '7px 14px', borderRadius: 8, border: 'none',
                      background: '#2d3748', color: '#e2e8f0', fontSize: 12,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Usar Lisboa como localização
                  </button>
                )}
              </div>
            )}

            {location && filtered.length === 0 && !pgLoading && (
              <div style={{ textAlign: 'center', padding: '24px 12px', color: '#64748b' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>
                  {hasFilters
                    ? 'Nenhum parque corresponde aos filtros selecionados'
                    : 'Nenhum parque encontrado nesta área'
                  }
                </p>
              </div>
            )}

            {filtered.map(p => (
              <PlaygroundCard
                key={p.id}
                p={p}
                selected={selected?.id === p.id}
                onClick={() => selectPlayground(p)}
              />
            ))}
          </div>
        </div>

        {/* ── Map area ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

          {/* Location loading overlay */}
          {locLoading && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: '#0f1117', gap: 12,
            }}>
              <div style={{ fontSize: 48 }}>📍</div>
              <div style={{ fontSize: 15, color: '#94a3b8' }}>A obter a sua localização...</div>
            </div>
          )}

          {/* Location error overlay */}
          {locErr && !location && !locLoading && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: '#0f1117', gap: 14, padding: 32, textAlign: 'center',
            }}>
              <div style={{ fontSize: 48 }}>⚠️</div>
              <div style={{ fontSize: 16, color: '#ef4444', fontWeight: 600 }}>
                Localização não disponível
              </div>
              <div style={{ fontSize: 13, color: '#64748b', maxWidth: 320, lineHeight: 1.6 }}>
                {locErr}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  onClick={request}
                  style={{
                    padding: '8px 18px', borderRadius: 8, border: 'none',
                    background: '#6366f1', color: '#fff',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Tentar novamente
                </button>
                <button
                  onClick={() => setManual(LISBON.lat, LISBON.lon)}
                  style={{
                    padding: '8px 18px', borderRadius: 8, border: 'none',
                    background: '#2d3748', color: '#e2e8f0',
                    fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Usar Lisboa
                </button>
              </div>
            </div>
          )}

          {/* Map */}
          {location && (
            <PlaygroundMap
              location={location}
              playgrounds={filtered}
              selected={selected}
              onSelect={selectPlayground}
            />
          )}

          {/* Playgrounds loading toast */}
          {pgLoading && location && (
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(22,25,39,0.92)', borderRadius: 8,
              padding: '7px 16px', fontSize: 13, color: '#94a3b8',
              zIndex: 999, boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
              border: '1px solid #2d2f3e', whiteSpace: 'nowrap',
            }}>
              ⏳ A carregar parques...
            </div>
          )}

          {/* Error toast */}
          {pgErr && (
            <div style={{
              position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444',
              borderRadius: 8, padding: '8px 16px', fontSize: 12,
              color: '#ef4444', zIndex: 999, whiteSpace: 'nowrap',
            }}>
              ⚠️ {pgErr}
            </div>
          )}

          {/* Detail panel */}
          {selected && location && (
            <DetailPanel p={selected} onClose={() => setSelected(null)} />
          )}
        </div>
      </div>
    </div>
  );
}
