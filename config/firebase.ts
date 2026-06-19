// config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCb3MzBHmgamAWjZqr1YwN06324ffZ2WWU",
  authDomain: "chant-eeif.firebaseapp.com",
  projectId: "chant-eeif",
  storageBucket: "chant-eeif.firebasestorage.app",
  messagingSenderId: "1045593083167",
  appId: "1:1045593083167:web:3bc9541a511bf95b9ab42a",
  measurementId: "G-H6BQJTDXWG"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);