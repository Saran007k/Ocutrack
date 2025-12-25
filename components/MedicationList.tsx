
import React, { useState, useRef } from 'react';
import { Medication, MedType } from '../types.ts';
import { analyzeMedicationLabel } from '../services/geminiService.ts';
import { TODAY } from '../constants.ts';

interface MedicationListProps {
  medications: Medication[];
  onAdd: (med: Medication) => void;
}

const MedicationList: React.FC<MedicationListProps> = ({ medications, onAdd }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Medication>>({
    name: '',
    type: MedType.DROPS,
    dosage: '1 Drop',
    frequency: 2,
    eye: 'Both',
    startDate: TODAY,
    endDate: ''
  });

  const handleScanLabel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const result = await analyzeMedicationLabel(base64);
      if (result) {
        setFormData(prev => ({ ...prev, ...result }));
      }
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.endDate) {
      alert("Please fill in all mandatory fields (Name, Start, End Dates)");
      return;
    }

    const times: string[] = [];
    const freq = Number(formData.frequency) || 1;
    if (freq === 1) times.push("9:00 AM");
    else if (freq === 2) times.push("9:00 AM", "9:00 PM");
    else if (freq === 3) times.push("9:00 AM", "3:00 PM", "9:00 PM");
    else if (freq === 4) times.push("8:00 AM", "12:00 PM", "4:00 PM", "8:00 PM");

    onAdd({
      id: Date.now().toString(),
      name: formData.name!,
      type: formData.type as MedType,
      dosage: formData.dosage || '1 Drop',
      frequency: freq,
      times,
      startDate: formData.startDate!,
      endDate: formData.endDate!,
      eye: formData.eye as any,
      notes: formData.notes
    });

    setShowAdd(false);
    setFormData({
      name: '',
      type: MedType.DROPS,
      dosage: '1 Drop',
      frequency: 2,
      eye: 'Both',
      startDate: TODAY,
      endDate: ''
    });
  };

  const activeMeds = medications.filter(m => TODAY >= m.startDate && TODAY <= m.endDate);
  const historyMeds = medications.filter(m => TODAY > m.endDate);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Medicine Inventory</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Current status as of {new Date(TODAY).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
          </p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
        >
          <i className="fa-solid fa-plus"></i> Add
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border dark:border-slate-800">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">New Medication</h3>
                <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-3xl">&times;</button>
              </div>

              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 text-center">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-bold mb-3 flex items-center justify-center gap-2">
                  <i className="fa-solid fa-wand-magic-sparkles"></i> Auto-fill with AI?
                </p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-2 border-blue-200 dark:border-blue-800 px-4 py-3 rounded-xl font-bold w-full flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <><i className="fa-solid fa-spinner fa-spin"></i> Analyzing Label...</>
                  ) : (
                    <><i className="fa-solid fa-camera"></i> Scan Medicine Label</>
                  )}
                </button>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleScanLabel}
                />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Medicine Name</label>
                  <input 
                    required
                    className="w-full border-2 border-slate-100 dark:border-slate-700 rounded-xl p-4 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none bg-slate-50 dark:bg-slate-800 dark:text-slate-100"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Latanoprost"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Type</label>
                    <select 
                      className="w-full border-2 border-slate-100 dark:border-slate-700 rounded-xl p-4 focus:border-blue-500 dark:focus:border-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-slate-100"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value as MedType})}
                    >
                      <option value={MedType.DROPS}>Eye Drops</option>
                      <option value={MedType.TABLET}>Tablets</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Target Eye</label>
                    <select 
                      disabled={formData.type === MedType.TABLET}
                      className="w-full border-2 border-slate-100 dark:border-slate-700 rounded-xl p-4 focus:border-blue-500 dark:focus:border-blue-500 disabled:opacity-50 bg-slate-50 dark:bg-slate-800 dark:text-slate-100"
                      value={formData.eye}
                      onChange={e => setFormData({...formData, eye: e.target.value as any})}
                    >
                      <option value="Both">Both Eyes</option>
                      <option value="Left">Left Eye</option>
                      <option value="Right">Right Eye</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Times Daily</label>
                    <input 
                      type="number"
                      min="1"
                      className="w-full border-2 border-slate-100 dark:border-slate-700 rounded-xl p-4 focus:border-blue-500 dark:focus:border-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-slate-100"
                      value={formData.frequency}
                      onChange={e => setFormData({...formData, frequency: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Dosage</label>
                    <input 
                      className="w-full border-2 border-slate-100 dark:border-slate-700 rounded-xl p-4 focus:border-blue-500 dark:focus:border-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-slate-100"
                      value={formData.dosage}
                      onChange={e => setFormData({...formData, dosage: e.target.value})}
                      placeholder="e.g. 1 Drop"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Start Date</label>
                    <input 
                      type="date"
                      required
                      className="w-full border-2 border-slate-100 dark:border-slate-700 rounded-xl p-4 focus:border-blue-500 dark:focus:border-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 text-sm"
                      value={formData.startDate}
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">End Date</label>
                    <input 
                      type="date"
                      required
                      className="w-full border-2 border-slate-100 dark:border-slate-700 rounded-xl p-4 focus:border-blue-500 dark:focus:border-blue-500 bg-slate-50 dark:bg-slate-800 dark:text-slate-100 text-sm"
                      value={formData.endDate}
                      onChange={e => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-blue-600 dark:bg-blue-500 text-white p-5 rounded-2xl font-bold text-lg shadow-xl mt-4 hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-95 transition-all"
                >
                  Save to Schedule
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE SECTION */}
      <section>
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Active Prescription</h3>
        </div>
        
        {activeMeds.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
            <i className="fa-solid fa-calendar-xmark text-4xl text-slate-300 dark:text-slate-600 mb-3"></i>
            <p className="text-slate-500 dark:text-slate-400 font-medium">No medicines active for today.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeMeds.map(m => (
              <MedCard key={m.id} med={m} />
            ))}
          </div>
        )}
      </section>

      {/* HISTORY SECTION */}
      {historyMeds.length > 0 && (
        <section className="pt-4">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="w-3 h-3 bg-red-400 rounded-full shadow-[0_0_8px_rgba(248,113,113,0.5)]"></div>
            <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Completed Courses</h3>
          </div>
          
          <div className="grid gap-4">
            {historyMeds.map(m => (
              <MedCard key={m.id} med={m} isHistory />
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-start gap-3">
            <i className="fa-solid fa-circle-exclamation text-red-500 mt-1"></i>
            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-400">History Warning</p>
              <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                Do not consume medicines listed in the completed section unless re-prescribed by your ophthalmologist. Completed on {new Date(new Date().setDate(new Date().getDate()-1)).toLocaleDateString()} or earlier.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const MedCard: React.FC<{ med: Medication, isHistory?: boolean }> = ({ med, isHistory }) => {
  return (
    <div className={`group relative bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border transition-all duration-300 ${
      isHistory 
        ? 'border-red-100 dark:border-red-900/30 opacity-90' 
        : 'border-blue-50 dark:border-slate-800 hover:shadow-md hover:border-blue-200 dark:hover:border-slate-700'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
            med.type === 'DROPS' 
              ? (isHistory ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400') 
              : (isHistory ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400')
          }`}>
            <i className={`fa-solid ${med.type === 'DROPS' ? 'fa-droplet' : 'fa-tablets'} text-2xl`}></i>
          </div>
          <div>
            <h4 className={`font-black text-xl leading-tight ${isHistory ? 'text-slate-500 dark:text-slate-500 line-through decoration-red-400' : 'text-slate-800 dark:text-slate-100'}`}>
              {med.name}
            </h4>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded uppercase">{med.dosage}</span>
               <span className="text-slate-300 dark:text-slate-600">•</span>
               <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded uppercase">{med.frequency}x Daily</span>
            </div>
          </div>
        </div>
        
        <div className={`flex flex-col items-end gap-1`}>
          <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-sm border ${
            isHistory 
              ? 'bg-red-500 text-white border-red-600' 
              : 'bg-emerald-500 dark:bg-emerald-600 text-white border-emerald-600'
          }`}>
            {isHistory ? 'FINISHED' : 'ACTIVE'}
          </span>
          {med.type === 'DROPS' && !isHistory && (
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-900/50">
              {med.eye} EYE
            </span>
          )}
        </div>
      </div>

      {med.notes && (
        <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 border border-slate-100 dark:border-slate-700">
          <i className="fa-solid fa-circle-info text-blue-400 mt-0.5"></i>
          <p className="italic leading-relaxed">{med.notes}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <i className="fa-regular fa-calendar-plus text-slate-300 dark:text-slate-600 text-xs"></i>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            Started: {new Date(med.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <i className={`fa-regular ${isHistory ? 'fa-calendar-check text-red-400 dark:text-red-500' : 'fa-calendar-clock text-slate-300 dark:text-slate-600'} text-xs`}></i>
          <span className={`text-[11px] font-black uppercase tracking-wide ${isHistory ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
            {isHistory ? 'Ended:' : 'Next Review:'} {new Date(med.endDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>
      
      {isHistory && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 pointer-events-none opacity-[0.03] select-none">
          <i className="fa-solid fa-ban text-9xl"></i>
        </div>
      )}
    </div>
  );
};

export default MedicationList;
