import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NavBarFooter from './Dashboard/NavBarFooter'
import Sidebar from './Dashboard/Sidebar';
import '../styles/test_dash.css';
import HeroSectionUser from "./Dashboard/HeroSectionUser";
import HeroSectionAdmin from "./Dashboard/HeroSectionAdmin";

export default function Dashboard() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('Home');
  useEffect(() => {

    console.log(user, loading);  
    if (!user && !loading) {
      navigate('/'); // Redirect if user is not authenticated
    }
  }, [loading, user, navigate]);

  if (loading) return <p>Loading...</p>; // Prevents flickering
   if (!user) return null;
  return (
    <div className="flex flex-col min-h-screen">
      <NavBarFooter />
      <div className="flex flex-1">
        <Sidebar setActiveSection={setActiveSection} />
        {user.role === 'admin'|| user.role === 'management' ? <HeroSectionAdmin activeSection={activeSection} /> : <HeroSectionUser activeSection={activeSection} />}
      </div>
    </div>
  )
}