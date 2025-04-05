import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../../utils/api';
import '../../../styles/Dashboard/HeroSectionAdmin.css';

function ManageUsersSection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [originalUser, setOriginalUser] = useState(null);
  const [userList, setUserList] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [newSlotType, setNewSlotType] = useState('general'); // Used for filtering available slots
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch users (Admin/Management view)
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await apiRequest('/dashboard-admin-all-users', 'GET');
        setUserList(response.data.users);
      } catch (err) {
        setError('Failed to fetch users.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Fetch available parking slots
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      try {
        const response = await apiRequest('/available-parking', 'GET');
        // Expect availableSlots as array of objects: { spaceNumber, section }
        setAvailableSlots(response.data.slots);
      } catch (err) {
        setError('Failed to fetch parking slots.');
      }
    };
    fetchAvailableSlots();
  }, []);

  // Search & Select User
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setSelectedUser(null);
    setOriginalUser(null);
    setShowAddOptions(false);
    setShowDeleteOptions(false);
  };

  const handleSelectUser = async (aptNumber) => {
    try {
      const response = await apiRequest(`/user/${aptNumber}`, 'GET');
      const userData = response.data.user;
      // Ensure parkingSpaces is an array; our backend returns key "parking"
      userData.parkingSpaces = userData.parking || [];
      setSelectedUser(userData);
      setOriginalUser(JSON.parse(JSON.stringify(userData)));
    } catch (err) {
      setError('User not found.');
    }
    setSearchTerm('');
  };

  // Local update: Change user status
  const onStatusChange = (newStatus) => {
    setSelectedUser(prev => ({ ...prev, status: newStatus }));
  };

  // Local update: Change global parking type (if needed)
  const onParkingTypeChange = (newType) => {
    setSelectedUser(prev => ({ ...prev, type: newType }));
  };

  // Local update: Update a specific parking space type
  const updateParkingSpaceType = (slot, newType) => {
    setSelectedUser(prev => ({
      ...prev,
      parkingSpaces: prev.parkingSpaces.map(ps =>
        ps.spaceNumber === slot ? { ...ps, type: newType, section: newType } : ps
      )
    }));
  };

  // Locally add a parking space (for new assignment)
  const addParkingSpaceLocally = (slot) => {
    const newParking = { spaceNumber: slot, section: newSlotType, isOccupied: true, type: newSlotType };
    setSelectedUser(prev => ({
      ...prev,
      parkingSpaces: [...prev.parkingSpaces, newParking]
    }));
    setAvailableSlots(prev => prev.filter(s => s.spaceNumber !== slot));
    setShowAddOptions(false);
  };

  // Locally remove a parking space
  const removeParkingSpaceLocally = (slot) => {
    setSelectedUser(prev => ({
      ...prev,
      parkingSpaces: prev.parkingSpaces.filter(ps => ps.spaceNumber !== slot)
    }));
    setAvailableSlots(prev => [...prev, { spaceNumber: slot, section: newSlotType }]);
    setShowDeleteOptions(false);
  };

  // Save changes: Batch update modifications to the backend
  const saveChanges = async () => {
    try {
      // Update status if changed
      if (selectedUser.status !== originalUser.status) {
        await apiRequest(`/update-status/${selectedUser.id}`, 'POST', { status: selectedUser.status });
      }
      // Update global parking type if changed (if applicable)
      if (selectedUser.type && selectedUser.type !== originalUser.type) {
        await apiRequest(`/update-parking-type/${selectedUser.id}`, 'POST', { type: selectedUser.type });
      }
      // Update parking assignments: Here we assume an endpoint exists to update assignments in bulk.
      // If not, you could call assign or remove endpoints individually.
      await apiRequest(`/update-resident-assignments/${selectedUser.id}`, 'POST', { parkingSpaces: selectedUser.parkingSpaces });
      setOriginalUser(JSON.parse(JSON.stringify(selectedUser)));
      alert("Changes saved successfully!");
    } catch (err) {
      setError('Failed to save changes.');
    }
  };

  // Filter available slots by the selected newSlotType
  const filteredAvailableSlots = availableSlots.filter(slot => slot.section === newSlotType);

  const statusOptions = ['active', 'pending', 'suspended'];
  const parkingTypeOptions = ['general', 'motor cycle', 'handicapped', 'guest'];

  return (
    <div className="section">
      {loading && <p>Loading...</p>}
      {error && <p className="alert">{error}</p>}

      {/* Search Bar */}
      <div className="input-group">
        <label htmlFor="apt-search">Search by Apt Number:</label>
        <input
          id="apt-search"
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Enter apt number"
        />
      </div>

      {/* Dropdown for Search Results */}
      {searchTerm && (
        <div className="dropdown">
          <ul>
            {userList
              .filter(user => String(user.aptNumber).includes(searchTerm))
              .map(user => (
                <li key={user.id} onClick={() => handleSelectUser(user.aptNumber)}>
                  {user.aptNumber} - {user.status}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Display User Details */}
      {selectedUser && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">User Details</h3>
          </div>
          <div className="card-content">
            <p><strong>Apt Number:</strong> {selectedUser.aptNumber}</p>
            <p>
              <strong>Status:</strong>
              <select
                value={selectedUser.status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="small-dropdown"
              >
                {statusOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </p>
           

            {/* Assigned Parking Spaces */}
            <div>
              <strong>Assigned Parking Spaces:</strong>
              {selectedUser.parkingSpaces.length > 0 ? (
                selectedUser.parkingSpaces.map(ps => (
                  <div key={ps.spaceNumber} className="parking-space-row">
                    <span>{ps.spaceNumber} ({ps.section})</span>
                    <select
                      value={ps.type}
                      onChange={(e) => updateParkingSpaceType(ps.spaceNumber, e.target.value)}
                      className="small-dropdown"
                    >
                      {parkingTypeOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <button className="small-button delete" onClick={() => removeParkingSpaceLocally(ps.spaceNumber)}>Delete</button>
                  </div>
                ))
              ) : (
                <p>None</p>
              )}
              <button className="small-button" onClick={() => setShowAddOptions(!showAddOptions)}>Add Parking Space</button>
            </div>

            {/* Render Add Options */}
            {showAddOptions && (
              <div className="change-box">
                <h4>Select Parking Type for New Space:</h4>
                <select value={newSlotType} onChange={(e) => setNewSlotType(e.target.value)} className="small-dropdown">
                  {parkingTypeOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <div>
                  {filteredAvailableSlots.length > 0 ? (
                    filteredAvailableSlots.map(slot => (
                      <button key={slot.spaceNumber} className="small-button" onClick={() => addParkingSpaceLocally(slot.spaceNumber)}>
                        {slot.spaceNumber}
                      </button>
                    ))
                  ) : (
                    <p>No available slots for type {newSlotType}.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="card-footer">
            <button className="icon-button" onClick={saveChanges}>Save Changes</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsersSection;
