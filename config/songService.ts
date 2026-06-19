// config/songService.ts
// Ce fichier contient toutes les fonctions pour lire/écrire les chansons dans Firebase

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { CHANSONS_INITIALES, type Chanson } from '../data/chansons';
import { db } from './firebase';

const COLLECTION = 'chansons';

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'chant_eeif_chansons_cache';

// ── Initialiser Firebase avec les chansons de démarrage ──────────────────────
// À appeler une seule fois, la première fois que tu lances l'app.
// Elle vérifie si la collection est vide, et si oui, importe chansons.ts

//export async function initialiserChansons(): Promise<void> {
//  const snapshot = await getDocs(collection(db, COLLECTION));
//  if (!snapshot.empty) return; // déjà initialisé, on ne fait rien
//
//  console.log('Première initialisation : import des chansons de départ…');
//  for (const chanson of CHANSONS_INITIALES) {
//    await addDoc(collection(db, COLLECTION), chanson);
//  }
//  console.log('Import terminé.');
//}
export async function initialiserChansons(): Promise<void> {
  const snapshot = await getDocs(collection(db, COLLECTION));
  if (!snapshot.empty) return;

  console.log('Première initialisation : import des chansons de départ…');
  for (const chanson of CHANSONS_INITIALES) {
    const { id, ...sanId } = chanson;
    const propre = nettoyerObjet(sanId);
    await addDoc(collection(db, COLLECTION), propre);
  }
  console.log('Import terminé.');
}

// ── Écouter les chansons en temps réel ───────────────────────────────────────
// Appelle le callback chaque fois que la base de données change
// Retourne une fonction "unsubscribe" à appeler pour arrêter l'écoute
//export function ecouterChansons(callback: (chansons: Chanson[]) => void): () => void {
//  const q = query(collection(db, COLLECTION), orderBy('dateAjout', 'desc'));
//  const unsubscribe = onSnapshot(q, (snapshot) => {
//    const chansons: Chanson[] = snapshot.docs.map((docSnap) => ({
//      ...(docSnap.data() as Chanson),
//      id: docSnap.id, // l'id Firebase remplace l'id local
//    }));
//    callback(chansons);
//  });
//  return unsubscribe;
//}
export function ecouterChansons(callback: (chansons: Chanson[]) => void): () => void {
  // 1. Charger le cache immédiatement (démarrage instantané)
  AsyncStorage.getItem(CACHE_KEY).then((cached) => {
    if (cached) {
      try {
        const chansons = JSON.parse(cached) as Chanson[];
        callback(chansons); // affiche les données en cache tout de suite
      } catch (_) {}
    }
  });

  // 2. Écouter Firebase en arrière-plan et mettre à jour le cache
  const q = query(collection(db, COLLECTION), orderBy('dateAjout', 'desc'));
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const chansons: Chanson[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as Chanson),
        id: docSnap.id,
      }));
      callback(chansons);
      // Sauvegarder en cache pour la prochaine fois
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(chansons)).catch(console.error);
    },
    (error) => {
      console.warn('Firebase hors ligne ou erreur — cache utilisé :', error.message);
      // L'app continue avec le cache chargé à l'étape 1
    }
  );

  return unsubscribe;
}

function nettoyerObjet(obj: any): any {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, v === null ? null : typeof v === 'object' && !Array.isArray(v) ? nettoyerObjet(v) : Array.isArray(v) ? v.map((item: any) => typeof item === 'object' ? nettoyerObjet(item) : item) : v])
  );
}

// ── Soumettre une nouvelle chanson ───────────────────────────────────────────
//export async function soumettreChangon(chanson: Omit<Chanson, 'id'>): Promise<string> {
//  const docRef = await addDoc(collection(db, COLLECTION), chanson);
//  return docRef.id;
//}
export async function soumettreChangon(chanson: Omit<Chanson, 'id'>): Promise<string> {
  const propre = nettoyerObjet(chanson);
  const docRef = await addDoc(collection(db, COLLECTION), propre);
  return docRef.id;
}

// ── Mettre à jour une chanson (validation, modification) ─────────────────────
//export async function mettreAJourChanson(id: string, data: Partial<Chanson>): Promise<void> {
//  await updateDoc(doc(db, COLLECTION, id), data as any);
//}
export async function mettreAJourChanson(id: string, data: Partial<Chanson>): Promise<void> {
  const propre = nettoyerObjet(data);
  await updateDoc(doc(db, COLLECTION, id), propre);
}

// ── Supprimer une chanson ────────────────────────────────────────────────────
export async function supprimerChanson(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

// ── Modification collaborative ────────────────────────────────────────────────
const COLLECTION_REMARQUES = 'remarques';

export function ecouterRemarques(callback: (remarques: any[]) => void): () => void {
  const q = query(collection(db, COLLECTION_REMARQUES), orderBy('dateAjout', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ ...d.data(), id: d.id })));
  });
}

export async function soumettreRemarque(remarque: Omit<any, 'id'>): Promise<void> {
  await addDoc(collection(db, COLLECTION_REMARQUES), nettoyerObjet(remarque));
}

export async function marquerRemarqueTraitee(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION_REMARQUES, COLLECTION_REMARQUES, id), { statut: 'traitée' });
}

export async function supprimerRemarque(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_REMARQUES, id));
}