import { useState } from 'react';
import axios from 'axios';
import { Calculator, AlertTriangle, Clock, ShieldAlert, Car, MapPin, Loader2, Factory, IndianRupee, History } from 'lucide-react';
import Recommender from './Recommender';

const Predictor = () => {
  const [formData, setFormData] = useState({
    event_cause: 'vehicle_breakdown',
    event_type: 'unplanned',
    zone: 'West Zone 1',
    requires_road_closure: false,
    priority: 'Low',
    hour_of_day: 8,
    day_of_week: 0,
    corridor: 'non-corridor'
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [similarEvents, setSimilarEvents] = useState([]);

  const causes = [
    'vehicle_breakdown', 'accident', 'construction', 'water_logging', 
    'tree_fall', 'pot_holes', 'public_event', 'procession', 'vip_movement', 'protest', 'others'
  ];
  
  const zones = [
    'West Zone 1', 'East Zone 1', 'North Zone 1', 'South Zone 1', 'Central Zone 1',
    'West Zone 2', 'East Zone 2', 'North Zone 2', 'South Zone 2', 'Central Zone 2'
  ];

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      ...formData,
      hour_of_day: parseInt(formData.hour_of_day),
      day_of_week: parseInt(formData.day_of_week)
    };

    try {
      const [recRes, simRes] = await Promise.all([
        axios.post('http://localhost:8000/api/recommend', payload),
        axios.get(`http://localhost:8000/api/similar?cause=${formData.event_cause}&zone=${encodeURIComponent(formData.zone)}`)
      ]);
      setResult(recRes.data);
      setSimilarEvents(simRes.data);
    } catch (err) {
      console.error(err);
      alert('Error making prediction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col h-full overflow-y-auto">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calculator size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Impact Predictor</h2>
            <p className="text-sm text-slate-500">ML-driven forecasting model</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 flex-1">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Event Cause</label>
              <div className="relative">
                <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                  name="event_cause" 
                  value={formData.event_cause} 
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors appearance-none"
                >
                  {causes.map(c => <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
                <select name="event_type" value={formData.event_type} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                  <option value="unplanned">Unplanned</option>
                  <option value="planned">Planned</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select name="priority" value={formData.priority} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                  <option value="Low">Low</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Zone</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select name="zone" value={formData.zone} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors appearance-none">
                  {zones.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Day of Week</label>
                <select name="day_of_week" value={formData.day_of_week} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors">
                  <option value="0">Monday</option>
                  <option value="1">Tuesday</option>
                  <option value="2">Wednesday</option>
                  <option value="3">Thursday</option>
                  <option value="4">Friday</option>
                  <option value="5">Saturday</option>
                  <option value="6">Sunday</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hour (0-23)</label>
                <input type="number" name="hour_of_day" min="0" max="23" value={formData.hour_of_day} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors" />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex-1">
                <input type="checkbox" name="requires_road_closure" checked={formData.requires_road_closure} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm font-medium text-slate-700">Road Closure</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors flex-1">
                <input type="checkbox" name="corridor" value="corridor" checked={formData.corridor === 'corridor'} onChange={(e) => setFormData({...formData, corridor: e.target.checked ? 'corridor' : 'non-corridor'})} className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm font-medium text-slate-700">Corridor</span>
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2 mt-auto"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Predict Impact'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-7 flex flex-col h-full gap-6">
        {result ? (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ShieldAlert size={20} className="text-blue-600" />
                Prediction Results
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Clock size={64} />
                  </div>
                  <span className="text-sm font-medium text-slate-500 mb-1">Expected Resolution Time</span>
                  <span className="text-3xl font-bold text-slate-800">
                    {result.prediction.predicted_duration_hours} <span className="text-lg text-slate-500 font-medium">hrs</span>
                  </span>
                </div>
                
                <div className={`p-5 rounded-2xl border flex flex-col justify-center relative overflow-hidden ${
                  result.prediction.severity_label === 'High' ? 'bg-red-50 border-red-100' : 
                  result.prediction.severity_label === 'Medium' ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'
                }`}>
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <AlertTriangle size={64} />
                  </div>
                  <span className={`text-sm font-medium mb-1 ${
                    result.prediction.severity_label === 'High' ? 'text-red-600' : 
                    result.prediction.severity_label === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>Severity Assessment</span>
                  <span className={`text-3xl font-bold ${
                    result.prediction.severity_label === 'High' ? 'text-red-700' : 
                    result.prediction.severity_label === 'Medium' ? 'text-amber-700' : 'text-emerald-700'
                  }`}>
                    {result.prediction.severity_label}
                  </span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                  <span>AI Confidence Score</span>
                  <span>{result.prediction.confidence}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${result.prediction.confidence}%` }}></div>
                </div>
              </div>
            </div>
            
            <Recommender data={result.recommendation} />

            {/* Economic Impact Calculator */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <IndianRupee size={20} className="text-emerald-600" />
                Wider City Impact Estimate
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-2">
                    <Car size={16} /> Vehicles Delayed
                  </div>
                  <div className="text-2xl font-bold text-slate-800">
                    {Math.round(result.prediction.predicted_duration_hours * 800 * (formData.corridor === 'corridor' ? 2 : 1) * ((formData.hour_of_day >= 7 && formData.hour_of_day <= 10) || (formData.hour_of_day >= 17 && formData.hour_of_day <= 20) ? 1.5 : 1)).toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                  <div className="text-red-700 text-sm font-medium mb-1 flex items-center gap-2">
                    <IndianRupee size={16} /> Productivity Loss
                  </div>
                  <div className="text-2xl font-bold text-red-800">
                    ₹{(Math.round(result.prediction.predicted_duration_hours * 800 * (formData.corridor === 'corridor' ? 2 : 1) * ((formData.hour_of_day >= 7 && formData.hour_of_day <= 10) || (formData.hour_of_day >= 17 && formData.hour_of_day <= 20) ? 1.5 : 1)) * 150 * result.prediction.predicted_duration_hours).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-4 bg-slate-800 text-white border border-slate-700 rounded-xl">
                  <div className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2">
                    <Factory size={16} /> Excess CO₂ (Tons)
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {((Math.round(result.prediction.predicted_duration_hours * 800 * (formData.corridor === 'corridor' ? 2 : 1) * ((formData.hour_of_day >= 7 && formData.hour_of_day <= 10) || (formData.hour_of_day >= 17 && formData.hour_of_day <= 20) ? 1.5 : 1))) * 0.002 * result.prediction.predicted_duration_hours).toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* Historical Precedents */}
            {similarEvents.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <History size={20} className="text-indigo-600" />
                  Historical Precedents (AI Case Law)
                </h3>
                <p className="text-sm text-slate-500 mb-4">Past {formData.event_cause.replace('_', ' ')} events in this zone that the AI used for benchmarking:</p>
                
                <div className="space-y-3">
                  {similarEvents.map((event, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors">
                      <div>
                        <div className="font-medium text-slate-800">{new Date(event.start_datetime).toLocaleDateString()} at {new Date(event.start_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        <div className="text-xs text-slate-500">Location: {event.junction || formData.zone}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">{event.duration_hours_clean.toFixed(1)} hrs</div>
                        <div className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded mt-1 inline-block capitalize">{event.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <Calculator size={48} className="mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No Prediction Yet</h3>
            <p className="max-w-xs text-sm">Fill in the event details on the left and click predict to forecast the impact and get resource recommendations.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Predictor;
