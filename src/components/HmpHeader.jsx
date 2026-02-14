
const HmpHeader = ({ children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div>
        <h1 style={{ margin: 0, letterSpacing: '-1px', color: '#fff' }}>
          KW&SC <span style={{ color: 'var(--water-blue)' }}>HYDRANT DASHBOARD</span>
        </h1>
        <p style={{ margin: 0, color: 'var(--text-dim)', fontWeight: 500 }}>Hydrant Management & Monitoring System</p>
      </div>
      
      {/* Dropdown container - positioned exactly like the complaint one */}
      <div style={{ marginTop: '-15px' }}>
        {children}
      </div>
    </div>
  </div>
);

export default HmpHeader;