
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBTAnrMEZdRWgXjGjeO0u-Sdz4Ysj9_0Qo",
  authDomain: "webcarros-a671c.firebaseapp.com",
  projectId: "webcarros-a671c",
  storageBucket: "webcarros-a671c.firebasestorage.app",
  messagingSenderId: "450265612761",
  appId: "1:450265612761:web:478a1a99a097dcab3819c8"
};


const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };