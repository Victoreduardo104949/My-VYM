import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Info, ChevronRight, ChevronLeft, Activity, Ruler, Target, ClipboardList, Camera, Trash2 as TrashIcon, Plus } from 'lucide-react';
import { fetcher } from '../lib/api';
import { calculateIMC, calculateAge, calculateGuedes, calculateJP3, calculateJP7 } from '../lib/evaluationUtils';

interface EvaluationFormProps {
  studentId: string | number;
  initialData?: any;
  onSuccess: () => void;
}

export default function EvaluationForm({ studentId, initialData, onSuccess }: EvaluationFormProps) {
  const [step, setStep] = useState(1);
  const [protocol, setProtocol] = useState<'guedes' | 'jp3' | 'jp7' | 'manual'>(initialData?.data?.protocol || 'guedes');
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: initialData?.data || {
      anamnesis: { objective: '', history: '', restrictions: '', habits: '' },
      anthropometry: { weight: '', height: '', birthDate: '' },
      skinfolds: {},
      perimetry: {},
      diameters: {},
      bioimpedance: {
        bodyFat: '',
        adiposityIndex: '',
        abdominalCircumference: '',
        waistHipRatio: '',
        skeletalMuscle: '',
        bodyAge: '',
        visceralFat: '',
        basalMetabolism: ''
      },
      photos: {
        front: null,
        back: null,
        side: null,
        result: null
      }
    }
  });

  const watchAll = watch();

  const handleCalculateCalculations = () => {
    const data = watchAll;
    const weight = parseFloat(data.anthropometry?.weight);
    const height = parseFloat(data.anthropometry?.height);
    const birthDate = data.anthropometry?.birthDate;
    
    if (!weight || !height) return null;

    const imc = calculateIMC(weight, height);
    const age = birthDate ? calculateAge(birthDate) : 25; // fallback age
    
    let fatPercentage = 0;
    if (protocol === 'manual') {
       fatPercentage = parseFloat(data.bioimpedance?.bodyFat) || 0;
    } else if (protocol === 'guedes') {
       fatPercentage = calculateGuedes(data.skinfolds, 'male', age); // Simplified gender for now
    } else if (protocol === 'jp3') {
       fatPercentage = calculateJP3(data.skinfolds, 'male', age);
    } else {
       fatPercentage = calculateJP7(data.skinfolds, 'male', age);
    }

    const fatMass = (weight * fatPercentage) / 100;
    const leanMass = weight - fatMass;

    return {
      imc,
      fatPercentage,
      fatMass,
      leanMass,
      age
    };
  };

  const onSubmit = async (formData: any) => {
    const results = handleCalculateCalculations();
    const payload = {
      student_id: studentId,
      date: initialData?.date || new Date().toISOString().split('T')[0],
      data: {
        ...formData,
        protocol,
        results
      }
    };

    try {
      if (!studentId) {
        throw new Error('Student ID is missing');
      }

      if (initialData) {
        await fetcher(`/api/evaluations/${initialData.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await fetcher('/api/evaluations', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      onSuccess();
    } catch (error: any) {
      console.error('Failed to save evaluation', error);
      alert('Erro ao salvar avaliação: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="space-y-6">
      {/* Stepper UI */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= s ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
              {s === 1 && <ClipboardList className="w-5 h-5" />}
              {s === 2 && <Target className="w-5 h-5" />}
              {s === 3 && <Activity className="w-5 h-5" />}
            </div>
            {s < 3 && <div className={`w-20 h-1 mx-2 rounded ${step > s ? 'bg-violet-600' : 'bg-zinc-800'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-violet-400" /> Anamnese e Dados Básicos
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Data de Nascimento</label>
                <input type="date" {...register('anthropometry.birthDate')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Objetivo</label>
                <input {...register('anamnesis.objective')} placeholder="Ex: Hipertrofia" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Peso (kg)</label>
                <input type="number" step="0.1" {...register('anthropometry.weight')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Altura (cm)</label>
                <input type="number" {...register('anthropometry.height')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Restrições / Histórico Clínico</label>
              <textarea {...register('anamnesis.history')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white h-24 focus:border-violet-500 outline-none" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-violet-400" /> Protocolo e Dobras Cutâneas
            </h3>
            
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
              <div className="p-2 border-b border-zinc-800 flex items-center justify-between px-4">
                <span className="text-xs font-bold text-zinc-500 uppercase">Escolha o Protocolo</span>
                <Info className="w-4 h-4 text-zinc-600" />
              </div>
              <div className="flex flex-wrap p-2 gap-2">
                {[
                  { id: 'guedes', label: 'Guedes (3)', sub: 'Dobras' },
                  { id: 'jp3', label: 'Pollock (3)', sub: 'Dobras' },
                  { id: 'jp7', label: 'Pollock (7)', sub: 'Dobras' },
                  { id: 'manual', label: 'Bioimpedância', sub: 'Balança' }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProtocol(p.id as any)}
                    className={`flex-1 min-w-[100px] py-3 px-2 rounded-xl transition-all border ${
                      protocol === p.id 
                        ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20' 
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    <p className="text-sm font-bold block">{p.label}</p>
                    <p className={`text-[9px] uppercase font-black opacity-60 ${protocol === p.id ? 'text-white' : 'text-zinc-500'}`}>{p.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               {protocol === 'guedes' && (
                 <>
                   <div>
                     <label className="block text-xs font-bold text-zinc-500 mb-1">TRÍCEPS</label>
                     <input type="number" step="0.1" {...register('skinfolds.triceps')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-zinc-500 mb-1">SUPRAILÍACA</label>
                     <input type="number" step="0.1" {...register('skinfolds.suprailiac')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-zinc-500 mb-1">ABDÔMEN</label>
                     <input type="number" step="0.1" {...register('skinfolds.abdominal')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white" />
                   </div>
                 </>
               )}
               {(protocol === 'jp3' || protocol === 'jp7') && (
                 <>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">PEITO</label>
                      <input type="number" step="0.1" {...register('skinfolds.chest')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">ABDÔMEN</label>
                      <input type="number" step="0.1" {...register('skinfolds.abdominal')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">COXA</label>
                      <input type="number" step="0.1" {...register('skinfolds.thigh')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white" />
                    </div>
                 </>
               )}
               {protocol === 'jp7' && (
                 <>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">TRÍCEPS</label>
                      <input type="number" step="0.1" {...register('skinfolds.triceps')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">SUBESCAPULAR</label>
                      <input type="number" step="0.1" {...register('skinfolds.subscapular')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">AXILAR MÉDIA</label>
                      <input type="number" step="0.1" {...register('skinfolds.midaxillary')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 mb-1">SUPRAILÍACA</label>
                      <input type="number" step="0.1" {...register('skinfolds.suprailiac')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white" />
                    </div>
                   </>
                 )}
               {protocol === 'manual' && (
                 <>
                   <div className="col-span-2 md:col-span-3 bg-violet-600/10 border border-violet-500/20 p-6 rounded-xl space-y-4">
                     <h4 className="text-violet-300 font-bold">Dados da Bioimpedância (Balança)</h4>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div>
                         <label className="block text-xs font-bold text-violet-300/80 mb-1">GORDURA CORPORAL (%)</label>
                         <input type="number" step="0.1" {...register('bioimpedance.bodyFat')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none" />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-violet-300/80 mb-1">ÍNDICE ADIPOSIDADE (%)</label>
                         <input type="number" step="0.1" {...register('bioimpedance.adiposityIndex')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none" />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-violet-300/80 mb-1">MÚSCULO ESQUELÉTICO (%)</label>
                         <input type="number" step="0.1" {...register('bioimpedance.skeletalMuscle')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none" />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-violet-300/80 mb-1">METABOLISMO BASAL (kcal)</label>
                         <input type="number" {...register('bioimpedance.basalMetabolism')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none" />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-violet-300/80 mb-1">CIRCUNF. ABDOMINAL (cm)</label>
                         <input type="number" step="0.1" {...register('bioimpedance.abdominalCircumference')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none" />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-violet-300/80 mb-1">RELAÇÃO ABDÔMEN/QUADRIL</label>
                         <input type="number" step="0.01" {...register('bioimpedance.waistHipRatio')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none" />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-violet-300/80 mb-1">GORDURA VISCERAL (Nível)</label>
                         <input type="number" {...register('bioimpedance.visceralFat')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none" />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-violet-300/80 mb-1">IDADE CORPORAL (anos)</label>
                         <input type="number" {...register('bioimpedance.bodyAge')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:border-violet-500 outline-none" />
                       </div>
                     </div>
                   </div>
                 </>
               )}
            </div>

            {/* Photo Gallery Section - Always visible in Step 2 */}
            <div className="mt-8 pt-8 border-t border-zinc-800">
              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-violet-400" /> Registro Fotográfico
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'front', label: 'Frente' },
                  { id: 'side', label: 'Lado' },
                  { id: 'back', label: 'Costas' },
                  { id: 'result', label: 'Resultado/Relatório' }
                ].map((angle) => (
                  <div key={angle.id} className="space-y-2">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase text-center">{angle.label}</p>
                    <div className="relative aspect-[3/4] bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group">
                      {watchAll.photos?.[angle.id] ? (
                        <>
                          <img src={watchAll.photos[angle.id]} className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setValue(`photos.${angle.id}`, null)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => document.getElementById(`photo-${angle.id}`)?.click()}
                          className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-600 hover:text-violet-400 hover:bg-zinc-800 transition-all"
                        >
                          <Plus className="w-6 h-6" />
                          <span className="text-[10px] font-bold">Upload</span>
                        </button>
                      )}
                      <input 
                        id={`photo-${angle.id}`}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setValue(`photos.${angle.id}`, reader.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {protocol !== 'manual' && (
              <div className="bg-violet-500/10 p-4 rounded-xl border border-violet-500/20 flex gap-3">
                <Info className="w-5 h-5 text-violet-400 shrink-0" />
                <p className="text-xs text-violet-300">Utilize o adipômetro para realizar as medições no lado direito do corpo.</p>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-violet-400" /> Revisão de Resultados
            </h3>
            
            {/* Core Results Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                   <p className="text-xs text-zinc-500 mb-1 uppercase font-bold tracking-wider">Gordura Corporal</p>
                   <p className="text-3xl font-black text-white">{handleCalculateCalculations()?.fatPercentage?.toFixed(1)}%</p>
                </div>
                <div>
                   <p className="text-xs text-zinc-500 mb-1 uppercase font-bold tracking-wider">Massa Magra</p>
                   <p className="text-3xl font-black text-emerald-400">{handleCalculateCalculations()?.leanMass?.toFixed(1)} <span className="text-sm font-normal">kg</span></p>
                </div>
                <div>
                   <p className="text-xs text-zinc-500 mb-1 uppercase font-bold tracking-wider">IMC</p>
                   <p className="text-3xl font-black text-white">{handleCalculateCalculations()?.imc?.toFixed(1)}</p>
                </div>
                <div>
                   <p className="text-xs text-zinc-500 mb-1 uppercase font-bold tracking-wider">Massa Gorda</p>
                   <p className="text-3xl font-black text-red-400">{handleCalculateCalculations()?.fatMass?.toFixed(1)} <span className="text-sm font-normal">kg</span></p>
                </div>
              </div>

              {/* Bioimpedance Details Grid */}
              {protocol === 'manual' && watchAll.bioimpedance && (
                <div className="mt-8 pt-8 border-t border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-6">
                   <div>
                     <p className="text-[10px] text-zinc-500 mb-1 uppercase font-bold">Mús. Esquelético</p>
                     <p className="text-xl font-bold text-blue-400">{watchAll.bioimpedance?.skeletalMuscle || '--'}%</p>
                   </div>
                   <div>
                     <p className="text-[10px] text-zinc-500 mb-1 uppercase font-bold">Gordura Visceral</p>
                     <p className="text-xl font-bold text-amber-500">{watchAll.bioimpedance?.visceralFat || '--'}</p>
                   </div>
                   <div>
                     <p className="text-[10px] text-zinc-500 mb-1 uppercase font-bold">Idade Corporal</p>
                     <p className="text-xl font-bold text-pink-400">{watchAll.bioimpedance?.bodyAge || '--'} <span className="text-xs">anos</span></p>
                   </div>
                   <div>
                     <p className="text-[10px] text-zinc-500 mb-1 uppercase font-bold">Taxa Basal</p>
                     <p className="text-xl font-bold text-white">{watchAll.bioimpedance?.basalMetabolism || '--'} <span className="text-xs">kcal</span></p>
                   </div>
                </div>
              )}
            </div>

            {/* Health Alerts / Smart Analysis */}
            {protocol === 'manual' && watchAll.bioimpedance && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Number(watchAll.bioimpedance?.visceralFat) >= 10 && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 items-start">
                    <Activity className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-400">Alerta: Gordura Visceral Elevada</p>
                      <p className="text-xs text-red-300/80">O nível {watchAll.bioimpedance?.visceralFat} indica risco cardiovascular. Sugerido foco em déficit calórico e aeróbicos.</p>
                    </div>
                  </div>
                )}
                {handleCalculateCalculations()?.age && Number(watchAll.bioimpedance?.bodyAge) > Number(handleCalculateCalculations()?.age) && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 items-start">
                    <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-400">Idade Corporal Acima da Real</p>
                      <p className="text-xs text-amber-300/80">A bioimpedância calculou uma idade de {watchAll.bioimpedance?.bodyAge} anos. Foco em melhorar a relação massa magra/gorda.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-3">
               <label className="block text-sm font-medium text-zinc-400">Observações Adicionais</label>
               <textarea {...register('results.notes')} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white h-24 focus:border-violet-500 outline-none" />
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4 border-t border-zinc-800">
          {step > 1 && (
            <button type="button" onClick={prevStep} className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-colors">
              <ChevronLeft className="w-5 h-5" /> Anterior
            </button>
          )}
          {step < 3 ? (
            <button type="button" onClick={nextStep} className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-500/25">
              Próximo <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button type="submit" className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-emerald-600 hover:opacity-90 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-500/25">
              <Save className="w-5 h-5" /> Salvar Avaliação
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
