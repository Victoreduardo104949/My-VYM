import { useState, useEffect } from 'react';
import { Dumbbell, Search, User, Calendar, CheckCircle2, Youtube } from 'lucide-react';
import { fetcher } from '../lib/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn, getYouTubeEmbedUrl } from '../lib/utils';

interface Workout {
  id: number;
  student_id: number;
  title: string;
  description: string;
  date: string;
  exercises: string;
  created_at: string;
}

interface Student {
  id: number;
  name: string;
}

export default function Workouts() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [workoutsData, studentsData] = await Promise.all([
        fetcher<Workout[]>('/api/workouts'),
        user?.role === 'admin' ? fetcher<Student[]>('/api/students') : Promise.resolve([]),
      ]);
      setWorkouts(workoutsData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to load data', error);
    }
  }

  async function toggleExercise(workoutId: number, exerciseId: string, currentStatus: boolean) {
    if (user?.role !== 'student') return; // Only students check off workouts here

    try {
      // Optimistic UI update
      setWorkouts(prev => prev.map(w => {
        if (w.id === workoutId) {
          const exercises = typeof w.exercises === 'string' ? JSON.parse(w.exercises || '[]') : (w.exercises || []);
          const updated = exercises.map((ex: any) => ex.id === exerciseId ? { ...ex, isCompleted: !currentStatus } : ex);
          return { ...w, exercises: updated as any };
        }
        return w;
      }));

      await fetcher(`/api/workouts/${workoutId}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({ exerciseId, isCompleted: !currentStatus })
      });
    } catch (error) {
      console.error('Failed to toggle progress', error);
      // Revert if failed (simple reload)
      loadData();
    }
  }

  const getStudentName = (id: number) => students.find(s => s.id === id)?.name || 'Unknown';

  const filteredWorkouts = workouts.filter(w =>
    w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user?.role === 'admin' && getStudentName(w.student_id).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isStudent = user?.role === 'student';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">
          {isStudent ? 'Meus Treinos' : 'Todos os Treinos'}
        </h1>
        <p className="text-zinc-400 mt-2">
          {isStudent
            ? 'Visualize e acompanhe o progresso dos seus exercícios.'
            : 'Visão geral de todos os treinos atribuídos aos alunos.'}
        </p>
      </div>

      <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <Search className="w-5 h-5 text-zinc-500" />
        <input
          type="text"
          placeholder={isStudent ? "Buscar treino..." : "Buscar por treino ou aluno..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none text-zinc-100 placeholder-zinc-500 w-full"
        />
      </div>

      <div className={cn("grid gap-8", isStudent ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
        {filteredWorkouts.map((workout) => {
          const exercises = typeof workout.exercises === 'string' ? JSON.parse(workout.exercises || '[]') : (workout.exercises || []);
          const progress = exercises.length > 0 ? Math.round((exercises.filter((ex: any) => ex.isCompleted).length / exercises.length) * 100) : 0;

          return (
            <div key={workout.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-violet-500/30 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-colors">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  {isStudent && (
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-zinc-400">Progresso</span>
                      <span className="text-sm font-bold text-violet-400">{progress}% Concluído</span>
                    </div>
                  )}
                </div>
                {workout.date && (
                  <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {workout.date.split('T')[0].split('-').reverse().join('/')}
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">{workout.title}</h3>

              {!isStudent && (
                <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
                  <User className="w-4 h-4" />
                  <Link to={`/students/${workout.student_id}`} className="hover:text-violet-400 transition-colors">
                    {getStudentName(workout.student_id)}
                  </Link>
                </div>
              )}

              {workout.description && (
                <p className="text-sm text-zinc-400 mb-6 bg-zinc-800/30 p-3 rounded-lg border border-zinc-800/50">{workout.description}</p>
              )}

              {/* Renderização Detalhada dos Exercícios (Checklist) para Aluno */}
              {isStudent && (
                <div className="space-y-4 mt-6">
                  <h4 className="font-semibold text-white mb-3">Lista de Exercícios</h4>
                  {exercises.map((ex: any) => (
                    <div key={ex.id} className={cn("bg-zinc-800/50 p-4 rounded-xl border transition-all duration-300", ex.isCompleted ? "border-emerald-500/50 bg-emerald-500/5" : "border-zinc-700/50 hover:border-violet-500/50")}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <button
                            onClick={() => toggleExercise(workout.id, ex.id, ex.isCompleted)}
                            className="flex items-center gap-3 w-full text-left"
                          >
                            <div className={cn("flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors", ex.isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "border-zinc-500 text-transparent")}>
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className={cn("font-medium transition-all", ex.isCompleted ? "text-emerald-400 line-through opacity-75" : "text-white")}>{ex.name}</h4>
                              {ex.muscleGroup && <span className="text-xs text-zinc-500 block mt-0.5">{ex.muscleGroup}</span>}
                            </div>
                          </button>

                          {ex.observations && (
                            <p className="text-sm text-zinc-400 mt-3 ml-9 pl-4 border-l-2 border-zinc-700/50 whitespace-pre-wrap">{ex.observations}</p>
                          )}
                        </div>

                        {ex.videoUrl && getYouTubeEmbedUrl(ex.videoUrl) && (
                          <div className="flex-shrink-0 w-32 aspect-video rounded-lg overflow-hidden bg-black shadow-md">
                            <iframe
                              src={getYouTubeEmbedUrl(ex.videoUrl)!}
                              title={ex.name}
                              className="w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {exercises.length === 0 && (
                    <p className="text-zinc-500 text-sm italic">Nenhum exercício atribuído.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
