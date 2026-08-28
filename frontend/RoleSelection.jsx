// frontend/src/RoleSelection.jsx
import React from 'react';

export default function RoleSelection({ onSelectRole }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>CharityChain Portal</h1>
      <p>Select how you want to enter the platform:</p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
        {/* Donor */}
        <div style={cardStyle}>
          <h2>💙 Donor</h2>
          <p>Sign in to view campaigns. Enter your ETH address manually when ready to donate.</p>
          <button style={btnStyle} onClick={() => onSelectRole('donor')}>Enter as Donor</button>
        </div>

        {/* Charity */}
        <div style={cardStyle}>
          <h2>🏛️ Charity</h2>
          <p>Register a new NGO or sign in to manage your active campaigns.</p>
          <button style={btnStyle} onClick={() => onSelectRole('charity')}>Enter as Charity</button>
        </div>

        {/* Admin */}
        <div style={cardStyle}>
          <h2>⚡ Admin</h2>
          <p>System control panel. Requires administrative password access.</p>
          <button style={btnStyle} onClick={() => onSelectRole('admin')}>Enter as Admin</button>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '20px',
  width: '260px',
  boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
};

const btnStyle = {
  marginTop: '15px',
  padding: '10px 18px',
  backgroundColor: '#0070f3',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 'bold'
};