"use client"

import { useMemo, useEffect } from 'react';
import { collection, query, orderBy, doc, getDocs, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useDoc, useUser, useMemoFirebase } from '@/firebase';
import { VisitorLogEntry, LibraryVisitor, MOCK_USERS } from '@/lib/mock-data';
import { addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'visitLogs'), orderBy('entryDateTime', 'desc'));
  }, [firestore, isAdmin]);

  const visitorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: logs, isLoading: isLogsLoading } = useCollection<VisitorLogEntry>(logsQuery);
  const { data: visitors, isLoading: isVisitorsLoading } = useCollection<LibraryVisitor>(visitorsQuery);

  // Auto-seed mock users if the collection is empty
  useEffect(() => {
    async function checkAndSeed() {
      if (!firestore || isVisitorsLoading || (visitors && visitors.length > 0)) return;
      
      const usersCol = collection(firestore, 'users');
      const snapshot = await getDocs(query(usersCol, limit(1)));
      
      if (snapshot.empty) {
        MOCK_USERS.forEach((mockUser) => {
          const docRef = doc(firestore, 'users', mockUser.id);
          setDocumentNonBlocking(docRef, {
            ...mockUser,
            isBlocked: false,
            role: mockUser.isEmployee ? 'Admin' : 'Visitor'
          }, { merge: true });
        });
      }
    }
    checkAndSeed();
  }, [firestore, visitors, isVisitorsLoading]);

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

  const claimAdminStatus = () => {
    if (!firestore || !user) return;
    const adminRef = doc(firestore, 'roles_admin', user.uid);
    setDocumentNonBlocking(adminRef, { grantedAt: new Date().toISOString() }, { merge: true });
  };

  return { 
    logs: logs || [], 
    visitors: visitors || [], 
    addLog, 
    toggleBlockVisitor, 
    claimAdminStatus,
    isLoaded,
    isAdmin 
  };
}
