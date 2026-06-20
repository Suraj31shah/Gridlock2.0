import { Users, Truck, AlertCircle, Navigation } from 'lucide-react';

const Recommender = ({ data }) => {
  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Users size={20} className="text-blue-600" />
        Resource Deployment Recommendation
      </h3>

      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
          <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600 mt-1">
            <Users size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800">Personnel Required</h4>
            <p className="text-sm text-slate-600 mt-1">
              Deploy <span className="font-bold text-blue-700">{data.officer_count} officers</span> to the location.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
          <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600 mt-1">
            <Truck size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800">Equipment to Dispatch</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {data.equipment.map((item, i) => (
                <span key={i} className="text-xs font-medium bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="p-2 bg-white rounded-lg shadow-sm text-slate-600 mt-1">
            <Navigation size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-800">Operational Directive</h4>
            <p className="text-sm text-slate-600 mt-1">{data.diversion_note}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <AlertCircle size={16} className={
            data.urgency === 'High' ? 'text-red-500' : 
            data.urgency === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
          } />
          Urgency Level: <span className={
            data.urgency === 'High' ? 'text-red-600' : 
            data.urgency === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
          }>{data.urgency}</span>
        </div>
        <div className="text-sm font-medium text-slate-500">
          Expected clear time: <span className="text-slate-800">{data.expected_clear_time}</span>
        </div>
      </div>
    </div>
  );
};

export default Recommender;
