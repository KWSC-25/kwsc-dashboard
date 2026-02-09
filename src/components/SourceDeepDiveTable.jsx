
const SourceDeepDiveTable = ({ data }) => {
    return (
        <div className="source-analytics-wrapper-compact">
            

            <div className="table-container-compact">
                <table className="modern-data-table-compact">
                    <thead>
                        {/* Level 1: Category Headers */}
                        <tr className="main-header-row">
                            <th className="sno-column" rowSpan="2">S.No</th>
                            <th className="source-name-column" rowSpan="2">Source Name</th>
                            <th className="cat-group water-border" colSpan="4">Water</th>
                            <th className="cat-group sew-border" colSpan="4">Sewerage</th>
                            <th className="cat-group other-border" colSpan="4">Others</th>
                        </tr>
                        
                        {/* Level 2: Status Labels */}
                        <tr className="sub-header-row">
                            {/* Water Statuses */}
                            <th className="status-label reg-text">Reg</th>
                            <th className="status-label res-text">Res</th>
                            <th className="status-label pen-text">Pen</th>
                            <th className="status-label wip-text water-border-heavy">WIP</th>
                            {/* Sewerage Statuses */}
                            <th className="status-label reg-text">Reg</th>
                            <th className="status-label res-text">Res</th>
                            <th className="status-label pen-text">Pen</th>
                            <th className="status-label wip-text sew-border-heavy">WIP</th>
                            {/* Others Statuses */}
                            <th className="status-label reg-text">Reg</th>
                            <th className="status-label res-text">Res</th>
                            <th className="status-label pen-text">Pen</th>
                            <th className="status-label wip-text">WIP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr key={idx} className="data-row-compact">
                                <td className="sno-cell">{idx + 1}</td>
                                <td className="source-cell-compact">{row.source}</td>
                                
                                {/* Water Column Data */}
                                <td className="val-compact reg-text">{row.reg_water}</td>
                                <td className="val-compact res-text">{row.res_water}</td>
                                <td className="val-compact pen-text">{row.pen_water}</td>
                                <td className="val-compact wip-text water-border-heavy">{row.wip_water}</td>
                                
                                {/* Sewerage Column Data */}
                                <td className="val-compact reg-text">{row.reg_sew}</td>
                                <td className="val-compact res-text">{row.res_sew}</td>
                                <td className="val-compact pen-text">{row.pen_sew}</td>
                                <td className="val-compact wip-text sew-border-heavy">{row.wip_sew}</td>
                                
                                {/* Others Column Data */}
                                <td className="val-compact reg-text">{row.reg_others}</td>
                                <td className="val-compact res-text">{row.res_others}</td>
                                <td className="val-compact pen-text">{row.pen_others}</td>
                                <td className="val-compact wip-text">{row.wip_others}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SourceDeepDiveTable;