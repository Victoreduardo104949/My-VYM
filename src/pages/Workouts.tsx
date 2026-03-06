import { useState, useEffect } from 'react';
import { Dumbbell, Search, User, Calendar } from 'lucide-react';
import { fetcher } from '../lib/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Workout {
  id: number;
  student_id: number;
  title: string;
  description: string;
  day_of_week: string;
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
        // Only fetch students if admin, otherwise we don't need the list (and might not have permission)
        user?.role === 'admin' ? fetcher<Student[]>('/api/students') : Promise.resolve([]),
      ]);
      setWorkouts(workoutsData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Failed to load data', error);
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
            ? 'Visualize seus treinos semanais.' 
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkouts.map((workout) => (
          <div key={workout.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-violet-500/30 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-colors">
                <Dumbbell className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-zinc-500 bg-zinc-800 px-2 py-1 rounded-lg">
                {workout.day_of_week}
              </span>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-2">{workout.title}</h3>
            
            {!isStudent && (
              <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
                <User className="w-4 h-4" />
                <Link to={`/students/${workout.student_id}`} className="hover:text-violet-400 transition-colors">
                  {getStudentName(workout.student_id)}
                </Link>
              </div>
            )}

            {workout.description && (
              <p className="text-sm text-zinc-500 line-clamp-2">{workout.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
