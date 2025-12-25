
import React, { useEffect, useState } from 'react';
import { Medication, DailyTask, MedType } from '../types.ts';
import { TODAY } from '../constants.ts';

interface DashboardProps {
  activeMeds: Medication[];
  tasks: DailyTask[];
}

const Dashboard: React.FC<DashboardProps> = ({ activeMeds, tasks }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock for dashboard
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dropsCount = activeMeds.filter(m => m.type === MedType.DROPS).length;
  
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const displayDate = new Date(TODAY).toLocaleDateString(undefined, { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });

  // Calculate tomorrow's date string safely
  const [tYear, tMonth, tDay] = TODAY.split('-').map(Number);
  const tomorrowDate = new Date(tYear, tMonth - 1, tDay);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  
  const yyyy = tomorrowDate.getFullYear();
  const mm = String(tomorrowDate.getMonth() + 1).padStart(2, '0');
  const dd = String(tomorrowDate.getDate()).padStart(2, '0');
  const tomorrowStr = `${yyyy}-${mm}-${dd}`;

  const expiringMeds = activeMeds.filter(m => m.endDate === tomorrowStr);

  // Trigger System Notifications
  useEffect(() => {
    if (expiringMeds.length > 0 && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        // Send notification if permission is already granted
        expiringMeds.forEach(med => {
          new Notification('OcuTrack Reminder', {
            body: `${med.name} course ends tomorrow (${new Date(tomorrowDate).toLocaleDateString()}). Please check your prescription.`,
            icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063176.png'
          });
        });
      }
    }
  }, [expiringMeds.length, tomorrowStr]);

  const enableNotifications = () => {
    if (!('Notification' in window)) {
      alert("This browser does not support desktop notifications");
      return;
    }
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted' && expiringMeds.length > 0) {
        expiringMeds.forEach(med => {
          new Notification('OcuTrack Reminder', {
            body: `${med.name} course ends tomorrow.`,
          });
        });
      }
    });
  };

  const upcomingReminders = tasks
    .filter(t => !t.completed && t.type === MedType.DROPS)
    .slice(0, 3); 

  return (
    <div className="space-y-6 pb-4">
      {/* Welcome & Progress Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-black mb-1 font-mono tracking-tight">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </h2>
            <p className="opacity-80 text-sm font-bold uppercase tracking-widest">{displayDate}</p>
          </div>
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
            <i className="fa-solid fa-sun text-xl"></i>
          </div>
        </div>
        
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="text-3xl font-black">{Math.round(progress)}%</span>
            <span className="text-xs opacity-70 ml-2 uppercase font-bold tracking-wider">Daily Goal</span>
          </div>
          <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">{completedTasks} of {totalTasks} done</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden border border-white/5">
          <div 
            className="bg-white h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Expiring Meds Notification */}
      {expiringMeds.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-2xl shadow-sm animate-pulse">
          <div className="flex items-start gap-3">
            <div className="bg-amber-100 dark:bg-amber-800/40 p-2 rounded-full text-amber-600 dark:text-amber-400">
               <i className="fa-solid fa-hourglass-half text-xl"></i>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black text-amber-800 dark:text-amber-200 uppercase tracking-wide">Course Ending Soon</h3>
              <div className="mt-1 space-y-1">
                {expiringMeds.map(med => (
                  <p key={med.id} className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    <span className="font-bold">{med.name}</span> ends tomorrow ({new Date(tomorrowDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}).
                    {med.notes && <span className="block italic opacity-80 mt-0.5">Note: {med.notes}</span>}
                  </p>
                ))}
              </div>
              {('Notification' in window) && Notification.permission === 'default' && (
                <button 
                  onClick={enableNotifications}
                  className="mt-3 text-[10px] font-bold bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-3 py-1.5 rounded-lg hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors"
                >
                  <i className="fa-solid fa-bell mr-1"></i> Enable Alerts
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Simple Reminders */}
      <section>
        <div className="flex items-center gap-2 mb-4 px-1">
          <i className="fa-solid fa-bell text-blue-500 dark:text-blue-400 text-sm"></i>
          <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Reminders</h3>
        </div>
        
        <div className="space-y-3">
          {upcomingReminders.length > 0 ? (
            upcomingReminders.map((task, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 border-l-4 border-blue-500 dark:border-blue-600 p-4 rounded-2xl shadow-sm flex items-center justify-between group active:scale-95 transition-all">
                <div className="flex items-center gap-4">
                  <div className="text-blue-500 dark:text-blue-400 font-black text-sm w-20 border-r border-slate-100 dark:border-slate-800 flex items-center justify-center text-center">
                    {task.time}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 dark:text-slate-100 uppercase text-sm tracking-tight">{task.medName}</h4>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 uppercase">
                      <i className="fa-solid fa-eye text-[8px]"></i> {task.eye} Eye Only
                    </p>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                  Upcoming
                </div>
              </div>
            ))
          ) : (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500 p-4 rounded-2xl flex items-center gap-3">
              <i className="fa-solid fa-circle-check text-emerald-500 text-xl"></i>
              <p className="text-emerald-800 dark:text-emerald-300 font-bold text-sm uppercase">All drops taken for now!</p>
            </div>
          )}
        </div>
      </section>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center transition-colors">
          <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 w-12 h-12 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
            <i className="fa-solid fa-droplet text-xl"></i>
          </div>
          <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{dropsCount}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Active Drops</span>
        </div>
        
        <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center opacity-70 transition-colors">
          <div className="bg-slate-200 dark:bg-slate-700 text-slate-400 w-12 h-12 rounded-2xl flex items-center justify-center mb-3">
            <i className="fa-solid fa-tablets text-xl"></i>
          </div>
          <span className="text-2xl font-black text-slate-500 dark:text-slate-400">0</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Active Tablets</span>
        </div>
      </div>

      {/* Medical Safety Instruction */}
      <div className="bg-slate-900 dark:bg-black p-6 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex gap-4 items-start">
          <div className="bg-red-500 w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 animate-pulse">
            <i className="fa-solid fa-hand"></i>
          </div>
          <div>
            <h4 className="font-black text-white text-sm uppercase tracking-tight mb-1">Tablet Safety Check</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Do not take any more tablets today unless explicitly prescribed. Ensure at least 5 minutes gap between eye drops.
            </p>
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-10 text-white text-8xl rotate-12">
          <i className="fa-solid fa-ban"></i>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
