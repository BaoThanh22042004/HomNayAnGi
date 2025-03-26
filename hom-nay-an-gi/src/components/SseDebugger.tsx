'use client';

import { useState, useEffect } from 'react';

export default function SseDebugger() {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState('Not connected');
  
  useEffect(() => {
    if (!isVisible) return;
    
    const addLog = (message: string) => {
      const timestamp = new Date().toISOString().substring(11, 19);
      setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
    };
    
    addLog('Starting SSE debug connection...');
    
    try {
      const source = new EventSource('/api/selections/events?debug=true');
      
      source.onopen = () => {
        setConnectionStatus('Connected');
        addLog('Connection established');
      };
      
      source.onerror = () => {
        setConnectionStatus(source.readyState === EventSource.CLOSED ? 'Closed' : 'Error');
        addLog(`Connection error (state: ${source.readyState})`);
      };
      
      source.onmessage = (event) => {
        addLog(`Generic message: ${event.data.substring(0, 50)}`);
      };
      
      source.addEventListener('connected', (event) => {
        addLog(`Connected event: ${event.data.substring(0, 50)}`);
      });
      
      source.addEventListener('selection-update', (event) => {
        addLog(`Update event: ${event.data.substring(0, 50)}`);
      });
      
      source.addEventListener('heartbeat', () => {
        addLog('♥ Heartbeat');
      });
      
      return () => {
        addLog('Closing debug connection');
        source.close();
      };
    } catch (err) {
      addLog(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setConnectionStatus('Failed');
    }
  }, [isVisible]);
  
  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-gray-200 text-gray-800 rounded px-2 py-1 text-xs opacity-50 hover:opacity-100"
      >
        Debug SSE
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-0 left-0 w-80 h-60 bg-black bg-opacity-80 text-white p-2 z-50 overflow-auto text-xs">
      <div className="flex justify-between mb-2">
        <div>SSE: <span className={connectionStatus === 'Connected' ? 'text-green-400' : 'text-red-400'}>{connectionStatus}</span></div>
        <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-white">Close</button>
      </div>
      <div className="overflow-y-auto h-48 font-mono">
        {logs.map((log, i) => (
          <div key={i} className="pb-1">{log}</div>
        ))}
        {logs.length === 0 && <div className="text-gray-500">No events yet</div>}
      </div>
    </div>
  );
}
