import React from 'react';

const HmpHeader = ({ children }) => {
    return (
        <header className="hmp-header-main">
            <div className="title-group">
                <h1>Hydrant <span><small style={{ fontWeight: 700, color: '#8493a5', fontSize: '1.3rem' }}>MANAGEMENT DASHBOARD</small></span></h1>
            </div>
            
            <div className="header-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="system-switcher-container">
                    {children}
                </div>
              
            </div>


        </header>
    );
};

export default HmpHeader;