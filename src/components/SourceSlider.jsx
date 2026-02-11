import React, { useState, useEffect } from 'react';

const SourceSlider = ({ data }) => {
    const [typeIndex, setTypeIndex] = useState(0);
    const [subOffset, setSubOffset] = useState(0);

    const sourceData = data?.[0] || { sourceName: 'COK', types: [] };
    const activeTypes = sourceData.types.filter(t => t.reg > 0);

    const globalTotals = activeTypes.reduce((acc, t) => {
        acc.reg += t.reg;
        acc.res += t.res;
        acc.pen += t.pen;
        acc.wip += t.wip;
        return acc;
    }, { reg: 0, res: 0, pen: 0, wip: 0 });

    useEffect(() => {
        if (activeTypes.length <= 2) return;
        const mainTimer = setInterval(() => {
            setTypeIndex(prev => (prev + 2 >= activeTypes.length ? 0 : prev + 2));
            setSubOffset(0);
        }, 10000);
        return () => clearInterval(mainTimer);
    }, [activeTypes.length]);

    useEffect(() => {
        const subTimer = setInterval(() => {
            setSubOffset(prev => prev + 7);
        }, 10000);
        return () => clearInterval(subTimer);
    }, [typeIndex]);

    const renderTypeSection = (type) => {
        if (!type) return <div className="type-placeholder" />;
        const validSubs = type.subtypes.filter(s => s.reg > 0);
        const start = validSubs.length > 7 ? (subOffset % (Math.ceil(validSubs.length / 7) * 7)) : 0;
        const displaySubs = validSubs.slice(start, start + 7);

        return (
            <div className="type-section">
                <div className="type-header-row">
                    <span 
                        className="type-name" 
                        style={{ 
                            color: type.typeName.toLowerCase().includes('sewerage') 
                                ? '#a78bfa' // Sewerage Purple
                                : type.typeName.toLowerCase().includes('water') 
                                    ? '#38bdf8' // Water Blue
                                    : 'inherit' // Falls back to class color (e.g., text-slate-400)
                        }}
                    >
                        {type.typeName}
                    </span>
                    <span className="type-count-pill">Total Reg: {type.reg} </span>
                </div>
                <table className="subtype-table compact-layout">
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', width: '60%' }}>SUBTYPE & PERFORMANCE</th>
                            <th className="num-col">REG</th>
                            <th className="num-col">RES</th>
                            <th className="num-col">PEN</th>
                            <th className="num-col">WIP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displaySubs.map((sub, i) => {
                            const resPct = (sub.res / sub.reg) * 100;
                            const penPct = (sub.pen / sub.reg) * 100;
                            const wipPct = (sub.wip / sub.reg) * 100;

                            return (
                                <tr key={i} className="fade-row">
                                    <td>
                                        <div className="name-bar-wrapper">
                                            <span className="sub-text-name">{sub.name}</span>
                                            <div className="inline-performance-bar">
                                                <div className="bar-segment res" style={{ width: `${resPct}%` }} title={`Res: ${sub.res}`}></div>
                                                <div className="bar-segment pen" style={{ width: `${penPct}%` }} title={`Pen: ${sub.pen}`}></div>
                                                <div className="bar-segment wip" style={{ width: `${wipPct}%` }} title={`Wip: ${sub.wip}`}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="num-col text-reg">{sub.reg}</td>
                                    <td className="num-col text-res">{sub.res}</td>
                                    <td className="num-col text-pen">{sub.pen}</td>
                                    <td className="num-col text-wip">{sub.wip}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const currentTypes = activeTypes.slice(typeIndex, typeIndex + 2);

    return (
        <div className="source-slider-card">
            

            <div className="source-master-header">
                <div className="header-left">
                    <span className="source-label" style={{color: '#38bdf8'}}>Source:</span>
                    <span className="source-value" style={{ marginLeft: '8px', color: '#38bdf8', fontWeight: 'bold' }}>
                        {sourceData.sourceName}: Commissioner of Karachi
                    </span>
                </div>
                <div className="header-right">
                    <div className="global-stat">Reg: <span className="val-white">{globalTotals.reg}</span></div>
                    <div className="global-stat">Res: <span className="val-green">{globalTotals.res}</span></div>
                    <div className="global-stat">Pen: <span className="val-red">{globalTotals.pen}</span></div>
                    <div className="global-stat">Wip: <span className="val-yellow">{globalTotals.wip}</span></div>
                </div>
            </div>
            <div className="sections-grid">
                {renderTypeSection(currentTypes[0])}
                {renderTypeSection(currentTypes[1])}
            </div>
        </div>
    );
};

export default SourceSlider;