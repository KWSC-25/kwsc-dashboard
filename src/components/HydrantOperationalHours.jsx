import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const HydrantOperationalHours = () => {
    const [hydrants, setHydrants] = useState([]);
    const [hasEntries, setHasEntries] = useState(true);
    const [currentTime, setCurrentTime] = useState('');

    const fetchStatus = async () => {
        try {
            const res = await api.get('/hydrants/operational-status');
            setHydrants(res.data.data);
            setHasEntries(res.data.hasEntriesToday);
            if (res.data.data.length > 0) {
                setCurrentTime(res.data.data[0].displayTimeSlot);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    if (!hasEntries) return (
        <div className="hmp-no-entries-wrapper">
            <div className="hmp-no-entries-content"><p>NO ENTRIES FOR TODAY</p></div>
        </div>
    );

    return (
        <div className="hmp-status-container">
            <div className="hmp-status-header-row">
                <span className="hmp-status-label">HYDRANT NAME</span>
                <span className="hmp-status-time">Current Time Slot: {currentTime}</span>
            </div>

            {/* Grid container for 2 columns */}
            <div className="hmp-status-grid">
                {hydrants.map(h => (
                    <div key={h.id} className="hmp-status-row">
                        <div className="hmp-name-box">
                            <div className="name-stack">
                                {/* Hydrant Name in All Caps */}
                                <span className="hmp-name-text">{h.name.toUpperCase()}</span>
                                {h.currentStatus === 'FILLING_START' && h.displayStartTime && (
                                    <span className="filling-time-text">STARTED AT {h.displayStartTime}</span>
                                )}
                                {h.currentStatus === 'CCTV_OFF' && h.displayCctvOffSince && (
                                    <span className="cctv-off-since-text">OFF SINCE {h.displayCctvOffSince}</span>
                                )}
                                {h.currentStatus === 'UNKNOWN' && h.customAlert && (
                                    <span className="no-entry-alert">{h.customAlert}</span>
                                )}
                            </div>
                        </div>
                        
                        <div className={`compact-badge ${h.currentStatus === 'ACTIVE' ? 'FILLING_START' : h.currentStatus}`}>
                            {(h.currentStatus === 'FILLING_START' || h.currentStatus === 'ACTIVE') && 'ACTIVE'}
                            {h.currentStatus === 'FILLING_STOP' && 'INACTIVE'}
                            {h.currentStatus === 'CCTV_OFF' && 'CCTV OFF'}
                            {h.currentStatus === 'UNKNOWN' && 'UNKNOWN'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HydrantOperationalHours;