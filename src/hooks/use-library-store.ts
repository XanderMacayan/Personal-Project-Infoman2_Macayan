
"use client"

import { useEffect } from 'react';
import { collection, query, orderBy, doc, getDocs, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useDoc, useUser, useMemoFirebase } from '@/firebase';
import { VisitorLogEntry, LibraryVisitor, MOCK_USERS } from '@/lib/mock-data';
import { addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface UseLibraryStoreOptions {
  fetchLogs?: boolean;
}

export function useLibraryStore(options: UseLibraryStoreOptions = {}) {
  const firestore = useFirestore();
  const { user } = useUser();

  const adminSentinelRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminRole, isLoading: isAdminCheckLoading } = useDoc(adminSentinelRef);
  const isAdmin = !!adminRole;

  // Only fetch visit logs if explicitly requested and the user is a confirmed admin
  const logsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin || !options.fetchLogs) return null;
    return query(collection(firestore, 'visitLogs'), orderBy('entryDateTime', 'desc'));
  }, [firestore, isAdmin, options.fetchLogs]);

  const visitorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: logs, isLoading: isLogsLoading } = useCollection<VisitorLogEntry>(logsQuery);
  const { data: visitors, isLoading: isVisitorsLoading } = useCollection<LibraryVisitor>(visitorsQuery);

  useEffect(() => {
    async function checkAndSeed() {
      if (!firestore || isVisitorsLoading) return;
      
      const usersCol = collection(firestore, 'users');
      
      if (!visitors || visitors.length === 0) {
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
      } else {
        // Sync names if they differ from institutional records
        MOCK_USERS.forEach(mockUser => {
          const existing = visitors.find(v => v.id === mockUser.id);
          if (existing && existing.name !== mockUser.name) {
            const docRef = doc(firestore, 'users', mockUser.id);
            // Rules allow name updates for signed-in users
            updateDocumentNonBlocking(docRef, { name: mockUser.name });
          }
        });
      }
    }
    checkAndSeed();
  }, [firestore, visitors, isVisitorsLoading]);

  const isLoaded = !isAdminCheckLoading && !isVisitorsLoading && (!options.fetchLogs || !isLogsLoading);

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

  const revokeAdminStatus = () => {
    if (!firestore || !user) return;
    const adminRef = doc(firestore, 'roles_admin', user.uid);
    deleteDocumentNonBlocking(adminRef);
  };

  return { 
    logs: logs || [], 
    visitors: visitors || [], 
    addLog, 
    toggleBlockVisitor, 
    claimAdminStatus,
    revokeAdminStatus,
    isLoaded,
    isAdmin 
  };
}
