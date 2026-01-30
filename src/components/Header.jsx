import React from 'react';
import IntelCards from './IntelCards';

const Header = () => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '-15px' }}>
    <div>
      <h1 style={{ margin: 0, letterSpacing: '-1px', color: '#fff' }}>
        KW&SC <span style={{ color: 'var(--water-blue)' }}>CEO DASHBOARD</span>
      </h1>
      <p style={{ margin: 0, color: 'var(--text-dim)', fontWeight: 500 }}>Real-Time Complaint Monitoring System</p>
    </div>
    
    {/* Live Intel Section */}
    <IntelCards />
  </div>
);

export default Header;