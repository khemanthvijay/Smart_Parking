import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import '../../styles/Guest.css';

export default function GuestDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');

  // Fetch dashboard data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiRequest('/guest/dashboard', 'GET');
      setDashboardData(response.data);
    } catch (err) {
      setError('Failed to fetch dashboard data.');
    }
  };

  // Cancel booking
  const cancelBooking = async (bookingId) => {
    try {
      await apiRequest(`/guest/bookings/${bookingId}`, 'DELETE');
      fetchDashboardData();
    } catch (err) {
      setError('Failed to cancel booking.');
    }
  };

  // Change booking time (open prompt for demonstration)
  const changeBookingTime = async (bookingId, currentStart, currentEnd) => {
    const newStart = prompt("Enter new start time (YYYY-MM-DDTHH:MM):", currentStart);
    const newEnd = prompt("Enter new end time (YYYY-MM-DDTHH:MM):", currentEnd);
    if (newStart && newEnd) {
      try {
        await apiRequest(`/guest/bookings/${bookingId}`, 'PUT', { startTime: newStart, endTime: newEnd });
        fetchDashboardData();
      } catch (err) {
        setError('Failed to update booking.');
      }
    }
  };

  // Change guest password: navigate to a separate component/page
  const handleChangePassword = () => {
    // For example, navigate to "/guest/change-password" (using react-router)
    window.location.href = "/guest/change-password";
  };

  // Delete guest account
  const deleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        await apiRequest('/guest/delete-account', 'DELETE');
        // After deletion, redirect to guest home or login
        window.location.href = "/guest/login";
      } catch (err) {
        setError('Failed to delete account.');
      }
    }
  };

  // Open gate option: enable only within allowed schedule (stubbed logic)
  const openGate = async () => {
    // Implement scheduling logic as needed.
    try {
      const response = await apiRequest('/open-gate', 'POST', { gate: "Gate 1" });
      alert(response.data.message);
    } catch (err) {
      setError('Failed to open gate.');
    }
  };

  if (!dashboardData) return <p>Loading dashboard...</p>;

  const { guestInfo, bookings, nextAvailability, hourlyPrediction } = dashboardData;

  return (
    <div className="guest-dashboard">
      <h2>Welcome, {guestInfo.firstName || guestInfo.guestIdentifier}!</h2>
      <p>Your Guest ID: {guestInfo.guestIdentifier}</p>
      <button className="button" onClick={handleChangePassword}>Change Password</button>
      <button className="button" onClick={openGate}>Open Gate</button>
      <button className="button" onClick={deleteAccount}>Delete Account</button>

      <div className="dashboard-info">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Next Availability</h3>
          </div>
          <div className="card-content">
            <p>{nextAvailability}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Hourly Prediction</h3>
          </div>
          <div className="card-content">
            <p>{hourlyPrediction}</p>
          </div>
        </div>
      </div>

      <div className="bookings-section">
        <h3>Active Guest Bookings</h3>
        {bookings.length > 0 ? (
          bookings.map(booking => (
            <div key={booking.id} className="booking-row">
              <p>
                <strong>{booking.firstName} {booking.lastName}</strong> (<em>Apt: {booking.aptNumber}</em>)
              </p>
              <p>
                Booking Time: {new Date(booking.startTime).toLocaleString()} - {new Date(booking.endTime).toLocaleString()}
              </p>
              <p>Contact: {booking.contactInfo}</p>
              <p>Reference Code: {booking.code}</p>
              <div className="booking-actions">
                <button className="icon-button delete" onClick={() => cancelBooking(booking.id)}>Cancel</button>
                <button className="icon-button" onClick={() => changeBookingTime(booking.id, booking.startTime, booking.endTime)}>Change Time</button>
              </div>
            </div>
          ))
        ) : (
          <p>No active bookings.</p>
        )}
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

