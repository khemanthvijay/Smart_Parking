import React, { useState } from 'react';
import '../../styles/Dashboard/HeroSectionAdmin.css';
import ManageUsersSection from './Admin/ManageUsers';


export default function HeroSection({ activeSection }) {
  return (
    <div className="hero-section">
      {activeSection === 'Home' && <HomeSection />}
      {activeSection === 'Guest' && <GuestSection />}
      {activeSection === 'Manage Devices' && <ManageDevicesSection />}  
      {activeSection === 'Settings' && <SettingsSection />}
      {activeSection === 'Manage Users' && <ManageUsersSection />}
    </div>
  );
}

function HomeSection() {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Welcome to the Admin Dashboard</h2>
        <p className="card-description">Manage your guests, devices, and settings from here.</p>
      </div>
      <div className="card-content">
        <p>Here you can see an overview of your current activities and manage your resources efficiently.</p>
      </div>
    </div>
  );
}

function GuestSection() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="section">
      <div className="input-group">
        <label htmlFor="guest-search">Search Guests:</label>
        <input id="guest-search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      <div className="button-group">
        <button>Manage Active Guests</button>
        <button>Manage Bookings</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Current Slots</h3>
          </div>
          <div className="card-content">
            <p>Slot 1</p>
            <p>Slot 2</p>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Next Available Slots</h3>
          </div>
          <div className="card-content">
            <p>Slot 3</p>
            <p>Slot 4</p>
          </div>
        </div>
      </div>
      <div className="input-group">
        <label htmlFor="guest-status">Change Guest Status:</label>
        <select id="guest-status">
          <option value="">Select status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      <div className="alert">
        <p className="alert-text">Alert: Important notification here!</p>
      </div>
    </div>
  );
}

function ManageDevicesSection() {
  const devices = [
    { id: 1, name: 'Device 1' },
    { id: 2, name: 'Device 2' },
    { id: 3, name: 'Device 3' },
  ];

  return (
    <div className="section">
      <div className="input-group">
        <label htmlFor="user-select">Select User:</label>
        <select id="user-select">
          <option value="">Select user</option>
          <option value="user1">User 1</option>
          <option value="user2">User 2</option>
          <option value="user3">User 3</option>
        </select>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {devices.map((device) => (
          <div key={device.id} className="card">
            <div className="card-header">
              <h3 className="card-title">{device.name}</h3>
            </div>
            <div className="card-content">
              <div className="flex justify-between items-center">
                <p>Details about {device.name}</p>
                <button className="icon-button">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function SettingsSection() {
  return (
    <div className="section">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">User Settings</h2>
        </div>
        <div className="card-content">
          <div className="input-group">
            <label htmlFor="user-name">User Name:</label>
            <input id="user-name" defaultValue="Admin" />
          </div>
          <div className="input-group">
            <label htmlFor="user-email">Email:</label>
            <input id="user-email" defaultValue="admin@example.com" />
          </div>
          <div className="input-group">
            <label htmlFor="user-password">Password:</label>
            <input id="user-password" type="password" defaultValue="password" />
          </div>
        </div>
        <div className="card-footer">
          <button>Save Changes</button>
        </div>
      </div>
    </div>
  );}  
  // 🔹 Manage Users Section

  
  // function ManageUsersSection() {
  //   const [searchTerm, setSearchTerm] = useState('');
  //   const [selectedUser, setSelectedUser] = useState(null);
  //   const [availableSlots, setAvailableSlots] = useState([103, 104, 105, 106]); // Mock available slots
  //   const [showAddOptions, setShowAddOptions] = useState(false);
  //   const [showDeleteOptions, setShowDeleteOptions] = useState(false);
    
  //   const [userList, setUserList] = useState([
  //     { id: 1, aptNumber: '101', name: 'John Doe', status: 'active', parkingSpaces: [101, 102], type: 'general' },
  //     { id: 2, aptNumber: '102', name: 'Jane Smith', status: 'inactive', parkingSpaces: [], type: 'guest' },
  //     { id: 3, aptNumber: '103', name: 'Alice Brown', status: 'pending', parkingSpaces: [201], type: 'handicapped' },
  //   ]);
  
  //   // 🔹 Handle Search
  //   const handleSearchChange = (e) => {
  //     setSearchTerm(e.target.value);
  //     setSelectedUser(null);
  //     setShowAddOptions(false);
  //     setShowDeleteOptions(false);
  //   };
  
  //   // 🔹 Select Apt and Show User Details
  //   const handleSelectUser = (aptNumber) => {
  //     const user = userList.find(user => user.aptNumber === aptNumber);
  //     if (user) {
  //       setSelectedUser(user);
  //     }
  //     setSearchTerm('');
  //   };
  
  //   // 🔹 Add Parking Space
  //   const addParkingSpace = (slot) => {
  //     setSelectedUser(prev => ({
  //       ...prev,
  //       parkingSpaces: [...prev.parkingSpaces, slot],
  //     }));
  //     setAvailableSlots(prev => prev.filter(s => s !== slot)); // Remove from available slots
  //     setShowAddOptions(false);
  //   };
  
  //   // 🔹 Delete Parking Space
  //   const deleteParkingSpace = (slot) => {
  //     setSelectedUser(prev => ({
  //       ...prev,
  //       parkingSpaces: prev.parkingSpaces.filter(s => s !== slot),
  //     }));
  //     setAvailableSlots(prev => [...prev, slot]); // Add back to available slots
  //     setShowDeleteOptions(false);
  //   };
  
  //   // 🔹 Change Parking Status
  //   const changeStatus = (status) => {
  //     setSelectedUser({ ...selectedUser, status });
  //   };
  
  //   // 🔹 Change Parking Type
  //   const changeParkingType = (type) => {
  //     setSelectedUser({ ...selectedUser, type });
  //   };
  
  //   // 🔹 Delete User
  //   const deleteUser = () => {
  //     setUserList(userList.filter(user => user.id !== selectedUser.id));
  //     setSelectedUser(null);
  //   };
  
  //   // 🔹 Save Changes (Mock Function)
  //   const saveChanges = () => {
  //     console.log('Saved changes:', selectedUser);
  //   };
  
  //   return (
  //     <div className="section">
  //       {/* 🔹 Search Bar */}
  //       <div className="input-group">
  //         <label htmlFor="apt-search">Search by Apt Number:</label>
  //         <input
  //           id="apt-search"
  //           type="text"
  //           value={searchTerm}
  //           onChange={handleSearchChange}
  //           placeholder="Enter apt number"
  //         />
  //       </div>
  
  //       {/* 🔹 Dropdown for Search Results */}
  //       {searchTerm && (
  //         <div className="dropdown">
  //           <ul>
  //             {userList
  //               .filter(user => user.aptNumber.includes(searchTerm))
  //               .map(user => (
  //                 <li key={user.id} onClick={() => handleSelectUser(user.aptNumber)}>
  //                   {user.aptNumber} - {user.name}
  //                 </li>
  //               ))}
  //           </ul>
  //         </div>
  //       )}
  
  //       {/* 🔹 Display User Details */}
  //       {selectedUser && (
  //         <div className="card">
  //           <div className="card-header">
  //             <h3 className="card-title">User Details</h3>
  //           </div>
  //           <div className="card-content">
  //             <p><strong>Apt Number:</strong> {selectedUser.aptNumber}</p>
  //             <p><strong>Name:</strong> {selectedUser.name}</p>
  //             <p><strong>Status:</strong> {selectedUser.status}
  //               <button className="small-button" onClick={() => changeStatus(selectedUser.status === 'active' ? 'inactive' : 'active')}>Change</button>
  //             </p>
  //             <p><strong>Parking Type:</strong> {selectedUser.type}
  //               <button className="small-button" onClick={() => changeParkingType(selectedUser.type === 'general' ? 'guest' : 'general')}>Change</button>
  //             </p>
              
  //             {/* 🔹 Parking Spaces with Small Buttons */}
  //             <p><strong>Assigned Parking Spaces:</strong> 
  //               {selectedUser.parkingSpaces.length > 0 ? (
  //                 selectedUser.parkingSpaces.join(', ')
  //               ) : (
  //                 <span> None</span>
  //               )}
  //               <button className="small-button" onClick={() => setShowAddOptions(!showAddOptions)}>+</button>
  //               <button className="small-button delete" onClick={() => setShowDeleteOptions(!showDeleteOptions)}>-</button>
  //             </p>
  //           </div>
  
  //           {/* 🔹 Add Parking Space */}
  //           {showAddOptions && (
  //             <div className="change-box">
  //               <h4>Select a parking space to add:</h4>
  //               {availableSlots.length > 0 ? (
  //                 availableSlots.map(slot => (
  //                   <button key={slot} className="small-button" onClick={() => addParkingSpace(slot)}>
  //                     {slot}
  //                   </button>
  //                 ))
  //               ) : (
  //                 <p>No available slots.</p>
  //               )}
  //             </div>
  //           )}
  
  //           {/* 🔹 Delete Parking Space */}
  //           {showDeleteOptions && (
  //             <div className="change-box">
  //               <h4>Select a parking space to remove:</h4>
  //               {selectedUser.parkingSpaces.length > 0 ? (
  //                 selectedUser.parkingSpaces.map(slot => (
  //                   <button key={slot} className="small-button delete" onClick={() => deleteParkingSpace(slot)}>
  //                     {slot}
  //                   </button>
  //                 ))
  //               ) : (
  //                 <p>No assigned parking spaces.</p>
  //               )}
  //             </div>
  //           )}
  
  //           {/* 🔹 Delete User & Save Changes */}
  //           <div className="card-footer">
  //             <button className="icon-button delete" onClick={deleteUser}>Delete User</button>
  //             <button className="icon-button" onClick={saveChanges}>Save</button>
  //           </div>
  //         </div>
  //       )}
  //     </div>
  //   );
  // }