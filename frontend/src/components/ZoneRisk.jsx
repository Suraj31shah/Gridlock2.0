import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import { ShieldAlert } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ZoneRisk = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/api/zone-risk`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const getHeatmapColor = (value) => {
    if (value === 0) return 'bg-slate-50 text-slate-400 border-slate-100';
    if (value < 50) return 'bg-blue-50 text-blue-700 border-blue-100';
    if (value < 150) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (value < 300) return 'bg-orange-50 text-orange-700 border-orange-100';
    return 'bg-red-50 text-red-700 border-red-100';
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldAlert size={24} className="text-red-500" />
          Weekly Zone Risk Forecast
        </h2>
        <p className="text-slate-500 mt-1">Based on historical event frequencies. Values indicate expected incident count.</p>
      </div>

      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-2 min-w-[800px]">
            <div className="font-semibold text-slate-500 flex items-end pb-2">Zone</div>
            {DAYS.map(day => (
              <div key={day} className="text-center font-semibold text-slate-500 pb-2">{day}</div>
            ))}
            
            {data.map((row, i) => (
              <div key={i} className="contents group">
                <div className="py-3 pr-4 font-medium text-slate-700 flex items-center border-t border-slate-100 group-hover:bg-slate-50">
                  {row.zone}
                </div>
                {[0, 1, 2, 3, 4, 5, 6].map(d => {
                  const val = row[`day_${d}`] || 0;
                  return (
                    <div key={d} className="p-1 border-t border-slate-100 group-hover:bg-slate-50">
                      <div className={`w-full h-full min-h-12 rounded-lg border flex items-center justify-center font-medium text-sm transition-colors ${getHeatmapColor(val)}`}>
                        {val > 0 ? val : '-'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-6 flex items-center gap-6 text-sm text-slate-500 border-t border-slate-100 pt-4">
        <span>Risk Level:</span>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-slate-50 border border-slate-200"></div> None</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-blue-50 border border-blue-200"></div> Low</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-amber-50 border border-amber-200"></div> Medium</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-orange-50 border border-orange-200"></div> High</div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded bg-red-50 border border-red-200"></div> Severe</div>
      </div>
    </div>
  );
};

export default ZoneRisk;
