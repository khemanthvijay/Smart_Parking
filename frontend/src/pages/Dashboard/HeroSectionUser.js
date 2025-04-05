import React from 'react'
import { LineChart, XAxis, YAxis, Line, CartesianGrid, Tooltip, Legend } from "recharts"
import '../../styles/test_dash.css'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiRequest } from '../../utils/api';
import { useState, useEffect } from 'react';


const data = [
  { name: '1', slots: 400, guests: 50 },
  { name: '2', slots: 380, guests: 60 },
  { name: '3', slots: 350, guests: 70 },
  { name: '4', slots: 320, guests: 80 },
  { name: '5', slots: 300, guests: 90 },
  { name: '6', slots: 280, guests: 100 },
  { name: '7', slots: 250, guests: 110 },
]

export default function HeroSection({ activeSection }) {
  const { user, loading } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  useEffect(() => {
    if (!loading && user) {
      fetchDashboardData();
      const intervalId = setInterval(fetchDashboardData, 90000);
      return () => clearInterval(intervalId);
    }
  }, [loading, user]);

  const fetchDashboardData = async () => {
    try {
      const response = await apiRequest('/dashboard-user-data');
      setDashboardData(response.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };
  
    const navigate = useNavigate();
    if (!loading && !user) {
        navigate('/'); // Redirect if user is not authenticated
      }

    if (loading) return <p>Loading...</p>; // Prevents flickering
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    }
    const OpenGateOne = async () => {
      try {
        const response = await apiRequest('/open-gate', 'POST', {  gate: "Gate 1",
          request_source: "website"},{ 
          'X-CSRF-TOKEN': getCookie('csrf_access_token') // ✅ Send CSRF token only for logout
      });
        if (response.status === 200) {
          console.log('Gate 1 opened successfully!');
        }
      } catch (err) {
        console.log('Error opening gate:', err);
      }
    };
   
    const generateGuestCode = async () => {
      try {
        const response = await apiRequest('/guest/generate-code', 'POST',null,{
          'X-CSRF-TOKEN': getCookie('csrf_access_token')
        });
        // For example, you can display the code in an alert or update state to show in the UI
        alert(`Guest Code: ${response.data.code}\nValid Until: ${response.data.validUntil}`);
      } catch (error) {
        console.error("Failed to generate guest code", error.response?.data || error);
      }
    };
    
  return (
    <main className="hero-section">
      {activeSection === 'Home' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Welcome, {user.identifier}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Available Slots</h3>
              </div>
              <div className="card-content">
                <div className="text-4xl font-bold">{dashboardData?.parking_data?.available_resident}</div>
                <div className="text-muted-foreground">Total Slots: {dashboardData?.parking_data?.total_general}</div>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Guest Parking</h3>
              </div>
              <div className="card-content">
                <div className="text-4xl font-bold">{dashboardData?.parking_data?.available_guest}</div>
                <div className="text-muted-foreground">Total Guests: {dashboardData?.parking_data?.total_guest}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Open Gate</h3>
              </div>
              <div className="card-content">
                <button className="button bg-blue-500 text-white px-4 py-2 rounded" onClick={OpenGateOne}>Open Gate 1</button>
                <button className="button bg-blue-500 text-white px-4 py-2 rounded mt-2">Open Gate 2</button>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Graphs</h3>
              </div>
              <div className="card-content">
                <LineChart width={400} height={300} data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="slots" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="guests" stroke="#82ca9d" />
                </LineChart>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeSection === 'Guest' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Guest</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Available Slots for Guest</h3>
              </div>
              <div className="card-content">
                <div className="text-4xl font-bold">50</div>
                <div className="text-muted-foreground">Total Slots: 100</div>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Generate Code</h3>
              </div>
              <div className="card-content">
                <button className="button bg-blue-500 text-white px-4 py-2 rounded" onClick={generateGuestCode}>Generate Code</button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Alerts</h3>
              </div>
              <div className="card-content">
                <div className="text-sm text-red-500">No alerts</div>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Next Availability</h3>
              </div>
              <div className="card-content">
                <div className="text-sm">In 30 minutes</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeSection === 'Manage Devices' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Manage Devices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Manage Device 1</h3>
              </div>
              <div className="card-content">
                <button className="button bg-blue-500 text-white px-4 py-2 rounded">Update</button>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Manage Device 2</h3>
              </div>
              <div className="card-content">
                <button className="button bg-blue-500 text-white px-4 py-2 rounded">Update</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeSection === 'Settings' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Show Apt Number</h3>
              </div>
              <div className="card-content">
                <div className="text-sm">Apt {user.identifier}</div>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Change Password</h3>
              </div>
              <div className="card-content">
                <button className="button bg-blue-500 text-white px-4 py-2 rounded">Change Password</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}