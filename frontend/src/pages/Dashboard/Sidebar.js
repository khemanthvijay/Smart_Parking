import React, { useState } from 'react'
import '../../styles/test_dash.css'
import { useAuth } from '../../contexts/AuthContext';

export default function Sidebar({ setActiveSection }) {
    const [activeButton, setActiveButton] = useState('Home')
    const { user } = useAuth();
    const handleButtonClick = (section) => {
      setActiveSection(section)
      setActiveButton(section)
    }
  
    return (
      <aside className="sidebar">
        <div className="p-4">
          <button
            className={`button ${activeButton === 'Home' ? 'default' : 'outline'} w-full justify-start mb-2`}
            onClick={() => handleButtonClick('Home')}
          >
            Home
          </button>
          {(user.role === 'admin' || user.role === 'management') && (<button
            className={`button ${activeButton === 'Manage Users' ? 'default' : 'outline'} w-full justify-start mb-2`}
            onClick={() => handleButtonClick('Manage Users')}
          >
            Manage Users
          </button>)}
          <button
            className={`button ${activeButton === 'Guest' ? 'default' : 'outline'} w-full justify-start mb-2`}
            onClick={() => handleButtonClick('Guest')}
          >
            Guest
          </button>
          <button
            className={`button ${activeButton === 'Manage Devices' ? 'default' : 'outline'} w-full justify-start mb-2`}
            onClick={() => handleButtonClick('Manage Devices')}
          >
            Manage Devices
          </button>
          <button
            className={`button ${activeButton === 'Settings' ? 'default' : 'outline'} w-full justify-start mb-2`}
            onClick={() => handleButtonClick('Settings')}
          >
            Settings
          </button>
        </div>
      </aside>
    )
  }