import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Auth } from './components/Auth';
import { DoctorPortal } from './components/DoctorPortal';
import { PatientPortal } from './components/PatientPortal';
import { ScreenLoader } from './components/ProgressBar';
import { MovingSidebar } from './components/Sidebar';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'doctor' | 'patient' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
          setUser(currentUser);
        } else {
          // Fallback or cleanup
          setUser(null);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <ScreenLoader message="Securing session..." />;
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen">
      <MovingSidebar />
      {role === 'doctor' ? (
        <DoctorPortal currentUser={user} />
      ) : (
        <PatientPortal currentUser={user} />
      )}
    </div>
  );
};

export default App;
