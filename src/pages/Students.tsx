import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Search, Trash2, User, Mail, Phone, Target, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import { fetcher } from '../lib/api';

const studentSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  age: z.coerce.number().min(1, 'Idade inválida').optional(),
  goal: z.string().optional(),
});

type StudentForm = z.infer<typeof studentSchema>;

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  age: number;
  goal: string;
  created_at: string;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema) as any,
  });

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      const data = await fetcher<Student[]>('/api/students');
      setStudents(data);
    } catch (error) {
      console.error('Failed to load students', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(data: StudentForm) {
    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      reset();
      setIsModalOpen(false);
      loadStudents();
    } catch (error) {
      console.error('Failed to create student', error);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja excluir este aluno?')) return;
    try {
      await fetch(`/api/students/${id}`, { method: 'DELETE' });
      loadStudents();
    } catch (error) {
      console.error('Failed to delete student', error);
    }
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Alunos</h1>
          <p className="text-zinc-400 mt-2">Gerencie seus alunos e seus progressos.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-violet-500/20"
        >
          <Plus className="w-5 h-5" />
          Novo Aluno
        </button>
      </div>

      <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
        <Search className="w-5 h-5 text-zinc-500" />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none text-zinc-100 placeholder-zinc-500 w-full"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-zinc-500">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="group bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-violet-500/50 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-violet-400 group-hover:bg-violet-500/10 transition-colors">
                    <User className="w-6 h-6" />
                  </div>
                  <button
                    onClick={() => handleDelete(student.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <Link to={`/students/${student.id}`} className="block">
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-violet-400 transition-colors">
                    {student.name}
                  </h3>
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Mail className="w-4 h-4" />
                      {student.email}
                    </div>
                    {student.phone && (
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Phone className="w-4 h-4" />
                        {student.phone}
                      </div>
                    )}
                    {student.goal && (
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Target className="w-4 h-4" />
                        {student.goal}
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Novo Aluno"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Nome</label>
            <input
              {...register('name')}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition-colors"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
            <input
              {...register('email')}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition-colors"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Telefone</label>
            <input
              {...register('phone')}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Idade</label>
              <input
                type="number"
                {...register('age')}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Objetivo</label>
              <input
                {...register('goal')}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl py-3 font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Aluno'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
