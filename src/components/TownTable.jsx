import React, { useState, useEffect, useMemo } from 'react';

const TownTable = ({ waterData, sewData }) => {
    const [page, setPage] = useState(0); // 0,1 = Water | 2,3 = Sewerage
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Determine current mode and data
    const isWater = page < 2;
    const activeData = isWater ? waterData : sewData;
    const displayTitle = isWater ? "TOWN-WISE DISTRIBUTION (WATER)" : "TOWN-WISE DISTRIBUTION (SEWERAGE)";
    
    // Slice for pagination (Desktop: 14 per page | Mobile: Show all for swiping)
    const itemsPerPage = 14;
    const currentData = isMobile ? activeData : activeData.slice((page % 2) * itemsPerPage, ((page % 2) + 1) * itemsPerPage);

    const top3CriticalTowns = useMemo(() => {
        if (!activeData) return [];
        return [...activeData]
            .map(t => ({ id: t.town_name, rate: t.total_registered > 0 ? (t.pending / t.total_registered) : 0 }))
            .sort((a, b) => b.rate - a.rate).slice(0, 3).map(t => t.id);
    }, [activeData]);

    useEffect(() => {
        if (isMobile) return;
        const interval = setInterval(() => {
            setPage((prev) => (prev + 1) % 4); // Cycles 0 -> 1 -> 2 -> 3 -> 0
        }, 15000);
        return () => clearInterval(interval);
    }, [isMobile]);

    if (!waterData || !sewData) return null;

    const formatName = (name) => name.replace(/town/gi, '').trim();

    return (
        <div className={`town-table-panel ${isMobile ? 'mobile-mode' : ''}`}>
            <h2 className="town-header-compact">
                <span style={{ color: isWater ? '#38bdf8' : '#a78bfa' }}>{displayTitle}</span>
                {!isMobile && <span className="page-indicator">SECTION {page + 1}/4</span>}
                {isMobile && <span className="page-indicator">SWIPE ↔</span>}
            </h2>
            <div className="town-table-wrapper">
                <table className="town-dynamic-table">
                    <thead>
                        <tr>
                            <th className="sticky-col">METRIC</th>
                            {currentData.map((item, index) => (
                                <th key={index} className={`town-name ${top3CriticalTowns.includes(item.town_name) ? 'critical-blink' : ''}`}>
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
        </div>
    );
};

export default TownTable;