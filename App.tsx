
import React, { useState, useEffect } from 'react';
import { Medication, MedType, DailyTask } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import MedicationList from './components/MedicationList.tsx';
import Schedule from './components/Schedule.tsx';
import Assistant from './components/Assistant.tsx';
import Navbar from './components/Navbar.tsx';
import { TODAY } from './constants.ts';

const STORAGE_KEY = 'ocutrack_medications_v2';
const TASKS_KEY = 'ocutrack_tasks_v2';

const INITIAL_MEDS: Medication[] = [
  // DEXA 42-DAY TAPERING SCHEDULE
  {
    id: 'dexa-p1',
    name: 'DEXA (Days 1–7)',
    type: MedType.DROPS,
    dosage: '1 Drop',
    frequency: 6,
    times: ['7:00 AM', '10:00 AM', '1:00 PM', '3:00 PM', '5:00 PM', '7:00 PM'],
    startDate: '2025-12-21',
    endDate: '2025-12-27',
    eye: 'Right',
    notes: 'Phase 1: 6 times per day. Strictly as per handwritten table.'
  },
  {
    id: 'dexa-p2',
    name: 'DEXA (Days 8–14)',
    type: MedType.DROPS,
    dosage: '1 Drop',
    frequency: 4,
    times: ['7:00 AM', '10:00 AM', '1:00 PM', '7:00 PM'],
    startDate: '2025-12-28',
    endDate: '2026-01-03',
    eye: 'Right',
    notes: 'Phase 2: 4 times per day.'
  },
  {
    id: 'dexa-p3',
    name: 'DEXA (Days 15–21)',
    type: MedType.DROPS,
    dosage: '1 Drop',
    frequency: 3,
    times: ['7:00 AM', '1:00 PM', '7:00 PM'],
    startDate: '2026-01-04',
    endDate: '2026-01-10',
    eye: 'Right',
    notes: 'Phase 3: 3 times per day.'
  },
  {
    id: 'dexa-p4',
    name: 'DEXA (Days 22–28)',
    type: MedType.DROPS,
    dosage: '1 Drop',
    frequency: 2,
    times: ['7:00 AM', '7:00 PM'],
    startDate: '2026-01-11',
    endDate: '2026-01-17',
    eye: 'Right',
    notes: 'Phase 4: 2 times per day.'
  },
  {
    id: 'dexa-p5',
    name: 'DEXA (Days 29–35)',
    type: MedType.DROPS,
    dosage: '1 Drop',
    frequency: 1,
    times: ['7:00 AM'],
    startDate: '2026-01-18',
    endDate: '2026-01-24',
    eye: 'Right',
    notes: 'Phase 5: 1 time per day.'
  },
  {
    id: 'dexa-p6',
    name: 'DEXA (Days 36–42)',
    type: MedType.DROPS,
    dosage: '1 Drop',
    frequency: 1,
    times: ['7:00 AM'],
    startDate: '2026-01-25',
    endDate: '2026-01-31',
    eye: 'Right',
    notes: 'Phase 6: 1 time per day. Final course.'
  },
  
  // AUROFLOX 20-DAY SCHEDULE
  {
    id: 'auro-d1',
    name: 'AUROFLOX (Day 1)',
    type: MedType.DROPS,
    dosage: '1 Drop',
    frequency: 3,
    times: ['12:00 PM', '4:00 PM', '8:00 PM'],
    startDate: '2025-12-21',
    endDate: '2025-12-21',
    eye: 'Right',
    notes: 'Day 1: 8 AM dose omitted.'
  },
  {
    id: 'auro-main',
    name: 'AUROFLOX',
    type: MedType.DROPS,
    dosage: '1 Drop',
    frequency: 4,
    times: ['8:00 AM', '12:00 PM', '4:00 PM', '8:00 PM'],
    startDate: '2025-12-22',
    endDate: '2026-01-09',
    eye: 'Right',
    notes: 'Standard course: Days 2 to 20.'
  },

  // OTHER PRESCRIBED MEDICINES
  {
    id: '3',
    name: 'BRIO',
    type: MedType.DROPS,
    dosage: '1 Drop',
    frequency: 3,
    times: ['8:00 AM', '2:00 PM', '8:00 PM'],
    startDate: '2025-12-21',
    endDate: '2026-12-31',
    eye: 'Right'
  },
  {
    id: '4',
    name: 'LACOMA-T',
    type: MedType.DROPS,
    dosage: '1 Drop',
    frequency: 1,
    times: ['9:00 PM'],
    startDate: '2025-12-21',
    endDate: '2026-12-31',
    eye: 'Left'
  },
  {
    id: '5',
    name: 'IOPAR-SR Capsule',
    type: MedType.TABLET,
    dosage: '1 Capsule',
    frequency: 1,
    times: ['9:00 AM'],
    startDate: '2025-12-21',
    endDate: '2025-12-23'
  },
  {
    id: '6',
    name: 'PANORITE 40',
    type: MedType.TABLET,
    dosage: '1 Tablet',
    frequency: 1,
    times: ['8:00 AM'],
    startDate: '2025-12-21',
    endDate: '2025-12-23',
    notes: 'Take before breakfast.'
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meds' | 'schedule' | 'assistant'>('dashboard');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [dailyTasks, setDailyTasks] = useState<Record<string, DailyTask[]>>({});
  const [darkMode, setDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  const [notifiedTasks, setNotifiedTasks] = useState<Set<string>>(new Set());

  // Initialization
  useEffect(() => {
    // Theme
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    // Load Meds
    const savedMeds = localStorage.getItem(STORAGE_KEY);
    if (savedMeds && JSON.parse(savedMeds).length > 0) {
      setMedications(JSON.parse(savedMeds));
    } else {
      setMedications(INITIAL_MEDS);
    }
    
    // Load Tasks
    const savedTasks = localStorage.getItem(TASKS_KEY);
    if (savedTasks) {
      setDailyTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Generate Today's Tasks if missing
  useEffect(() => {
    if (medications.length === 0) return;
    if (dailyTasks[TODAY] && dailyTasks[TODAY].length > 0) return;

    const newTasks: DailyTask[] = [];
    const activeMeds = medications.filter(m => TODAY >= m.startDate && TODAY <= m.endDate);

    activeMeds.forEach(med => {
      med.times.forEach(time => {
        newTasks.push({
          medicationId: med.id,
          medName: med.name,
          type: med.type,
          time,
          completed: false,
          eye: med.eye
        });
      });
    });

    const timeToMinutes = (t: string) => {
      const [timeStr, period] = t.split(' ');
      let [hours, minutes] = timeStr.split(':').map(Number);
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };
    newTasks.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    setDailyTasks(prev => ({ ...prev, [TODAY]: newTasks }));
  }, [medications, dailyTasks]);

  // Real-time clock & Notifications
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Notification Logic
      if (Notification.permission === 'granted') {
        let hours = now.getHours();
        const minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 should be 12
        const minutesStr = minutes < 10 ? '0' + minutes : minutes;
        const timeString = `${hours}:${minutesStr} ${ampm}`;

        const tasksForToday = dailyTasks[TODAY] || [];
        
        tasksForToday.forEach(task => {
          if (!task.completed && task.time === timeString) {
            const uniqueKey = `${task.medicationId}-${task.time}-${TODAY}`;
            if (!notifiedTasks.has(uniqueKey)) {
               new Notification(`Time for ${task.medName}`, {
                 body: `Please take your ${task.dosage} (${task.eye ? task.eye + ' Eye' : 'Tablet'}).`,
                 icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063176.png'
               });
               setNotifiedTasks(prev => {
                 const newSet = new Set(prev);
                 newSet.add(uniqueKey);
                 return newSet;
               });
            }
          }
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [dailyTasks, notifiedTasks]);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setDarkMode(true);
    }
  };

  const requestNotificationPermission = () => {
    if (!('Notification' in window)) {
      alert("This browser does not support desktop notifications");
      return;
    }
    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission);
      if (permission === 'granted') {
        new Notification("OcuTrack Notifications Enabled", { body: "You will now receive alerts for your eye drops." });
      }
    });
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(medications));
  }, [medications]);

  useEffect(() => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(dailyTasks));
  }, [dailyTasks]);

  const addMedication = (med: Medication) => {
    setMedications([...medications, med]);
  };

  const toggleTask = (date: string, taskId: number) => {
    const dayTasks = dailyTasks[date] ? [...dailyTasks[date]] : [];
    if (dayTasks[taskId]) {
      dayTasks[taskId].completed = !dayTasks[taskId].completed;
      setDailyTasks({ ...dailyTasks, [date]: dayTasks });
    }
  };

  const getActiveMedications = () => {
    return medications.filter(m => TODAY >= m.startDate && TODAY <= m.endDate);
  };

  const getCompletedMedications = () => {
    return medications.filter(m => TODAY > m.endDate);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 pb-24 flex flex-col items-center">
      <header className="w-full bg-white dark:bg-slate-900 dark:border-slate-800 shadow-sm border-b p-4 sticky top-0 z-20 transition-colors duration-300">
        <div className="relative flex items-center justify-center">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <i className="fa-solid fa-eye animate-eye-blink"></i> OcuTrack
          </h1>
          
          <div className="absolute right-0 flex items-center gap-2">
            {notificationPermission !== 'granted' ? (
              <button 
                onClick={requestNotificationPermission}
                className="text-slate-400 hover:text-blue-600 transition-colors"
                title="Enable Notifications"
              >
                <i className="fa-solid fa-bell-slash text-lg"></i>
              </button>
            ) : (
              <div className="text-blue-500 dark:text-blue-400" title="Notifications Active">
                <i className="fa-solid fa-bell text-lg"></i>
              </div>
            )}
            
            <button 
              onClick={toggleTheme}
              className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <i className={`fa-solid ${darkMode ? 'fa-sun' : 'fa-moon'} text-xl`}></i>
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1 font-medium">
           <span className="font-mono text-blue-600 dark:text-blue-400 mr-2 tracking-wide">
             {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
           </span>
           • {currentTime.toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'})}
        </p>
      </header>

      <main className="w-full max-w-xl px-4 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard 
            activeMeds={getActiveMedications()} 
            tasks={dailyTasks[TODAY] || []}
          />
        )}
        {activeTab === 'meds' && (
          <MedicationList 
            medications={medications} 
            onAdd={addMedication} 
          />
        )}
        {activeTab === 'schedule' && (
          <Schedule 
            activeMeds={getActiveMedications()} 
            completedMeds={getCompletedMedications()}
            tasks={dailyTasks}
            onToggleTask={toggleTask}
            setDailyTasks={setDailyTasks}
          />
        )}
        {activeTab === 'assistant' && (
          <Assistant medications={medications} />
        )}
      </main>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
