import React, { useState } from 'react';
import '../../styles/Guest.css';
import { apiRequest } from '../../utils/api';
import GuestSetPassword from "./GuestSetPassword";


export default function GuestParkingRegistration() {
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    aptNumber: '',
    code: '',
    startTime: '',
    endTime: '',
    contactInfo: '',
  });

  const [errors, setErrors] = useState([]);
  const [confirmation, setConfirmation] = useState('');
  const [guestID, setGuestID] = useState('');

  const validateForm = () => {
    const newErrors = [];

    if (!formData.firstName) newErrors.push('First Name is required');
    if (!formData.lastName) newErrors.push('Last Name is required');
    if (!formData.aptNumber) newErrors.push('Apt Number is required');
    if (!formData.code) newErrors.push('Code is required');
    if (!formData.startTime) newErrors.push('Start Time is required');
    if (!formData.endTime) newErrors.push('End Time is required');
    if (!formData.contactInfo) newErrors.push('Contact Info is required');

    if (formData.startTime && formData.endTime && new Date(formData.startTime) >= new Date(formData.endTime)) {
      newErrors.push('End Time must be after Start Time');
    }

    if (formData.aptNumber !== '###' && !/^\d+$/.test(formData.aptNumber)) {
      newErrors.push('Apt Number must be a valid number or "###" for management');
    }

    return newErrors;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setConfirmation('');
    } else {
      setErrors([]);
      setConfirmation('Registration successful!');
      sendGuestData();
      setFormData({
        firstName: '',
        lastName: '',
        aptNumber: '',
        code: '',
        startTime: '',
        endTime: '',
        contactInfo: '',
      });
    }
  };

  const sendGuestData = async() => {
    const response = await apiRequest('/guest/register','POST', {formData});
    if(response.status === 200){
      console.log('api register success');
      console.log(response.data.guestIdentifier);
      setGuestID(response.data.guestIdentifier);
    }
    else{
      console.error(response.data.error);
    }
  }

  return (
    <div>
      {/* If guestID is null, show registration form. Once guestID exists, show GuestSetPassword */}
      {guestID ? (
        <GuestSetPassword guestID={guestID} />
      ) : ( <>
    <div className="guest-parking-registration">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Register Guest Parking</h2>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="aptNumber">Apt Number</label>
              <input
                id="aptNumber"
                value={formData.aptNumber}
                onChange={(e) => setFormData({ ...formData, aptNumber: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="code">Code</label>
              <input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input
                id="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="contactInfo">Phone Number/Email</label>
              <input
                id="contactInfo"
                value={formData.contactInfo}
                onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
              />
            </div>
            <button type="submit">Submit</button>
            {errors.length > 0 && (
              <div className="error-messages">
                {errors.map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}
            {confirmation && <div className="confirmation-message">{confirmation}</div>}
          </form>
          <div className="card-description">
            <ul className="instructions">
              <li>Guest parking is available from 8 AM to 6 PM.</li>
              <li>Please ensure your vehicle is parked in designated guest spots.</li>
              <li>For management access, enter "###" in the Apt Number field.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
     </>
    )}
  </div>
  );
}