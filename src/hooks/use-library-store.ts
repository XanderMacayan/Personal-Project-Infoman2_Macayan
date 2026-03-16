"use client"

import { useEffect } from 'react';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { useFirestore, useCollection, useDoc, useUser, useMemoFirebase } from '@/firebase';
import { VisitorLogEntry, LibraryVisitor, MOCK_USERS } from '@/lib/mock-data';
import { addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface UseLibraryStoreOptions {
  fetchLogs?: boolean;
}

export function useLibraryStore(options: UseLibraryStoreOptions = {}) {
  const firestore = useFirestore();
  const { user } = useUser();

  // Admin Sentinel: Check if the current user UID exists in the roles_admin collection
  const adminSentinelRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'roles_admin', user.uid);
  }, [firestore, user]);

  const { data: adminRole, isLoading: isAdminCheckLoading } = useDoc(adminSentinelRef);
  const isAdmin = !!adminRole;

  // Fetch visit logs only for admins when explicitly requested
  const logsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin || !options.fetchLogs) return null;
    return query(collection(firestore, 'visitLogs'), orderBy('entryDateTime', 'desc'));
  }, [firestore, isAdmin, options.fetchLogs]);

  // Fetch all users for identification and management
  const visitorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: logs, isLoading: isLogsLoading } = useCollection<VisitorLogEntry>(logsQuery);
  const { data: visitors, isLoading: isVisitorsLoading } = useCollection<LibraryVisitor>(visitorsQuery);

  // Database Synchronization: Ensure all MOCK_USERS exist in Firestore
  useEffect(() => {
    if (!firestore || isVisitorsLoading) return;
    
    // Always attempt to set MOCK_USERS to ensure they exist and have current names/roles
    MOCK_USERS.forEach((mockUser) => {
      const docRef = doc(firestore, 'users', mockUser.id);
      setDocumentNonBlocking(docRef, {
        ...mockUser,
        isBlocked: mockUser.isBlocked ?? false,
        role: mockUser.role || (mockUser.isEmployee ? 'Admin' : 'Visitor')
      }, { merge: true });
    });
  }, [firestore, isVisitorsLoading]);

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
