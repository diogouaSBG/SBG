import { useState, useEffect, useCallback } from 'react';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export function usePlaygrounds(location, radius) {
  const [playgrounds, setPlaygrounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    try {
      const query = `[out:json][timeout:30];
(
  node["leisure"="playground"](around:${radius},${location.lat},${location.lon});
  way["leisure"="playground"](around:${radius},${location.lat},${location.lon});
  relation["leisure"="playground"](around:${radius},${location.lat},${location.lon});
);
out center body;`;
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
      });
      if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
      const data = await res.json();
      setPlaygrounds(parse(data.elements, location));
    } catch (e) {
      setError('Não foi possível carregar os parques: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [location, radius]);

  useEffect(() => { load(); }, [load]);

  return { playgrounds, loading, error, refresh: load };
}

function parse(elements, userLoc) {
  return elements
    .map((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      if (lat == null || lon == null) return null;
      const tags = el.tags || {};
      return {
        id: `${el.type}-${el.id}`,
        lat,
        lon,
        name: tags.name || 'Parque Infantil',
        surface: tags.surface || null,
        lit: tags.lit === 'yes',
        wheelchair: tags.wheelchair === 'yes',
        fence: tags.fence === 'yes' || tags.barrier === 'fence',
        minAge: tags.min_age ? Number(tags.min_age) : null,
        maxAge: tags.max_age ? Number(tags.max_age) : null,
        openingHours: tags.opening_hours || null,
        equipment: extractEquipment(tags),
        distance: haversine(userLoc.lat, userLoc.lon, lat, lon),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance);
}

function extractEquipment(tags) {
  const keys = ['swing', 'slide', 'climbingframe', 'sandpit', 'seesaw', 'merry_go_round', 'springy', 'water'];
  return keys.filter((k) => tags[`playground:${k}`]);
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
