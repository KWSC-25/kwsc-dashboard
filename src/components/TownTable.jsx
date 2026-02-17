import React, { useState, useEffect, useMemo } from 'react';

import api from '../utils/api';
const TownTable = ({ waterData, sewData }) => {
    const [page, setPage] = useState(0); 
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    
    // Modal State
    const [selectedTown, setSelectedTown] = useState(null);
    const [townDetails, setTownDetails] = useState([]);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isWater = page < 2;
    const activeData = isWater ? waterData : sewData;
    const currentTypeId = isWater ? 2 : 1;
    const displayTitle = isWater ? "TOWN-WISE DISTRIBUTION (WATER)" : "TOWN-WISE DISTRIBUTION (SEWERAGE)";
    
    const itemsPerPage = 14;
    const currentData = useMemo(() => {
        if (!activeData) return [];
        return isMobile ? activeData : activeData.slice((page % 2) * itemsPerPage, ((page % 2) + 1) * itemsPerPage);
    }, [activeData, page, isMobile]);

    const top3CriticalTowns = useMemo(() => {
        if (!activeData) return [];
        return [...activeData]
            .map(t => ({ id: t.town_name, rate: t.total_registered > 0 ? (t.pending / t.total_registered) : 0 }))
            .sort((a, b) => b.rate - a.rate).slice(0, 3).map(t => t.id);
    }, [activeData]);

    const handleTownClick = async (town) => {
        console.log("Fetching details for Town ID:", town.town_id, "Type ID:", currentTypeId);
        setSelectedTown(town);
        setLoadingDetail(true);
        try {
            const res = await api.get(`/towns/town-details`, {
                params: { townId: town.town_id, typeId: currentTypeId }
            });
            setTownDetails(res.data);
        } catch (err) {
            console.error("Error fetching breakdown", err);
        } finally {
            setLoadingDetail(false);
        }
    };

    useEffect(() => {
            if (selectedTown) return; // Freeze auto-slide if popup is open

            const interval = setInterval(() => {
                setPage((prev) => {
                    if (isMobile) {
                        // On mobile: Toggle only between Water (0) and Sewerage (2)
                        return prev < 2 ? 2 : 0;
                    } else {
                        // On laptop: Cycle through all 4 sections (0, 1, 2, 3)
                        return (prev + 1) % 4;
                    }
                });
            }, 15000);

            return () => clearInterval(interval);
        }, [isMobile, selectedTown]);

    if (!waterData || !sewData) return null;

    const formatName = (name) => name.replace(/town/gi, '').trim();

    return (
        <div className={`town-table-panel ${isMobile ? 'mobile-mode' : ''}`}>
            <h2 className="town-header-compact">
                <span style={{ color: isWater ? '#38bdf8' : '#a78bfa' }}>{displayTitle}</span>
                {!isMobile && <span className="page-indicator">SECTION {page + 1}/4</span>}
            </h2>

            <div className="town-table-wrapper">
                <table className="town-dynamic-table">
                    <thead>
                        <tr>
                            <th className="sticky-col">METRIC</th>
                            {currentData.map((item, index) => (
                                <th key={index} 
                                    className={`town-name clickable-cell ${top3CriticalTowns.includes(item.town_name) ? 'critical-blink' : ''}`}
                                    onClick={() => handleTownClick(item)}>
                                    {formatName(item.town_name)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="sticky-col label-reg">REG</td>
                            {currentData.map((item, index) => <td key={index} className="label-reg">{item.total_registered}</td>)}
                        </tr>
                        <tr>
                            <td className="sticky-col label-res">RES</td>
                            {currentData.map((item, index) => <td key={index} className="text-green">{item.resolved}</td>)}
                        </tr>
                        <tr>
                            <td className="sticky-col label-pen">PEN</td>
                            {currentData.map((item, index) => <td key={index} className="text-red">{item.pending}</td>)}
                        </tr>
                        <tr>
                            <td className="sticky-col label-wip">WIP</td>
                            {currentData.map((item, index) => <td key={index} className="text-yellow">{item.wip}</td>)}
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* DETAIL POPUP MODAL */}
            {/* DETAIL POPUP MODAL */}
            {selectedTown && (
                <div className="modal-overlay" onClick={() => setSelectedTown(null)}>
                    <div className="modal-content animate-pop-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ color: isWater ? '#38bdf8' : '#a78bfa', margin: 0 }}>
                                    {selectedTown.town_name}
                                </h3>
                                <small style={{ color: '#94a3b8' }}>SUB-TYPE BREAKDOWN ({isWater ? 'WATER' : 'SEWERAGE'})</small>
                            </div>
                            <button className="close-btn" onClick={() => setSelectedTown(null)}>&times;</button>
                        </div>
                        
                        <div className="modal-body">
                            {loadingDetail ? (
                                <div className="loader-text">Loading Details...</div>
                            ) : (
                                <table className="popup-detail-table">
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left' }}>COMPLAINT SUB-TYPE</th>
                                            <th>REG</th>
                                            <th>RES</th>
                                            <th>PEN</th>
                                            <th>WIP</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {townDetails.map((row, i) => (
                                            <tr key={i}>
                                                <td style={{ textAlign: 'left', fontWeight: '500' }}>{row.subtype_name}</td>
                                                <td style={{ color: '#fff' }}>{row.reg}</td>
                                                <td className="text-green">{row.res}</td>
                                                <td className="text-red">{row.pen}</td>
                                                <td className="text-yellow">{row.wip}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {/* ADDING THE TOTAL FOOTER HERE */}
                                    <tfoot style={{ borderTop: '2px solid #334155', backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
                                        <tr style={{ fontWeight: 'bold' }}>
                                            <td style={{ textAlign: 'left', color: '#f8fafc' }}>TOTAL</td>
                                            <td style={{ color: '#38bdf8' }}>{selectedTown.total_registered}</td>
                                            <td className="text-green">{selectedTown.resolved}</td>
                                            <td className="text-red">{selectedTown.pending}</td>
                                            <td className="text-yellow">{selectedTown.wip}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TownTable;