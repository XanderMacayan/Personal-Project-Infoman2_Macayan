"use client"

import { useMemo } from 'react';
import { collection, query, orderBy, doc, where } from 'firebase/firestore';
import { useFirestore, useCollection, useDoc, useUser, useMemoFirebase } from '@/firebase';
import { VisitorLogEntry, LibraryVisitor } from '@/lib/mock-data';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export function useLibraryStore() {
  const { firestore } = useFirestore() ? { firestore: useFirestore() } : { firestore: null };
  const { user } = useUser();

  // Check if the current user is an admin by looking at the sentinel collection
  const adminSentinelRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminRole, isLoading: isAdminCheckLoading } = useDoc(adminSentinelRef);
  const isAdmin = !!adminRole;

  // Memoize collection references
  const logsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null; // Only fetch logs for admins to respect privacy and rules
    return query(collection(firestore, 'visitLogs'), orderBy('entryDateTime', 'desc'));
  }, [firestore, isAdmin]);

  const visitorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Visitors are needed by both the terminal and admin management
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: logs, isLoading: isLogsLoading } = useCollection<VisitorLogEntry>(logsQuery);
  const { data: visitors, isLoading: isVisitorsLoading } = useCollection<LibraryVisitor>(visitorsQuery);

  const isLoaded = !isAdminCheckLoading && !isVisitorsLoading && (!isAdmin || !isLogsLoading);

  const addLog = (log: Omit<VisitorLogEntry, 'id'>) => {
    if (!firestore) return;
    const colRef = collection(firestore, 'visitLogs');
    const entryData = {
      ...log,
      entryDateTime: new Date().toISOString(),
    };
    addDocumentNonBlocking(colRef, entryData);
  };

  const toggleBlockVisitor = (visitorId: string) => {
    if (!firestore || !isAdmin) return;
    const visitor = visitors?.find(v => v.id === visitorId);
    if (visitor) {
      const docRef = doc(firestore, 'users', visitorId);
      updateDocumentNonBlocking(docRef, { isBlocked: !visitor.isBlocked });
    }
  };

  return { 
    logs: logs || [], 
    visitors: visitors || [], 
    addLog, 
    toggleBlockVisitor, 
    isLoaded,
    isAdmin 
  };
}
