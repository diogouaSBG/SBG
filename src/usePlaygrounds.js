import { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';

export function usePlaygrounds(location) {
  const [playgrounds, setPlaygrounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/parques.xlsx');
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
      const buffer = await res.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      setPlaygrounds(parse(rows, location));
    } catch (e) {
      setError('Não foi possível carregar os parques: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => { load(); }, [load]);

  return { playgrounds, loading, error, refresh: load };
}

function parse(rows, userLoc) {
  return rows
    .map((row) => {
      const lat = parseFloat(row['Latitude']);
      const lon = parseFloat(row['Longitude']);
      if (isNaN(lat) || isNaN(lon)) return null;

      const yn = (v) => String(v || '').trim().toLowerCase() === 'sim';

      return {
        id: `${lat}-${lon}`,
        lat,
        lon,
        name: String(row['Nome'] || 'Parque Infantil').trim(),
        address: String(row['Morada'] || '').trim(),
        surface: String(row['Piso'] || '').trim() || null,
        lit: yn(row['Iluminado']),
        wheelchair: yn(row['Acessivel']),
        fence: yn(row['Vedado']),
        minAge: row['Idade_Min'] != null ? Number(row['Idade_Min']) : null,
        maxAge: row['Idade_Max'] != null ? Number(row['Idade_Max']) : null,
        openingHours: String(row['Horario'] || '').trim() || null,
        equipment: [
          yn(row['Baloicos']) && 'swing',
          yn(row['Escorrega']) && 'slide',
          yn(row['Escalada']) && 'climbingframe',
          yn(row['Areia']) && 'sandpit',
          yn(row['Balance']) && 'seesaw',
          yn(row['Carrossel']) && 'merry_go_round',
        ].filter(Boolean),
        distance: userLoc ? haversine(userLoc.lat, userLoc.lon, lat, lon) : null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
