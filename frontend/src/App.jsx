import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import HotspotMap from './components/HotspotMap';
import Predictor from './components/Predictor';
import EventHistory from './components/EventHistory';
import ZoneRisk from './components/ZoneRisk';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-900 w-full">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full h-full">
          <div className="max-w-7xl mx-auto h-full">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/map" element={<HotspotMap />} />
              <Route path="/predict" element={<Predictor />} />
              <Route path="/history" element={<EventHistory />} />
              <Route path="/risk" element={<ZoneRisk />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
