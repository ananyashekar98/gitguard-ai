import React, { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Github, AlertCircle } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className={`p-4 rounded-lg bg-white shadow-sm border-l-4 ${color}`}>
    <div className="flex items-center gap-3">
      <Icon size={20} />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  </div>
);

const App = () => {

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ total: 0, bugs: 0, score: 100 });


 useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/reviews');
        
        // 1. Check if the server actually returned a 200 OK status
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();

        // 2. Critical Fix: Ensure 'data' is actually an array before processing
        // This prevents the "data.filter is not a function" crash
        if (Array.isArray(data)) {
          setReviews(data);

          // Dynamic Stats Calculation
          const issues = data.filter(r => r.status === 'Critical').length;
          
          setStats({
            total: data.length,
            bugs: issues,
            score: data.length ? Math.round(((data.length - issues) / data.length) * 100) : 100
          });
        } else {
          // If the backend sends an error object instead of an array, reset to empty
          console.error("Expected an array of reviews but got:", data);
          setReviews([]);
        }

      } catch (err) {
        // 3. Prevent the UI from locking up if the Dashboard Sync fails
        console.error("Dashboard Sync Failed:", err);
        setReviews([]); // Fallback to empty array to satisfy reviews.map()
      }
    };

    fetchReviews();
    const interval = setInterval(fetchReviews, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <header className="flex justify-between items-center mb-12 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
             <ShieldCheck size={32} className="text-white" />
          </div>
           <h1 className="text-3xl font-bold tracking-tight text-white">GitGuard <span className="text-indigo-500">AI</span></h1>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full border border-slate-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-mono text-slate-300 uppercase">Sentinel Active: Port 3000</span>
         </div>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard icon={Github} label="Total PRs Scanned" value={stats.total} color="text-blue-400" />
        <StatCard icon={AlertCircle} label="Issues Detected" value={stats.bugs} color="text-red-400" />
         <StatCard icon={ShieldCheck} label="Security Score" value={`${stats.score}%`} color="text-green-400" />
      </div>

      
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-indigo-400" />
            <h2 className="text-xl font-semibold text-white">Live Analysis Feed</h2>
          </div>
          {/* Week 4: Setting Toggle for "Strict Mode"[cite: 1] */}
          <button className="text-xs bg-slate-800 px-3 py-1 rounded border border-slate-700 hover:bg-slate-700">
            Strict Mode: ON
          </button>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase">
            <tr>
              <th className="p-4">Repository</th>
              <th className="p-4">PR</th>
              <th className="p-4">Findings Preview</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {reviews.map((item) => (
              <tr key={item._id} className="hover:bg-slate-800/30">
                <td className="p-4 font-mono text-sm text-indigo-300">{item.repoName}</td>
                <td className="p-4 font-bold">#{item.prNumber}</td>
                <td className="p-4 text-slate-400 text-sm truncate max-w-md">
                  {item.analysis.substring(0, 60)}...
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    item.status === 'Critical' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                  }`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default App;