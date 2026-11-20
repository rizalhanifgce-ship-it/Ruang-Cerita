import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from '../firebase';
import { VisitorRecord } from '../types';

function sanitizeVisitorForFirestore(record: VisitorRecord): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: String(record.id).slice(0, 128),
    timestamp: String(record.timestamp).slice(0, 64),
    studentName: String(record.studentName).trim().slice(0, 120),
    studentClass: String(record.studentClass).trim().slice(0, 32),
    serviceType: record.serviceType === 'pengaduan' ? 'pengaduan' : 'konseling',
    assignedTeacherId: String(record.assignedTeacherId).slice(0, 64),
    assignedTeacherName: String(record.assignedTeacherName).slice(0, 120),
    notes: String(record.notes || '').slice(0, 4000),
    status: record.status || 'Menunggu',
  };

  if (record.studentWhatsapp) {
    payload.studentWhatsapp = String(record.studentWhatsapp).slice(0, 32);
  }
  if (record.mood) {
    payload.mood = String(record.mood).slice(0, 32);
  }
  if (record.followUpNotes !== undefined && record.followUpNotes !== '') {
    payload.followUpNotes = String(record.followUpNotes).slice(0, 4000);
  }
  if (record.counselorNotes !== undefined && record.counselorNotes !== '') {
    payload.counselorNotes = String(record.counselorNotes).slice(0, 4000);
  }
  if (record.handledAt) {
    payload.handledAt = String(record.handledAt).slice(0, 64);
  }
  if (record.satisfaction) {
    payload.satisfaction = record.satisfaction;
  }
  return payload;
}

export async function createVisitorInFirestore(record: VisitorRecord): Promise<void> {
  const path = `visitors/${record.id}`;
  try {
    await setDoc(doc(db, 'visitors', record.id), sanitizeVisitorForFirestore(record));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateVisitorInFirestore(
  id: string,
  updates: Partial<VisitorRecord>
): Promise<void> {
  const path = `visitors/${id}`;
  const cleanUpdates: Record<string, unknown> = {};

  if (updates.status !== undefined) cleanUpdates.status = updates.status;
  if (updates.followUpNotes !== undefined) {
    cleanUpdates.followUpNotes = String(updates.followUpNotes).slice(0, 4000);
  }
  if (updates.counselorNotes !== undefined) {
    cleanUpdates.counselorNotes = String(updates.counselorNotes).slice(0, 4000);
  }
  if (updates.handledAt !== undefined) {
    cleanUpdates.handledAt = String(updates.handledAt).slice(0, 64);
  }
  if (updates.satisfaction !== undefined) {
    cleanUpdates.satisfaction = updates.satisfaction;
  }

  try {
    await updateDoc(doc(db, 'visitors', id), cleanUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteVisitorInFirestore(id: string): Promise<void> {
  const path = `visitors/${id}`;
  try {
    await deleteDoc(doc(db, 'visitors', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeVisitorsFromFirestore(
  onData: (records: VisitorRecord[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const path = 'visitors';
  const q = query(collection(db, path), orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: VisitorRecord[] = snapshot.docs.map((d) => d.data() as VisitorRecord);
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // already logged by handleFirestoreError
      }
    }
  );
}

export async function saveSettingToFirestore(
  settingId: string,
  data: Record<string, unknown>
): Promise<void> {
  const path = `settings/${settingId}`;
  try {
    await setDoc(doc(db, 'settings', settingId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeSettingFromFirestore<T>(
  settingId: string,
  onData: (data: T) => void
): Unsubscribe {
  const path = `settings/${settingId}`;
  return onSnapshot(
    doc(db, 'settings', settingId),
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as T);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch {
        // already logged
      }
    }
  );
}

export async function signInAdminWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutAdminFromFirebase(): Promise<void> {
  await signOut(auth);
}

export function subscribeFirebaseAuth(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}
