import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const userIcon = L.divIcon({
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#6366f1;border:2px solid white;box-shadow:0 0 0 5px rgba(99,102,241,0.2)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  className: '',
});

function makePgIcon(selected) {
  const bg = selected ? '#f59e0b' : '#22c55e';
  const shadow = selected ? 'rgba(245,158,11,0.4)' : 'rgba(34,197,94,0.3)';
  return L.divIcon({
    html: `<div style="width:36px;height:36px;border-radius:50%;background:${bg};border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:19px;box-shadow:0 2px 10px ${shadow};cursor:pointer">🛝</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
    className: '',
  });
}

function RecenterMap({ location }) {
  const map = useMap();
  useEffect(() => {
    if (location) map.setView([location.lat, location.lon], map.getZoom());
  }, [location, map]); // eslint-disable-line
  return null;
}

export function PlaygroundMap({ location, playgrounds, selected, onSelect }) {
  if (!location) return null;

  return (
    <MapContainer
      center={[location.lat, location.lon]}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <RecenterMap location={location} />
      {location.accuracy && (
        <Circle
          center={[location.lat, location.lon]}
          radius={location.accuracy}
          pathOptions={{
            color: '#6366f1',
            fillColor: '#6366f1',
            fillOpacity: 0.07,
            weight: 1,
            dashArray: '5',
          }}
        />
      )}
      <Marker position={[location.lat, location.lon]} icon={userIcon}>
        <Popup>
          <strong>A sua localização</strong>
        </Popup>
      </Marker>
      {playgrounds.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lon]}
          icon={makePgIcon(selected?.id === p.id)}
          eventHandlers={{ click: () => onSelect(p) }}
        >
          <Popup>
            <strong>{p.name}</strong>
            <br />
            {fmtDist(p.distance)} de distância
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function fmtDist(m) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}
