import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCsWtDEtGU5-pu6o0XZbXiC9FJlkCOw-G0",
  authDomain: "ai-task-orchestrator-c657a.firebaseapp.com",
  projectId: "ai-task-orchestrator-c657a",
  storageBucket: "ai-task-orchestrator-c657a.firebasestorage.app",
  messagingSenderId: "514839212639",
  appId: "1:514839212639:web:0cdf86133cb0512736e1ea",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
