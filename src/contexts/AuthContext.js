import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import {  GoogleAuthProvider } from "firebase/auth";
const AuthContext = createContext(null);
const provider = new GoogleAuthProvider();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
provider.setCustomParameters({
  prompt: "select_account"
});

const handleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("Success:", result.user.email);
  } catch (error) {
    console.error("Error Code:", error.code); 
    console.error("Error Message:", error.message);
  }
};

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
