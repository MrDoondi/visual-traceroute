import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import L from 'leaflet';

// Fix Leaflet's default icon paths to use public folder
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

const MAP_CENTER = [20, 0];
const MAP_ZOOM = 2;

function App() {
  const [target, setTarget] = useState('');
  const [hops, setHops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTraceroute = async () => {
    setLoading(true);
    setError('');
    setHops([]);
    try {
      const res = await axios.get(`/traceroute?target=${encodeURIComponent(target)}`);
      if (Array.isArray(res.data)) {
        setHops(res.data);
        if (!res.data.length) setError('No hops found.');
      } else if (res.data && res.data.error) {
        setError(res.data.error);
        setHops([]);
      } else {
        setError('Unexpected response from server.');
        setHops([]);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch traceroute.');
    } finally {
      setLoading(false);
    }
  };

  // Defensive: always use an array for mapping
  const safeHops = Array.isArray(hops) ? hops : [];
  const polylinePositions = safeHops.map(hop => [hop.lat, hop.lon]);

  return (
    <div className="App">
      <h1>Visual Traceroute</h1>
      <div style={{ margin: '1em' }}>
        <input
          type="text"
          value={target}
          onChange={e => setTarget(e.target.value)}
          placeholder="Enter domain or IP"
          style={{ width: 250, padding: 8 }}
        />
        <button onClick={handleTraceroute} disabled={loading || !target} style={{ marginLeft: 8, padding: 8 }}>
          {loading ? 'Tracing...' : 'Trace'}
        </button>
      </div>
      {error && <div style={{ color: 'red', marginBottom: '1em' }}>{error}</div>}
      <div style={{ height: '70vh', width: '90%', margin: '0 auto', maxWidth: 1200 }}>
        <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {safeHops.map((hop, idx) => (
            hop.lat && hop.lon && (
              <Marker key={idx} position={[hop.lat, hop.lon]}>
                <Popup>
                  <div>
                    <strong>IP:</strong> {hop.ip}<br />
                    <strong>Country:</strong> {hop.country}
                    {hop.countryCode && (
                      <img
                        src={`https://flagcdn.com/24x18/${hop.countryCode.toLowerCase()}.png`}
                        alt={hop.countryCode}
                        style={{ marginLeft: 4, verticalAlign: 'middle' }}
                      />
                    )}
                    <br />
                    <strong>ISP:</strong> {hop.isp}<br />
                    <strong>Latency:</strong> {hop.ping ? hop.ping + ' ms' : 'N/A'}
                  </div>
                </Popup>
              </Marker>
            )
          ))}
          {polylinePositions.length > 1 && <Polyline positions={polylinePositions} color="blue" />}
        </MapContainer>
      </div>
    </div>
  );
}

export default App; 