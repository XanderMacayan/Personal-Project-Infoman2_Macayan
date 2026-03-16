"use client"

import { useState, useEffect } from 'react';
import { VisitorLogEntry, LibraryVisitor, MOCK_USERS } from '@/lib/mock-data';

export function useLibraryStore() {
  const [logs, setLogs] = useState<VisitorLogEntry[]>([]);
  const [visitors, setVisitors] = useState<LibraryVisitor[]>(MOCK_USERS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedLogs = localStorage.getItem('neu_library_logs');
    const savedVisitors = localStorage.getItem('neu_library_visitors');
    
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
    
    if (savedVisitors) {
      setVisitors(JSON.parse(savedVisitors));
    } else {
      localStorage.setItem('neu_library_visitors', JSON.stringify(MOCK_USERS));
    }
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('neu_library_logs', JSON.stringify(logs));
    }
  }, [logs, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('neu_library_visitors', JSON.stringify(visitors));
    }
  }, [visitors, isLoaded]);

  const addLog = (log: Omit<VisitorLogEntry, 'id'>) => {
    const newLog = { ...log, id: Math.random().toString(36).substr(2, 9) };
    setLogs(prev => [newLog, ...prev]);
  };

  const toggleBlockVisitor = (visitorId: string) => {
    setVisitors(prev => prev.map(v => 
      v.id === visitorId ? { ...v, isBlocked: !v.isBlocked } : v
    ));
  };

  return { logs, visitors, addLog, toggleBlockVisitor, isLoaded };
}