import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';
import { apiRequest } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {   //https://llamacoder.together.ai/chats/WSSx84C23kRusx8a
  const [currentUser, setCurrentUser] = useState(null);
    const [availableSlots, setAvailableSlots] = useState(10);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isGuestDropdownOpen, setIsGuestDropdownOpen] = useState(false);
    const [isManageDevicesDropdownOpen, setIsManageDevicesDropdownOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [CurrentUserRole, setCurrentUserRole] = useState(null);
    const [isManageusersDropdownOpen, setIsManageusersDropdownOpen] = useState(false);
    const [isUsersDropdownOpen, setIsUsersDropdownOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);
    const navigate = useNavigate(); 

    useEffect(() => {
      const fetchUser = async () => {
        try {
          const { data } = await apiRequest('/auth/me'); 
          console.log(data.user.identifier);
          setCurrentUser(data.user.identifier);
          setCurrentUserRole(data.user.role);
         
        } catch (error) {
          console.error('Error fetching user:', error);
          navigate('/');
        }
      };
  
      fetchUser();
    }, [navigate]);

    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
      }
    
    // First add cookie helper function (if not already present)

    const handleLogout = async () => {
      try {
          await apiRequest('/logout', 'POST', null, { 
              'X-CSRF-TOKEN': getCookie('csrf_access_token') // ✅ Send CSRF token only for logout
          });
          navigate('/');
      } catch (error) {
          console.error('Logout failed:', error);
      }
  };

    const openGate = async () => {
      try {
        const response = await apiRequest('/open-gate', 'POST', null, { 
          'X-CSRF-TOKEN': getCookie('csrf_access_token') // ✅ Send CSRF token only for logout
      });
        if (response.status === 200) {
          console.log('Gate opened successfully!');
        }
      } catch (err) {
        if (err.response) {
          if (err.response.status === 403) {
            console.log("Your account is not active or you don't have permission to open the gate.");
          } else if (err.response.status === 401) {
            console.log("You need to log in first.");
          } else {
            console.log('An error occurred while opening the gate. Please try again.');
          }
        } else {
          console.log('Network error or server issue.');
        }
      }
      }
      const toggleUsersDropdown = () => {
        setIsUsersDropdownOpen(!isUsersDropdownOpen);
      };  

      const functionchangeUserStatus =(userId, status) => {
        console.log(`Changing status of user ${userId} to ${status}`);
        // Update UI with the new status, or call an API to update the status
      }
  
      // Example function to delete a user (you can replace it with actual API logic)
      const  deleteUser =(userId) => {
        console.log(`Deleting user ${userId}`);
        // Delete user from UI or call an API to delete the user
      }
  
    const toggleSettings = () => {
      setIsSettingsOpen(!isSettingsOpen);
    };
  
    const toggleGuestDropdown = () => {
      setIsGuestDropdownOpen(!isGuestDropdownOpen);
      setIsManageDevicesDropdownOpen(false);
    };
  
    const toggleManageDevicesDropdown = () => {
      setIsManageDevicesDropdownOpen(!isManageDevicesDropdownOpen);
      setIsGuestDropdownOpen(false);
    };
  
    const toggleChangePassword = () => {
      setIsChangePasswordOpen(!isChangePasswordOpen);
    };

    const toggleManageUsers = () => {
      setIsManageusersDropdownOpen(!isManageusersDropdownOpen);
    }

    
  
  
    return (
      <div className="flex h-screen bg-white">
        {/* Navigation Bar */}
        <nav className="w-64 bg-gray-100 p-4 space-y-4">
          <div className="text-lg font-bold">Welcome, {currentUser}</div>
          <div className="space-y-2">
            <div className="relative">
              <button
                className="w-full justify-start flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
                onClick={toggleGuestDropdown}
              >
                Guest <span className="ml-auto">+</span>
              </button>
              {isGuestDropdownOpen && (
                <div className="absolute left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Generate Code</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Available Guest Parking Slots</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Next Availability in 30 minutes</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Alerts</button>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                className="w-full justify-start flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
                onClick={toggleManageDevicesDropdown}
              >
                Manage Devices <span className="ml-auto">+</span>
              </button>
              {isManageDevicesDropdownOpen && (
                <div className="absolute left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Device 1</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Device 2</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Device 3</button>
                </div>
              )}
            </div>
            <button
              className="w-full justify-start flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
              onClick={toggleSettings}
            >
              Settings <span className="ml-auto">⚙️</span>
            </button>
            {(CurrentUserRole === 'admin' || CurrentUserRole === 'management') && (<button class="w-full justify-start flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100" onClick={toggleManageUsers}>
             Manage Users <span class="ml-auto">+</span></button>)}
          </div>
          <div className="mt-4">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
              <div className="text-lg font-bold">Available Slots: {availableSlots}</div>
              <button
                className="w-full justify-start flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 mt-2"
                onClick={openGate}
              >
                Open Gate
              </button>
            </div>
          </div>
        </nav>
  
        {/* Main Content */}
        <main className="flex-grow p-4">
          <div className="text-2xl font-bold">Dashboard</div>
          <p className="text-gray-500">Welcome to your parking management dashboard.</p>

        </main>
  
        {/* Settings Window */}
        {isSettingsOpen && (
          <div className="fixed inset-y-0 right-0 w-80 bg-white p-4 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <div className="text-lg font-bold">Settings</div>
              <button
                className="w-full justify-start flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
                onClick={toggleSettings}
              >
                <span className="ml-auto">❌</span>
              </button>
            </div>
            <div className="space-y-4">
              <button
                className="w-full justify-start flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
                onClick={toggleChangePassword}
              >
                Change Password
              </button>
              {isChangePasswordOpen && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                  <div className="text-lg font-bold">Change Password</div>
                  <div className="space-y-2 mt-2">
                    <label className="block text-sm font-medium text-gray-700">Current Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      className="w-full justify-start flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 mt-2"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              )}
              <button
                className="w-full justify-start flex items-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100"
                onClick={() => {handleLogout();alert('Logging out...')}}
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }