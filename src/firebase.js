import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDbnn4m8KDBYun1OxuPocXLDTIuK29xSns",
  authDomain: "info-transporte-urbano-sf.firebaseapp.com",
  projectId: "info-transporte-urbano-sf",
  appId: "1:68233107354:web:42f52795bdf7dcae26cc23",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence);

export const provider = new GoogleAuthProvider();

provider.setCustomParameters({
  prompt: "select_account",
});
