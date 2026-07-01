import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDcbsMA--X2kCqv1_qDvc8txBTnL6LOx4k",
  authDomain: "jangho-d27c1.firebaseapp.com",
  projectId: "jangho-d27c1",
  storageBucket: "jangho-d27c1.firebasestorage.app",
  messagingSenderId: "412396824311",
  appId: "1:412396824311:web:5033d52b088adea70295f2"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);

export async function saveRecord(data) {
  return await addDoc(collection(db, "jangho"), {
    ...data,
    createdAt: serverTimestamp()
  });
}

export async function loadRecords() {
  const q = query(
    collection(db, "jangho"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function uploadImage(file) {
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const imageRef = ref(storage, `jangho/${fileName}`);

  await uploadBytes(imageRef, file);

  return await getDownloadURL(imageRef);
}