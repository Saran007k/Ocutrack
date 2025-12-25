
import React, { useMemo, useState } from 'react';
import { Medication, DailyTask, MedType } from '../types.ts';
import { speakSchedule } from '../services/geminiService.ts';
import { TODAY } from '../constants.ts';

interface ScheduleProps {
  activeMeds: Medication[];
  completedMeds: Medication[];
  tasks: Record<string, DailyTask[]>;
  onToggleTask: (date: string, taskId: number) => void;
  setDailyTasks: React.Dispatch<React.SetStateAction<Record<string, DailyTask[]>>>;
}

const Schedule: React.FC<ScheduleProps> = ({ activeMeds, tasks, onToggleTask, setDailyTasks }) => {
  const [showExport, setShowExport] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Retrieve today's tasks directly from props
  const todayTasks = tasks[TODAY] || [];

  const dropTasks = todayTasks.filter(t => t.type === MedType.DROPS);
  const remainingDrops = dropTasks.filter(t => !t.completed);
  const completedDrops = dropTasks.filter(t => t.completed);
  
  const handleSpeak = () => {
    const remaining = todayTasks.filter(t => !t.completed);
    if (remaining.length === 0) {
      speakSchedule("You have finished all your medicines for today. Well done!");
      return;
    }
    const nextTask = remaining[0];
    const text = `You have ${remaining.length} doses left. The next one is ${nextTask.medName} for your ${nextTask.eye} eye at ${nextTask.time}.`;
    speakSchedule(text);
  };

  const generateExportJSON = () => {
    const exportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        referenceDate: TODAY,
        activeMedicationCount: activeMeds.length,
        totalDosesToday: todayTasks.length
      },
      schedule: todayTasks.map(task => ({
        id: task.medicationId,
        medicine: task.medName,
        time: task.time,
        type: task.type,
        target: task.eye || 'N/A',
        status: task.completed ? 'COMPLETED' : 'PENDING'
      }))
    };
    return JSON.stringify(exportData, null, 2);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateExportJSON());
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Date and Action Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center transition-colors">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Daily Checklist</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {new Date(TODAY).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})} • {completedDrops.length}/{dropTasks.length} Doses Taken
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowExport(true)}
            className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            title="Export JSON"
          >
            <i className="fa-solid fa-file-code"></i>
          </button>
          <button 
            onClick={handleSpeak}
            className="bg-blue-600 dark:bg-blue-500 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-90 transition-all"
            aria-label="Listen to schedule"
          >
            <i className="fa-solid fa-volume-high"></i>
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border dark:border-slate-800">
            <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Export Schedule JSON</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(TODAY).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})} Data Package
                </p>
              </div>
              <button onClick={() => setShowExport(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-3xl">&times;</button>
            </div>
            
            <div className="p-6 bg-slate-900 overflow-y-auto flex-1">
              <pre className="text-blue-400 font-mono text-xs leading-relaxed">
                {generateExportJSON()}
              </pre>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 flex gap-3">
              <button 
                onClick={handleCopy}
                className={`flex-1 p-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  copyFeedback ? 'bg-emerald-500 text-white' : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700'
                }`}
              >
                <i className={`fa-solid ${copyFeedback ? 'fa-check' : 'fa-copy'}`}></i>
                {copyFeedback ? 'Copied to Clipboard!' : 'Copy JSON Content'}
              </button>
              <button 
                onClick={() => setShowExport(false)}
                className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-6 rounded-xl font-bold text-slate-600 dark:text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tablet Safety Instruction */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-3xl border-2 border-emerald-100 dark:border-emerald-900/40 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-800/40 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <i className="fa-solid fa-tablets text-lg"></i>
          </div>
          <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-300">Tablet Instructions</h3>
        </div>
        <div className="bg-white/60 dark:bg-black/20 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
          <p className="text-emerald-800 dark:text-emerald-300 font-black text-center text-xl uppercase">
            No Tablets Required
          </p>
          <p className="text-emerald-700 dark:text-emerald-400 text-sm mt-1 text-center font-medium italic">
            Course for IOPAR-SR and PANORITE 40 finished on Dec 23.
          </p>
        </div>
      </div>

      {/* Checklist Sections */}
      <section className="space-y-8">
        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-blue-500"></span>
              EYE DROP TO-DO
            </h3>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full uppercase">
              {remainingDrops.length} Remaining
            </span>
          </div>

          {remainingDrops.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-10 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
              <i className="fa-solid fa-circle-check text-4xl text-emerald-400 mb-2"></i>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">All caught up!</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm">No eye drops are currently due.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {remainingDrops.map((task, idx) => {
                const realIdx = todayTasks.findIndex(t => t === task);
                return (
                  <ChecklistItem 
                    key={`${task.medicationId}-${idx}`}
                    task={task}
                    onToggle={() => onToggleTask(TODAY, realIdx)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {completedDrops.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-lg font-bold text-slate-400 dark:text-slate-500 flex items-center gap-2">
                <i className="fa-solid fa-check-double text-emerald-500"></i>
                COMPLETED TODAY
              </h3>
            </div>
            <div className="space-y-3">
              {completedDrops.map((task, idx) => {
                const realIdx = todayTasks.findIndex(t => t === task);
                return (
                  <ChecklistItem 
                    key={`${task.medicationId}-${idx}`}
                    task={task}
                    completed
                    onToggle={() => onToggleTask(TODAY, realIdx)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Safety Message */}
      <div className="bg-slate-800 dark:bg-black p-6 rounded-3xl text-white shadow-xl flex items-start gap-4">
        <div className="text-blue-400 text-3xl mt-1">
          <i className="fa-solid fa-shield-heart"></i>
        </div>
        <div>
          <h4 className="font-bold text-lg mb-1">Medication Safety</h4>
          <p className="text-slate-300 text-sm leading-relaxed">
            Always wash hands before applying eye drops. Keep the tip of the bottle clean and away from your eye or any surface.
          </p>
        </div>
      </div>
    </div>
  );
};

const ChecklistItem: React.FC<{ task: DailyTask, completed?: boolean, onToggle: () => void }> = ({ task, completed, onToggle }) => {
  return (
    <div 
      onClick={onToggle}
      className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
        completed 
          ? 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60' 
          : 'bg-white dark:bg-slate-900 border-blue-50 dark:border-slate-800 shadow-md hover:border-blue-300 dark:hover:border-blue-700'
      }`}
    >
      <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all ${
        completed 
          ? 'bg-emerald-500 border-emerald-100 dark:border-emerald-900 text-white shadow-inner scale-90' 
          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-200 dark:text-slate-600'
      }`}>
        <i className="fa-solid fa-check text-2xl"></i>
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h4 className={`text-xl font-black leading-tight ${completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
              {task.medName}
            </h4>
            <div className="flex gap-2 mt-1">
               <span className={`text-[11px] font-black px-2 py-0.5 rounded border ${
                 completed ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900/50'
               }`}>
                 {task.eye?.toUpperCase()} EYE
               </span>
               <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                 1 DROP
               </span>
            </div>
          </div>
          <div className={`px-4 py-1.5 rounded-2xl font-black text-sm whitespace-nowrap shadow-sm ${
            completed ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500' : 'bg-blue-600 dark:bg-blue-500 text-white'
          }`}>
            {task.time}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
