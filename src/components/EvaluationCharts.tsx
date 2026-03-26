import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

interface EvaluationChartsProps {
  evaluations: any[];
}

export default function EvaluationCharts({ evaluations }: EvaluationChartsProps) {
  const historyData = evaluations.slice().reverse().map(ev => ({
    date: new Date(ev.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    weight: ev.data.anthropometry?.weight,
    fat: ev.data.results?.fatPercentage,
    lean: ev.data.results?.leanMass,
    skeletalMuscle: ev.data.bioimpedance?.skeletalMuscle ? Number(ev.data.bioimpedance?.skeletalMuscle) : null,
    visceralFat: ev.data.bioimpedance?.visceralFat ? Number(ev.data.bioimpedance?.visceralFat) : null,
    bodyAge: ev.data.bioimpedance?.bodyAge ? Number(ev.data.bioimpedance?.bodyAge) : null,
    actualAge: ev.data.results?.age ? Number(ev.data.results?.age) : null
  }));

  const hasBioimpedance = historyData.some(d => d.visceralFat !== null || d.skeletalMuscle !== null);

  const latest = evaluations[0];
  const pieData = latest ? [
    { name: 'Gordura', value: latest.data.results?.fatMass || 0, color: '#f87171' },
    { name: 'Massa Magra', value: latest.data.results?.leanMass || 0, color: '#34d399' }
  ] : [];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composition Pie Chart */}
        <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h4 className="text-white font-bold mb-6 text-lg">Distribuição de Massa</h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
             {pieData.map(d => (
               <div key={d.name} className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                   <span className="text-sm text-zinc-400">{d.name}</span>
                 </div>
                 <span className="text-sm font-bold text-white">{d.value.toFixed(1)} kg</span>
               </div>
             ))}
          </div>
        </div>

        {/* History Evolution Line Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h4 className="text-white font-bold mb-6 text-lg">Evolução Histórica</h4>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }}
                />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="weight" name="Peso (kg)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="fat" name="Gordura (%)" stroke="#f87171" strokeWidth={3} dot={{ r: 4, fill: '#f87171' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Bioimpedance Specific Charts */}
      {hasBioimpedance && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h4 className="text-white font-bold mb-6 text-lg">Músculo Esquelético vs Gordura Visceral</h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }} />
                  <Legend iconType="circle" />
                  <Line type="monotone" dataKey="skeletalMuscle" name="Mús. Esquelético (%)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} connectNulls />
                  <Line type="monotone" dataKey="visceralFat" name="Gordura Visceral (Nível)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h4 className="text-white font-bold mb-6 text-lg">Idade Corporal vs Cronológica</h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px', color: '#fff' }} />
                  <Legend iconType="circle" />
                  <Line type="stepAfter" dataKey="actualAge" name="Idade Real" stroke="#71717a" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
                  <Line type="monotone" dataKey="bodyAge" name="Idade Corporal" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899' }} activeDot={{ r: 6 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      
      {/* Table view for evolution */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-800/50">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Data</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Peso</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">% Gordura</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Massa Magra</th>
              <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Evolução (Peso)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {evaluations.map((ev, idx) => {
              const previous = evaluations[idx + 1];
              const diff = previous ? ev.data.anthropometry?.weight - previous.data.anthropometry?.weight : 0;
              
              return (
                <tr key={ev.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-white font-medium">{new Date(ev.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-sm text-zinc-300">{ev.data.anthropometry?.weight} kg</td>
                  <td className="px-6 py-4 text-sm text-zinc-300">{ev.data.results?.fatPercentage?.toFixed(1)}%</td>
                  <td className="px-6 py-4 text-sm text-emerald-400 font-bold">{ev.data.results?.leanMass?.toFixed(1)} kg</td>
                  <td className="px-6 py-4 text-sm">
                    {diff !== 0 && (
                      <span className={`flex items-center gap-1 font-bold ${diff > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {diff > 0 ? `+${diff.toFixed(1)}` : `${diff.toFixed(1)}`} kg
                      </span>
                    )}
                    {diff === 0 && <span className="text-zinc-500">-</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
