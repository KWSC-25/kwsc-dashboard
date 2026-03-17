import React, { useState, useEffect } from 'react';
import { Scale, Landmark, Gavel, ShieldCheck, Calendar, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- MOVE TABLESECTION OUTSIDE ---
// --- UPDATED TABLESECTION ---
const TableSection = ({ data, badge, title, getRowClass, setSelectedStatus }) => (
    <div className="lcms-half-panel">
        <div className="panel-header-inline">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge-lit">{badge}</span>
                    <h3>{title}</h3>
                </div>
                {/* Swipe indicator visible only on mobile */}
                <span className="mobile-swipe-hint">← Swipe table to view more →</span>
            </div>
        </div>
        <div className="table-container-fixed">
            <table className="lcms-one-pager-table">
                <thead>
                    <tr>
                        <th>COURT / CASE</th>
                        <th>DATE & Advocate</th>
                        <th>MATTER / DEPT</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, idx) => {
                        const rowClass = getRowClass(item.nextDate, data);
                        return (
                            <tr key={idx} className={rowClass}>
                                <td>
                                    <div className="cell-main">{item.court}</div>
                                    <div className="cell-sub">{item.caseTitle}</div>
                                </td>
                                <td>
                                    <div className="date-box">
                                        {rowClass === 'row-passed' && <CheckCircle2 size={14} className="tick" />}
                                        {item.nextDate}
                                    </div>
                                    <div className="name-box">{item.advocatename}</div>
                                </td>
                                <td>
                                    <div className="matter-text">{item.matter}</div>
                                    <button className="dept-action-btn" onClick={() => setSelectedStatus(item)}>
                                        {item.dept} <ChevronRight size={12} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    </div>
);

const LcmsDashboard = () => {
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 3600000);
        return () => clearInterval(timer);
    }, []);

    const parseDate = (dateStr) => {
        const parts = dateStr.split('.');
        return new Date(parts[2], parts[1] - 1, parts[0]);
    };

    const getRowClass = (dateStr, dataArray) => {
        const rowDate = parseDate(dateStr);
        const today = new Date(currentTime.getTime());
        today.setHours(0, 0, 0, 0);

        if (rowDate < today) return 'row-passed';
        const upcoming = dataArray.map(d => parseDate(d.nextDate)).filter(d => d >= today).sort((a, b) => a - b);
        if (upcoming.length > 0 && rowDate.getTime() === upcoming[0].getTime()) return 'row-next-glow';
        return '';
    };

    const complianceData = [
        { court: "Vth Senior Civil Judge, Karachi (West)", caseTitle: "SOCIETY SUIT NO. 277/2026 AFAQ HUSSAIN SIDDIQU V/S Province of Sindh& others (16) KW&SC", nextDate: "30.03.2026", advocate: "IRFAN ALI", matter: "Water supply issue to PCSIR Society", status: "Held that since KW&SC is charging billing on individual basis therefore, KW&SC should ensure supply to all individuals / residents of society. KW&SC has filed application for modification of order.", dept: "IRFAN ULLAH SHEIKH EE Dumlottee", advocatename: "IRFAN ALI" },
        { court: "Vth Additional District & Sessions Judge, Karachi (West)", caseTitle: "Civil Appeal 390/2025 KW&SC v/s NISAR", nextDate: "14.03.2026", advocate: "IRFAN ALI", matter: "fatal accident Civil Suit 1057/2023", status: "Suit decreed against KW&SC . Awarded compensation amounting to PKR 15,000,000 (Rupees Fifteen Million) against KW&SC. Civil Appeal filed. Stage Service.", dept: "EE SEW Mauri pur Town", advocatename: "IRFAN ALI" },
        { court: "High Court of Sindh at Karachi", caseTitle: "C.P.NO.D- 27/2026 M/s. SSS Corporation V/S FED OF PAK AND OTHERS", nextDate: "03.04.2026", advocate: "BARRISTER WALEED KHANZADA", matter: "HYDRANT MATTER", status: "CEO appeared in person. Adjourned to 3-4-2026 for fresh report.", dept: "Incharge Hydrant Mr. Ayaz Tunio", advocatename: "BARRISTER WALEED KHANZADA" },
        { court: "High Court of Sindh at Karachi", caseTitle: "C.P.NO.D- 4192/2025 Sohailuddin V/s Province of Sindh & Others", nextDate: "22.01.2026", advocate: "BARRISTER WALEED KHANZADA", matter: "(DIRECTION) wrong billing 1000sq yds 296 sqyards", status: "No comments were provided due to which court showed its extreme displeasure. However, case disposed off with directions to decide petitioner’s application within 30 days. Report from RRG still awaited.", dept: "RRG DEPARTMENT", advocatename: "BARRISTER WALEED KHANZADA" }
    ];

    const litigationData = [
        { court: "Sr. Civil Judge III, Khi (South)", caseTitle: "SUIT NO.S- 8092/2025 Karachi Water & Sewerage Boar V/S COMMANDER KARACHI & ORS.", nextDate: "28.03.2026", advocate: "WALEED KHANZADA", matter: "LAND DISPUTE WITH PAKISTAN NAVY.", status: "FOR FINAL ARGUMENTS", dept: "KDC-I", advocatename: "BARRISTER WALEED KHANZADA" },
        { court: "Sr. Civil Judge IV, Malir", caseTitle: "SUIT NO.S- 2258/2025 ZULFIQAR ALI V/S PROVINCE OF SINDH & OTHERS", nextDate: "26.03.2026", advocate: "MUHAMMAD ASHRAF", matter: "DAMLOTTEE LAND MATTER", status: "1. Revenue Appeal pending with DC Malir. 2. Fresh Civil Suit being instituted.", dept: "Sr. Dir Land & PD Land", advocatename: "MUHAMMAD ASHRAF" },
        { court: "Sr. Civil Judge XIII, Karachi (East)", caseTitle: "SUIT NO.S- 8507/2025 Darr-us-Salam Co. Op. Housing Society V/S M/s Karachi water & Sewerage Board & Others", nextDate: "09.05.2026", advocate: "QAMAR ABBAS ABBASI", matter: "1. Restoration of 10 inch water connection. 2. Shifting of line to China line.", status: "Concerned officers are in touch with Penal Advocate for preparation of fresh report.", dept: "Joint issue CE Bulk , RRG , KDC I & II" , advocatename: "QAMAR ABBAS ABBASI"},
        { court: "High Court of Sindh at Karachi", caseTitle: "C.P.NO.D- 5440/2023 Abdul Wasay Khan Kakar V/S Govt of Sindh & Others", nextDate: "25.05.2026", advocate: "BARRISTER WALEED KHANZADA", matter: "(SUPPLY OF WATER)", status: "Contempt application filed but withdrawn as reported by Legal Retainer.", dept: "Water Deptt Baldia", advocatename: "BARRISTER WALEED KHANZADA" }
    ];

    return (
        <div className="lcms-one-view-wrapper">
            <div className="lcms-ceo-header">
                <span className="tag">LITIGATION CEO DASHBOARD</span>
            </div>

            <div className="lcms-kpi-row">
                <div className="kpi-card-simple border-red">
                    <label>Total cases pending</label>
                    <span className="val color-red">633</span>
                    <Scale className="icon-red" size={24} />
                </div>
                <div className="kpi-card-simple border-blue">
                    <label>High Court / Supreme Court</label>
                    <span className="val">359</span>
                    <div className="sub">High Court: 346 | Sindh Court: 13</div>
                </div>
                <div className="kpi-card-simple border-purple">
                    <label>District / Tribunals</label>
                    <span className="val">265</span>
                    <div className="sub">Dist: 265 | Trib: NIL</div>
                </div>
                <div className="kpi-card-simple border-green">
                    <label>Decided in Feb </label>
                    <span className="val color-green">37</span>
                    <div className="sub">Cases decided during February</div>
                </div>
                <div className="kpi-card-simple border-yellow">
                    <label>Newly Filed Cases</label>
                    <span className="val color-yellow">02</span>
                    <Scale className="icon-yellow" size={24} />
                </div>
            </div>

            <div className="lcms-main-grid">
                <TableSection 
                    data={complianceData} 
                    badge="COMPLIANCE" 
                    title="STATUS OF COURT ORDERS" 
                    getRowClass={getRowClass} 
                    setSelectedStatus={setSelectedStatus} 
                />
                <TableSection 
                    data={litigationData} 
                    badge="LITIGATION" 
                    title="CONTEMPT / SENSITIVE MATTERS / IMPORTANT CASES" 
                    getRowClass={getRowClass} 
                    setSelectedStatus={setSelectedStatus} 
                />
            </div>

            <AnimatePresence>
                {selectedStatus && (
                    <div className="lcms-overlay" onClick={() => setSelectedStatus(null)}>
                        <motion.div initial={{scale: 0.95}} animate={{scale: 1}} className="lcms-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-head"><AlertTriangle size={20} color="#d4af37" /> COURT DIRECTION / STATUS</div>
                            <div className="modal-body">{selectedStatus.status}</div>
                            <button className="modal-close" onClick={() => setSelectedStatus(null)}>CLOSE</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LcmsDashboard;