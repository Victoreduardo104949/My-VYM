import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Dumbbell, Utensils, Plus, Trash2, Calendar, Youtube, Clock } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { fetcher } from '../lib/api';
import { cn, getYouTubeEmbedUrl } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

// --- Schemas ---

const workoutSchema = z.object({
  title: z.string().min(2, 'Título é obrigatório'),
  description: z.string().optional(),
  video_url: z.string().url('URL inválida').optional().or(z.literal('')),
  day_of_week: z.string().optional(),
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
  video_url: string;
  day_of_week: string;
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
  const [activeTab, setActiveTab] = useState<'workouts' | 'diets'>('workouts');
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);

  // Forms
  const workoutForm = useForm<WorkoutForm>({ resolver: zodResolver(workoutSchema) });
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
      const [studentData, workoutsData, dietsData] = await Promise.all([
        fetcher<Student>(`/api/students/${id}`),
        fetcher<Workout[]>(`/api/workouts?student_id=${id}`),
        fetcher<Diet[]>(`/api/diets?student_id=${id}`),
      ]);
      
      setStudent(studentData);
      setWorkouts(workoutsData);
      setDiets(dietsData);
    } catch (error) {
      console.error('Failed to load data', error);
    }
  }

  async function onWorkoutSubmit(data: WorkoutForm) {
    try {
      await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, student_id: id }),
      });
      workoutForm.reset();
      setIsWorkoutModalOpen(false);
      loadData();
    } catch (error) {
      console.error('Failed to create workout', error);
    }
  }

  async function onDietSubmit(data: DietForm) {
    try {
      await fetch('/api/diets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    await fetch(`/api/workouts/${workoutId}`, { method: 'DELETE' });
    loadData();
  }

  async function deleteDiet(dietId: number) {
    if (!confirm('Excluir dieta?')) return;
    await fetch(`/api/diets/${dietId}`, { method: 'DELETE' });
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
              {workouts.map((workout) => (
                <div key={workout.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-violet-500/30 transition-colors">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{workout.title}</h3>
                        <p className="text-sm text-zinc-400 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" /> {workout.day_of_week}
                        </p>
                      </div>
                      {user?.role === 'admin' && (
                        <button onClick={() => deleteWorkout(workout.id)} className="text-zinc-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {workout.description && (
                      <p className="text-zinc-300 mb-4 text-sm whitespace-pre-wrap">{workout.description}</p>
                    )}

                    {workout.video_url && getYouTubeEmbedUrl(workout.video_url) && (
                      <div className="aspect-video rounded-xl overflow-hidden bg-black">
                        <iframe
                          src={getYouTubeEmbedUrl(workout.video_url)!}
                          title={workout.title}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
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
                const meals = JSON.parse(diet.meals || '[]');
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
        )}
      </div>

      {/* Workout Modal */}
      <Modal isOpen={isWorkoutModalOpen} onClose={() => setIsWorkoutModalOpen(false)} title="Novo Treino">
        <form onSubmit={workoutForm.handleSubmit(onWorkoutSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Título</label>
            <input {...workoutForm.register('title')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white" />
            {workoutForm.formState.errors.title && <p className="text-red-400 text-sm">{workoutForm.formState.errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Dia da Semana</label>
            <input {...workoutForm.register('day_of_week')} placeholder="ex: Segunda-feira" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Descrição</label>
            <textarea {...workoutForm.register('description')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white h-24" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">URL do Vídeo (YouTube)</label>
            <div className="relative">
              <Youtube className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
              <input {...workoutForm.register('video_url')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-white" placeholder="https://youtube.com/..." />
            </div>
          </div>
          <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-3 font-medium">Salvar Treino</button>
        </form>
      </Modal>

      {/* Diet Modal */}
      <Modal isOpen={isDietModalOpen} onClose={() => setIsDietModalOpen(false)} title="Nova Dieta">
        <form onSubmit={dietForm.handleSubmit(onDietSubmit)} className="space-y-4">
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
