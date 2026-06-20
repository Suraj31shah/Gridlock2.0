import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';
import { Filter, Layers } from 'lucide-react';

const HeatmapLayer = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    const heat = L.heatLayer(points, { radius: 25, blur: 15, maxZoom: 17 }).addTo(map);
    return () => map.removeLayer(heat);
  }, [map, points]);
  return null;
};

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const getMarkerIcon = (cause) => {
  let color = 'blue';
  if (cause === 'accident') color = 'red';
  else if (cause === 'construction') color = 'orange';
  else if (['water_logging', 'pot_holes'].includes(cause)) color = 'violet';
  
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const HotspotMap = () => {
  const [events, setEvents] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterZone, setFilterZone] = useState('');
  const [viewMode, setViewMode] = useState('both'); // both, markers, heat
  
  useEffect(() => {
    let url = 'http://localhost:8000/api/events';
    if (filterZone) {
      url += `?zone=${encodeURIComponent(filterZone)}`;
    }
    setLoading(true);
    
    Promise.all([
      axios.get(url),
      axios.get('http://localhost:8000/api/heatmap')
    ]).then(([eventsRes, heatRes]) => {
      setEvents(eventsRes.data);
      setHeatmapData(heatRes.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [filterZone]);

  const uniqueZones = [...new Set(events.map(e => e.zone).filter(Boolean))];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between z-10 bg-white">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Congestion Hotspots</h2>
          <p className="text-sm text-slate-500">{events.length} events displayed</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <Layers size={16} />
            <select 
              className="bg-transparent outline-none font-medium"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="both">Both</option>
              <option value="markers">Markers Only</option>
              <option value="heat">Heatmap Only</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <Filter size={16} />
            <select 
              className="bg-transparent outline-none font-medium"
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
            >
              <option value="">All Zones</option>
              {uniqueZones.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative z-0">
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-[1000] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
        <MapContainer 
          center={[12.9716, 77.5946]} 
          zoom={11} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          {(viewMode === 'both' || viewMode === 'heat') && heatmapData.length > 0 && (
            <HeatmapLayer points={heatmapData} />
          )}
          
          {(viewMode === 'both' || viewMode === 'markers') && events.map(event => (
            event.latitude && event.longitude && (
              <Marker 
                key={event.id} 
                position={[event.latitude, event.longitude]}
                icon={getMarkerIcon(event.event_cause)}
              >
                <Popup className="rounded-xl overflow-hidden">
                  <div className="p-1">
                    <div className="font-bold text-slate-800 capitalize mb-1 text-base">{event.event_cause?.replace('_', ' ')}</div>
                    <div className="text-xs text-slate-500 mb-2">{event.junction || event.zone}</div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="block text-xs text-slate-400">Status</span>
                        <span className="font-medium capitalize">{event.status}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="block text-xs text-slate-400">Duration</span>
                        <span className="font-medium">{event.duration_hours_clean?.toFixed(1)}h</span>
                      </div>
                    </div>
                    
                    {event.requires_road_closure_bool && (
                      <div className="mt-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium inline-block">
                        Road Closure Required
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default HotspotMap;
