import { useState, useEffect } from 'react';
import { Plus, ClipboardList, TrendingUp, Download, Trash2, Edit2, Info, Image as ImageIcon, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { fetcher } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Modal from './ui/Modal';
import EvaluationForm from './EvaluationForm';
import EvaluationCharts from './EvaluationCharts';

interface EvaluationTabProps {
  studentId: string | number;
  studentName: string;
}

export default function EvaluationTab({ studentId, studentName }: EvaluationTabProps) {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEval, setEditingEval] = useState<any>(null);
  const [activeView, setActiveView] = useState<'list' | 'evolve' | 'bio'>('list');
  const [viewPhotos, setViewPhotos] = useState<any | null>(null);
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);

  useEffect(() => {
    loadEvaluations();
  }, [studentId]);

  async function loadEvaluations() {
    try {
      const data = await fetcher<any[]>(`/api/evaluations?student_id=${studentId}`);
      setEvaluations(data);
    } catch (error) {
      console.error('Failed to load evaluations', error);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir avaliação?')) return;
    try {
      await fetcher(`/api/evaluations/${id}`, { method: 'DELETE' });
      loadEvaluations();
    } catch (error) {
      console.error('Failed to delete evaluation', error);
    }
  }

  const EvaluationCard = ({ ev, user, setEditingEval, setIsModalOpen, handleDelete, setViewPhotos, setCurrentPhotoIdx }: any) => (
    <div key={ev.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-violet-500/30 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">
            {new Date(ev.date).toLocaleDateString('pt-BR')}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              ev.data?.protocol === 'manual' ? 'bg-violet-500/20 text-violet-400' : 'bg-zinc-800 text-zinc-500'
            }`}>
              {ev.data?.protocol === 'manual' ? 'Bioimpedância' : 
               ev.data?.protocol === 'guedes' ? 'Guedes (3)' :
               ev.data?.protocol === 'jp3' ? 'Jackson Pollock (3)' : 'Jackson Pollock (7)'}
            </span>
            <p className="text-sm text-zinc-500">Objetivo: {ev.data.anamnesis?.objective || 'N/A'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {user?.role === 'admin' && (
            <>
              <button onClick={() => { setEditingEval(ev); setIsModalOpen(true); }} className="p-2 text-zinc-500 hover:text-violet-400 transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(ev.id)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {ev.data.photos && Object.values(ev.data.photos).some(p => p) && (
            <button 
              onClick={() => {
                setViewPhotos(ev.data.photos);
                setCurrentPhotoIdx(0);
              }}
              className="p-2 text-violet-400 hover:bg-violet-400/10 rounded-lg transition-colors flex items-center gap-1"
              title="Ver fotos da avaliação"
            >
              <ImageIcon className="w-5 h-5" />
              <span className="text-[10px] font-bold">{Object.values(ev.data.photos).filter(p => p).length}</span>
            </button>
          )}
          <button className="p-2 text-zinc-500 hover:text-emerald-400 transition-colors">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        <div className="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/30">
          <p className="text-[10px] text-zinc-500 uppercase font-black mb-1">Peso</p>
          <p className="text-lg font-bold text-white leading-none">{ev.data.anthropometry?.weight} <span className="text-[10px]">kg</span></p>
        </div>
        <div className="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/30">
          <p className="text-[10px] text-zinc-500 uppercase font-black mb-1">Gordura</p>
          <p className="text-lg font-bold text-violet-400 leading-none">{ev.data.results?.fatPercentage?.toFixed(1)}%</p>
        </div>
        {ev.data.protocol === 'manual' ? (
          <>
            <div className="bg-zinc-800/50 p-3 rounded-xl border border-violet-500/20">
              <p className="text-[10px] text-violet-400 uppercase font-black mb-1 text-center">G. Visceral</p>
              <p className="text-lg font-bold text-white leading-none text-center">{ev.data.bioimpedance?.visceralFat || '--'}</p>
            </div>
            <div className="bg-zinc-800/50 p-3 rounded-xl border border-violet-500/20">
              <p className="text-[10px] text-violet-400 uppercase font-black mb-1 text-center">M. Esq.</p>
              <p className="text-lg font-bold text-white leading-none text-center">{ev.data.bioimpedance?.skeletalMuscle || '--'}%</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/30">
              <p className="text-[10px] text-zinc-500 uppercase font-black mb-1">IMC</p>
              <p className="text-lg font-bold text-white leading-none">{ev.data.results?.imc?.toFixed(1)}</p>
            </div>
            <div className="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/30">
              <p className="text-[10px] text-zinc-500 uppercase font-black mb-1">M. Magra</p>
              <p className="text-lg font-bold text-emerald-400 leading-none">{ev.data.results?.leanMass?.toFixed(1)} <span className="text-[10px]">kg</span></p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const EmptyState = ({ message = "Nenhuma avaliação registrada ainda." }: { message?: string }) => (
    <div className="col-span-full py-20 text-center">
      <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <ClipboardList className="w-8 h-8 text-zinc-600" />
      </div>
      <p className="text-zinc-500">{message}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-zinc-900 p-4 rounded-2xl border border-zinc-800 gap-4">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setActiveView('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeView === 'list' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
          >
            <ClipboardList className="w-4 h-4" /> Histórico
          </button>
          <button 
            onClick={() => setActiveView('evolve')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeView === 'evolve' ? 'bg-emerald-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
          >
            <TrendingUp className="w-4 h-4" /> Evolução
          </button>
          <button 
            onClick={() => setActiveView('bio')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeView === 'bio' ? 'bg-amber-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
          >
            <Activity className="w-4 h-4" /> Bioimpedância
          </button>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={() => { setEditingEval(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="w-5 h-5" /> Nova Avaliação
          </button>
        )}
      </div>

      {activeView === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {evaluations.map((ev) => (
            <EvaluationCard key={ev.id} ev={ev} user={user} setEditingEval={setEditingEval} setIsModalOpen={setIsModalOpen} handleDelete={handleDelete} setViewPhotos={setViewPhotos} setCurrentPhotoIdx={setCurrentPhotoIdx} />
          ))}
          {evaluations.length === 0 && <EmptyState />}
        </div>
      )}

      {activeView === 'evolve' && <EvaluationCharts evaluations={evaluations} />}

      {activeView === 'bio' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {evaluations.filter(ev => ev.data?.protocol === 'manual').map((ev) => (
              <EvaluationCard key={ev.id} ev={ev} user={user} setEditingEval={setEditingEval} setIsModalOpen={setIsModalOpen} handleDelete={handleDelete} setViewPhotos={setViewPhotos} setCurrentPhotoIdx={setCurrentPhotoIdx} />
            ))}
            {evaluations.filter(ev => ev.data?.protocol === 'manual').length === 0 && <EmptyState message="Nenhuma bioimpedância registrada." />}
          </div>
          <EvaluationCharts evaluations={evaluations.filter(ev => ev.data?.protocol === 'manual')} />
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingEval ? "Editar Avaliação" : "Nova Avaliação Física"}
        size="large"
      >
        <EvaluationForm 
          studentId={studentId} 
          initialData={editingEval} 
          onSuccess={() => { setIsModalOpen(false); loadEvaluations(); }} 
        />
      </Modal>

      {/* Photo Viewer Modal */}
      <Modal 
        isOpen={!!viewPhotos} 
        onClose={() => setViewPhotos(null)} 
        title="Galeria da Avaliação"
      >
        <div className="flex flex-col items-center">
          {viewPhotos && (
            <div className="relative w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden shadow-2xl">
              {(() => {
                const photosArr = Object.entries(viewPhotos)
                  .filter(([_, value]) => value)
                  .map(([key, value]) => ({ key, value: value as string }));
                
                const current = photosArr[currentPhotoIdx];
                if (!current) return null;

                return (
                  <>
                    <img src={current.value} className="w-full h-full object-contain" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-center font-bold capitalize">
                        {current.key === 'front' ? 'Frente' : 
                         current.key === 'side' ? 'Lado' : 
                         current.key === 'back' ? 'Costas' : 'Resultado'}
                      </p>
                    </div>
                    
                    {photosArr.length > 1 && (
                      <>
                        <button 
                          onClick={() => setCurrentPhotoIdx((prev) => (prev - 1 + photosArr.length) % photosArr.length)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-all"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button 
                          onClick={() => setCurrentPhotoIdx((prev) => (prev + 1) % photosArr.length)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-all"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                        <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full text-white text-xs font-bold">
                          {currentPhotoIdx + 1} / {photosArr.length}
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          )}
          <button 
            onClick={() => setViewPhotos(null)} 
            className="mt-6 w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </Modal>
    </div>
  );
}
