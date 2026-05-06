import React, { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const SpecialSourcesCard = () => {
    const [sources, setSources] = useState([]);
    const [selectedSourceData, setSelectedSourceData] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const fetchSpecialSources = useCallback(async () => {
        try {
            const res = await api.get('/intel/special-sources');
            setSources(res.data);
        } catch (err) {
            console.error("Error fetching Special Sources:", err);
        }
    }, []);

    useEffect(() => {
        fetchSpecialSources();
        const interval = setInterval(fetchSpecialSources, 5000);
        return () => clearInterval(interval);
    }, [fetchSpecialSources]);

    const handleSourceClick = async (sourceName) => {
        try {
            const res = await api.get(`/source/source-details?source=${encodeURIComponent(sourceName)}`);
            setSelectedSourceData(res.data);
            setShowModal(true);
        } catch (err) {
            console.error("Error fetching Source details:", err);
        }
    };

    return (
        <div className="special-sources-container">
            <div className="panel-header-priority">PRIORITY SOURCES</div>
            
            <div className="sources-list-wrapper">
                {sources.map((item, idx) => (
                    <div 
                        key={idx} 
                        className="source-list-item" 
                        onClick={() => handleSourceClick(item.source)}
                    >
                        {/* HEADER WITH TODAY COUNT */}
                        <div className="source-item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                            <div className="source-item-name" style={{ marginBottom: 0 }}>{item.source}</div>
                            <div className="today-count" style={{ color: '#00ffcc', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                Today Registered: {item.today_registered || 0}
                            </div>
                        </div>

                        <div className="source-item-stats">
                            <div className="mini-stat">
                                <span className="lbl">REG</span>
                                <span className="val text-blue">{item.total_registered}</span>
                            </div>
                            <div className="mini-stat">
                                <span className="lbl">PEN</span>
                                <span className="val text-red">{item.total_pending}</span>
                            </div>
                            <div className="mini-stat">
                                <span className="lbl">RES</span>
                                <span className="val text-green">{item.total_resolved}</span>
                            </div>
                            <div className="mini-stat">
                                <span className="lbl">WIP</span>
                                <span className="val text-yellow">{item.total_wip}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {showModal && selectedSourceData && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="modal-content source-modal" 
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <h2 className="modal-title">
                                    <span style={{ color: '#00ffcc' }}>Source: {selectedSourceData.source}</span>
                                </h2>
                                <div className="modal-source-totals-row">
                                    <div className="source-badge b-blue">
                                        <span className="b-label">REG</span>
                                        <span className="b-val">{selectedSourceData.grandTotals.reg}</span>
                                    </div>
                                    <div className="source-badge b-red">
                                        <span className="b-label">PEN</span>
                                        <span className="b-val">{selectedSourceData.grandTotals.pen}</span>
                                    </div>
                                    <div className="source-badge b-green">
                                        <span className="b-label">RES</span>
                                        <span className="b-val">{selectedSourceData.grandTotals.res}</span>
                                    </div>
                                    <div className="source-badge b-yellow">
                                        <span className="b-label">WIP</span>
                                        <span className="b-val">{selectedSourceData.grandTotals.wip}</span>
                                    </div>
                                </div>
                                <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                            </div>

                            <div className="modal-body">
                                {selectedSourceData.breakdown.map((type, idx) => (
                                    <div key={idx} className="type-section">
                                        <div className="type-summary-bar">
                                            <span className="type-title">{type.typeName}</span>
                                            <div className="type-totals">
                                                <span>Reg: {type.typeTotal}</span>
                                                <span className="text-green">Res: {type.typeRes}</span>
                                                <span className="text-red">Pen: {type.typePen}</span>
                                            </div>
                                        </div>
                                        <table className="modern-table">
                                            <thead>
                                                <tr><th>Subtype</th><th>Reg</th><th>Res</th><th>Pen</th><th>WIP</th></tr>
                                            </thead>
                                            <tbody>
                                                {type.subtypes.map((st, sIdx) => (
                                                    <tr key={sIdx}>
                                                        <td>{st.subtype_name || 'General'}</td>
                                                        <td>{st.total_reg}</td>
                                                        <td className="text-green">{st.total_res}</td>
                                                        <td className="text-red">{st.total_pen}</td>
                                                        <td className="text-yellow">{st.total_wip}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SpecialSourcesCard;