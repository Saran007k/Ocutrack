
import React, { useState, useRef, useEffect } from 'react';
import { Medication, ChatMessage } from '../types.ts';
import { getMedicalSearchInfo } from '../services/geminiService.ts';

interface AssistantProps {
  medications: Medication[];
}

const Assistant: React.FC<AssistantProps> = ({ medications }) => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState<{title: string, url: string}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isLoading]);

  const handleSend = async (e?: React.FormEvent, customQuery?: string) => {
    e?.preventDefault();
    const activeQuery = customQuery || query;
    if (!activeQuery.trim()) return;

    setQuery('');
    setHistory(prev => [...prev, { role: 'user', content: activeQuery }]);
    setIsLoading(true);
    setSources([]);

    try {
      const result = await getMedicalSearchInfo(activeQuery);
      setHistory(prev => [...prev, { role: 'assistant', content: result.text }]);
      setSources(result.sources);
    } catch (error) {
      setHistory(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[700px] space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex-shrink-0 transition-colors">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <i className="fa-solid fa-robot text-blue-500"></i> AI Health Assistant
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">Providing calm, medical info based on latest research.</p>
      </div>

      {/* Chat History Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 p-2 scroll-smooth bg-slate-50/50 dark:bg-slate-950 rounded-2xl"
      >
        {history.length === 0 && !isLoading && (
          <div className="text-center py-12 px-4">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <i className="fa-solid fa-comment-medical text-3xl"></i>
            </div>
            <h3 className="text-slate-700 dark:text-slate-200 font-bold text-lg mb-2">How can I help you today?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 px-6">Ask about your eye drops, side effects, or application techniques.</p>
            
            <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto">
              {[
                "How to apply eye drops safely?",
                "Common side effects of Brimonidine",
                "Eye drop generic name lookup",
                "Why do I need to close my eyes after drops?"
              ].map(q => (
                <button 
                  key={q} 
                  onClick={() => handleSend(undefined, q)}
                  className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 p-3 rounded-xl border border-blue-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-600 hover:shadow-sm transition-all text-left w-full sm:w-auto"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 dark:bg-blue-600 text-white rounded-br-none' 
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
              <div className="flex gap-1.5 items-center">
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mr-2">Analyzing</span>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}

        {/* Search Grounding Sources */}
        {!isLoading && sources.length > 0 && (
          <div className="bg-blue-50/50 dark:bg-slate-900 p-4 rounded-2xl border border-blue-100 dark:border-slate-800 mt-2 mx-2">
            <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <i className="fa-solid fa-magnifying-glass"></i> Trusted Sources Found
            </p>
            <div className="flex flex-col gap-2">
              {sources.map((src, idx) => (
                <a 
                  key={idx} 
                  href={src.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-2 truncate p-2 bg-white dark:bg-slate-800 rounded-lg border border-blue-50 dark:border-slate-700 shadow-sm"
                >
                  <i className="fa-solid fa-earth-americas text-[10px] text-slate-400 dark:text-slate-500"></i>
                  {src.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-2 flex-shrink-0 bg-white dark:bg-slate-900 border-t dark:border-slate-800 rounded-b-2xl transition-colors">
        <div className="relative">
          <input 
            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 pl-5 pr-14 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none shadow-inner text-sm dark:text-white"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ask a medical question..."
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-2 top-2 bottom-2 bg-blue-600 dark:bg-blue-500 text-white w-10 rounded-xl flex items-center justify-center disabled:opacity-50 transition-all hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-95 shadow-md"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-3 px-4 leading-tight">
          <strong>Important:</strong> This assistant provides information based on medical search results. It is not a substitute for professional medical advice, diagnosis, or treatment.
        </p>
      </form>
    </div>
  );
};

export default Assistant;
