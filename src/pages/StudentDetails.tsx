import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Dumbbell, Utensils, Plus, Trash2, Calendar, Youtube, Clock, Edit2, ClipboardList } from 'lucide-react';
import Modal from '../components/ui/Modal';
import EvaluationTab from '../components/EvaluationTab';
import FoodDiaryTab from '../components/FoodDiaryTab';
import { fetcher } from '../lib/api';
import { cn, getYouTubeEmbedUrl } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

// --- Schemas ---

const workoutSchema = z.object({
  title: z.string().min(2, 'Título é obrigatório'),
  description: z.string().optional(),
  date: z.string().optional(),
  exercises: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, 'Nome do Exercício é obrigatório'),
    muscleGroup: z.string().optional(),
    videoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
    observations: z.string().optional(),
    isCompleted: z.boolean()
  })).optional(),
});

const dietSchema = z.object({
  title: z.string().min(2, 'Título é obrigatório'),
  description: z.string().optional(),
  meals: z.array(z.object({
    time: z.string(),
    description: z.string(),
  })).optional(),
});

// --- Types ---

type WorkoutForm = z.infer<typeof workoutSchema>;
type DietForm = z.infer<typeof dietSchema>;

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  age: number;
  goal: string;
}

interface Workout {
  id: number;
  title: string;
  description: string;
  date: string;
  exercises: string; // JSON string from postgres, we'll parse it
}

interface Diet {
  id: number;
  title: string;
  description: string;
  meals: string; // JSON string
}

// --- Components ---

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [diets, setDiets] = useState<Diet[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'workouts' | 'diets' | 'eval' | 'diary'>('workouts');
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  // Forms
  const workoutForm = useForm<WorkoutForm>({
    resolver: zodResolver(workoutSchema),
    defaultValues: { exercises: [{ id: crypto.randomUUID(), name: '', muscleGroup: '', videoUrl: '', observations: '', isCompleted: false }] }
  });

  const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = useFieldArray({
    control: workoutForm.control,
    name: 'exercises',
  });
  const dietForm = useForm<DietForm>({
    resolver: zodResolver(dietSchema),
    defaultValues: { meals: [{ time: '', description: '' }] }
  });

  const { fields: mealFields, append: appendMeal, remove: removeMeal } = useFieldArray({
    control: dietForm.control,
    name: 'meals',
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  async function loadData() {
    try {
      const [studentData, workoutsData, dietsData, evalsData] = await Promise.all([
        fetcher<Student>(`/api/students/${id}`),
        fetcher<Workout[]>(`/api/workouts?student_id=${id}`),
        fetcher<Diet[]>(`/api/diets?student_id=${id}`),
        fetcher<any[]>(`/api/evaluations?student_id=${id}`)
      ]);

      setStudent(studentData);
      setWorkouts(workoutsData);
      setDiets(dietsData);
      setEvaluations(evalsData);
    } catch (error) {
      console.error('Failed to load data', error);
    }
  }

  async function onWorkoutSubmit(data: WorkoutForm) {
    try {
      if (editingWorkout) {
        await fetcher(`/api/workouts/${editingWorkout.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...data, student_id: id }),
        });
      } else {
        await fetcher('/api/workouts', {
          method: 'POST',
          body: JSON.stringify({ ...data, student_id: id }),
        });
      }
      workoutForm.reset({ title: '', description: '', date: '', exercises: [{ id: crypto.randomUUID(), name: '', muscleGroup: '', videoUrl: '', observations: '', isCompleted: false }] });
      setIsWorkoutModalOpen(false);
      setEditingWorkout(null);
      loadData();
    } catch (error) {
      console.error('Failed to save workout', error);
    }
  }

  async function toggleExercise(workoutId: number, exerciseId: string, currentStatus: boolean) {
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
      loadData();
    }
  }

  async function onDietSubmit(data: DietForm) {
    try {
      await fetcher('/api/diets', {
        method: 'POST',
        body: JSON.stringify({ ...data, student_id: id }),
      });
      dietForm.reset();
      setIsDietModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to create diet', error);
    }
  }

  async function deleteWorkout(workoutId: number) {
    if (!confirm('Excluir treino?')) return;
    await fetcher(`/api/workouts/${workoutId}`, { method: 'DELETE' });
    loadData();
  }

  async function deleteDiet(dietId: number) {
    if (!confirm('Excluir dieta?')) return;
    await fetcher(`/api/diets/${dietId}`, { method: 'DELETE' });
    loadData();
  }

  if (!student) return <div className="p-8 text-zinc-500">Carregando...</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        {user?.role === 'admin' && (
          <button onClick={() => navigate('/students')} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400">
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-white">{student.name}</h1>
          <p className="text-zinc-400">{student.goal} • {student.age} anos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('workouts')}
          className={cn(
            "px-4 py-2 font-medium transition-colors border-b-2",
            activeTab === 'workouts'
              ? "text-violet-400 border-violet-500"
              : "text-zinc-400 border-transparent hover:text-zinc-200"
          )}
        >
          Treinos
        </button>
        <button
          onClick={() => setActiveTab('diets')}
          className={cn(
            "px-4 py-2 font-medium transition-colors border-b-2",
            activeTab === 'diets'
              ? "text-emerald-400 border-emerald-500"
              : "text-zinc-400 border-transparent hover:text-zinc-200"
          )}
        >
          Dietas
        </button>
        <button
          onClick={() => setActiveTab('eval')}
          className={cn(
            "px-4 py-2 font-medium transition-colors border-b-2",
            activeTab === 'eval'
              ? "text-violet-400 border-violet-500"
              : "text-zinc-400 border-transparent hover:text-zinc-200"
          )}
        >
          Avaliação
        </button>
        <button
          onClick={() => setActiveTab('diary')}
          className={cn(
            "px-4 py-2 font-medium transition-colors border-b-2",
            activeTab === 'diary'
              ? "text-emerald-400 border-emerald-500"
              : "text-zinc-400 border-transparent hover:text-zinc-200"
          )}
        >
          Diário
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'workouts' ? (
          <div className="space-y-6">
            <div className="flex justify-end">
              {user?.role === 'admin' && (
                <button
                  onClick={() => setIsWorkoutModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar Treino
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workouts.map((workout) => {
                const exercises = typeof workout.exercises === 'string' ? JSON.parse(workout.exercises || '[]') : (workout.exercises || []);
                return (
                  <div key={workout.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-violet-500/30 transition-colors">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white">{workout.title}</h3>
                          {workout.date && (
                            <p className="text-sm text-zinc-400 flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              {workout.date.split('T')[0].split('-').reverse().join('/')}
                            </p>
                          )}
                        </div>
                        {user?.role === 'admin' && (
                          <div className="flex gap-2">
                            <button onClick={() => {
                              setEditingWorkout(workout);
                              workoutForm.reset({
                                title: workout.title,
                                description: workout.description || '',
                                date: workout.date ? workout.date.split('T')[0] : '',
                                exercises: exercises.length > 0 ? exercises : [{ id: crypto.randomUUID(), name: '', muscleGroup: '', videoUrl: '', observations: '', isCompleted: false }]
                              });
                              setIsWorkoutModalOpen(true);
                            }} className="text-zinc-500 hover:text-blue-400 transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteWorkout(workout.id)} className="text-zinc-500 hover:text-red-400 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {workout.description && (
                        <p className="text-zinc-300 mb-6 text-sm whitespace-pre-wrap">{workout.description}</p>
                      )}

                      <div className="space-y-4">
                        {exercises.map((ex: any) => (
                          <div key={ex.id} className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-white font-medium">{ex.name}</h4>
                                {ex.muscleGroup && <span className="text-xs text-violet-400 bg-violet-400/10 px-2 py-1 rounded-full">{ex.muscleGroup}</span>}
                              </div>
                              <button
                                onClick={() => toggleExercise(workout.id, ex.id, ex.isCompleted)}
                                className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer", ex.isCompleted ? "bg-emerald-500 border-emerald-500" : "border-zinc-500")}
                              >
                                {ex.isCompleted && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                              </button>
                            </div>

                            {ex.observations && <p className="text-sm text-zinc-400 mt-2 whitespace-pre-wrap">{ex.observations}</p>}

                            {ex.videoUrl && getYouTubeEmbedUrl(ex.videoUrl) && (
                              <div className="mt-3 aspect-video rounded-lg overflow-hidden bg-black max-w-sm">
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
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'diets' ? (
          <div className="space-y-6">
            <div className="flex justify-end">
              {user?.role === 'admin' && (
                <button
                  onClick={() => setIsDietModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar Dieta
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6">
              {diets.map((diet) => {
                const meals = typeof diet.meals === 'string' ? JSON.parse(diet.meals || '[]') : (diet.meals || []);
                return (
                  <div key={diet.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-white">{diet.title}</h3>
                        {diet.description && <p className="text-zinc-400 text-sm mt-1">{diet.description}</p>}
                      </div>
                      {user?.role === 'admin' && (
                        <button onClick={() => deleteDiet(diet.id)} className="text-zinc-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {meals.map((meal: any, idx: number) => (
                        <div key={idx} className="flex gap-4 p-4 bg-zinc-800/50 rounded-xl">
                          <div className="flex-shrink-0 w-16 text-sm font-bold text-emerald-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {meal.time}
                          </div>
                          <div className="text-zinc-200 text-sm">{meal.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'eval' ? (
          <EvaluationTab studentId={id!} studentName={student.name} />
        ) : (
          <FoodDiaryTab studentId={id!} />
        )}
      </div>

      {/* Workout Modal */}
      <Modal isOpen={isWorkoutModalOpen} onClose={() => { setIsWorkoutModalOpen(false); setEditingWorkout(null); workoutForm.reset({ title: '', description: '', date: '', exercises: [{ id: crypto.randomUUID(), name: '', muscleGroup: '', videoUrl: '', observations: '', isCompleted: false }] }); }} title={editingWorkout ? "Editar Treino" : "Novo Treino"}>
        <form onSubmit={workoutForm.handleSubmit(onWorkoutSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-white border-b border-zinc-800 pb-2">Detalhes Gerais</h4>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Título do Treino</label>
              <input {...workoutForm.register('title')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" placeholder="Ex: Treino A" />
              {workoutForm.formState.errors.title && <p className="text-red-400 text-sm mt-1">{workoutForm.formState.errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Data</label>
              <input type="date" {...workoutForm.register('date')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Descrição / Aquecimento</label>
              <textarea {...workoutForm.register('description')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white h-20 focus:outline-none focus:border-violet-500" />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white border-b border-zinc-800 pb-2 flex justify-between items-center">
              Exercícios
              <button
                type="button"
                onClick={() => appendExercise({ id: crypto.randomUUID(), name: '', muscleGroup: '', videoUrl: '', observations: '', isCompleted: false })}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 bg-violet-400/10 px-2 py-1 rounded-md"
              >
                <Plus className="w-4 h-4" /> Adicionar Exercício
              </button>
            </h4>

            <div className="max-h-[40vh] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {exerciseFields.map((field, index) => (
                <div key={field.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl relative group">
                  <button type="button" onClick={() => removeExercise(index)} className="absolute top-2 right-2 p-1.5 text-zinc-500 bg-zinc-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 hover:bg-red-500/10 z-10">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 pr-10">
                      <div>
                        <input type="hidden" {...workoutForm.register(`exercises.${index}.id`)} />
                        <input type="hidden" value="false" {...workoutForm.register(`exercises.${index}.isCompleted`)} />
                        <input {...workoutForm.register(`exercises.${index}.name`)} placeholder="Nome do Exercício" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:border-violet-500 outline-none" />
                        {workoutForm.formState.errors.exercises?.[index]?.name && <p className="text-red-400 text-xs mt-1">{workoutForm.formState.errors.exercises[index]?.name?.message}</p>}
                      </div>
                      <div>
                        <input {...workoutForm.register(`exercises.${index}.muscleGroup`)} placeholder="Grupamento (Ex: Peito)" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:border-violet-500 outline-none" />
                      </div>
                    </div>
                    <div className="relative">
                      <Youtube className="absolute left-3 top-2 w-4 h-4 text-zinc-500" />
                      <input {...workoutForm.register(`exercises.${index}.videoUrl`)} placeholder="URL do YouTube" className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-1.5 text-white text-sm focus:border-violet-500 outline-none" />
                    </div>
                    <div>
                      <textarea {...workoutForm.register(`exercises.${index}.observations`)} placeholder="Séries, Repetições, Carga, etc..." className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm h-16 focus:border-violet-500 outline-none" />
                    </div>
                  </div>
                </div>
              ))}
              {exerciseFields.length === 0 && (
                <p className="text-zinc-500 text-sm italic text-center py-4">Nenhum exercício adicionado. O treino está vazio.</p>
              )}
            </div>
          </div>

          <button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white rounded-xl py-3 font-semibold shadow-lg shadow-violet-500/25 transition-all">Salvar Treino Completo</button>
        </form>
      </Modal>

      {/* Diet Modal */}
      <Modal isOpen={isDietModalOpen} onClose={() => setIsDietModalOpen(false)} title="Nova Dieta">
        <form onSubmit={dietForm.handleSubmit(onDietSubmit)} className="space-y-4">
          
          {evaluations?.[0]?.data?.bioimpedance?.basalMetabolism && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl mb-4">
              <h4 className="text-emerald-400 font-bold mb-1 flex items-center gap-2">
                <Dumbbell className="w-4 h-4" /> Referência Fisiológica (Bioimpedância)
              </h4>
              <p className="text-sm text-zinc-300">
                Metabolismo Basal (Repouso): <strong className="text-white">{evaluations[0].data.bioimpedance.basalMetabolism} kcal</strong>
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Sugestão para Manutenção (Ativo): ~<strong className="text-white">{(Number(evaluations[0].data.bioimpedance.basalMetabolism) * 1.55).toFixed(0)} kcal</strong>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Título</label>
            <input {...dietForm.register('title')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Descrição</label>
            <textarea {...dietForm.register('description')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white h-20" />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-400">Refeições</label>
            {mealFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <input
                  {...dietForm.register(`meals.${index}.time`)}
                  placeholder="Horário"
                  className="w-24 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm"
                />
                <input
                  {...dietForm.register(`meals.${index}.description`)}
                  placeholder="O que comer..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm"
                />
                <button type="button" onClick={() => removeMeal(index)} className="p-2 text-zinc-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => appendMeal({ time: '', description: '' })}
              className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Adicionar Refeição
            </button>
          </div>

          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 font-medium">Salvar Dieta</button>
        </form>
      </Modal>
    </div>
  );
}
