import React, { useState, useEffect, useMemo } from 'react';

const TownTable = ({ data }) => {
    const [page, setPage] = useState(0);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Track window resize to toggle between scroll (mobile) and paginate (desktop)
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const top3CriticalTowns = useMemo(() => {
        if (!data) return [];
        return [...data]
            .map(t => ({
                id: t.town_name,
                rate: t.total_registered > 0 ? (t.pending / t.total_registered) : 0
            }))
            .sort((a, b) => b.rate - a.rate)
            .slice(0, 3)
            .map(t => t.id);
    }, [data]);

    useEffect(() => {
        // Only auto-paginate on Desktop
        if (!data || data.length <= 14 || isMobile) return;
        const interval = setInterval(() => {
            setPage((prev) => (prev === 0 ? 1 : 0));
        }, 5000);
        return () => clearInterval(interval);
    }, [data, isMobile]);

    if (!data || data.length === 0) return null;

    // Logic: If mobile, show all for scrolling. If desktop, slice for pagination.
    const itemsPerPage = 14;
    const currentData = isMobile ? data : data.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

    const formatName = (name) => name.replace(/town/gi, '').trim();

    return (
        <div className={`town-table-panel ${isMobile ? 'mobile-mode' : ''}`}>
            <h2 className="town-header-compact">
                TOWN-WISE DISTRIBUTION (OVERALL)
                {!isMobile && <span className="page-indicator">PAGE {page + 1}/2</span>}
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