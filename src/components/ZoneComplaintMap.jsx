import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { ArrowLeft, MapPin, Layers, Info } from 'lucide-react';
import api from '../utils/api';

const KarachiCenter = [24.8607, 67.0011];

// Zone assignment data vectors mapping parent towns to target operational sectors
const ZONE_MAPPING = {
    'ZONE 1': [
        'SHAH FAISAL TOWN', 'IBRAHIM HYDRY TOWN', 'KORANGI TOWN', 
        'LANDHI TOWN', 'MALIR TOWN', 'MODEL ZONE TOWN', 'GADAP TOWN'
    ],
    'ZONE 2': [
        'CLIFTON', 'GULSHAN E IQBAL TOWN', 'CHANESAR TOWN', 
        'LYARI TOWN', 'SADDAR TOWN', 'SAFOORA TOWN', 'JINNAH TOWN'
    ],
    'ZONE 3': [
        'BALDIA TOWN', 'MANGOPIR TOWN', 'SURJANI TOWN', 'MARIPUR/KEAMARI TOWN', 'MARIPUR', 'KEAMARI',
        'KEAMARI TOWN', 'ORANGI TOWN', 'SITE TOWN', 'MORIRO MIR BAHAR', 'MOMINABAD TOWN'
    ],
    'ZONE 4': [
        'NORTH NAZIMABAD TOWN', 'GULBERG TOWN', 'LIAQUATABAD TOWN', 
        'NEW KARACHI TOWN', 'NAZIMABAD TOWN', 'SOHRAB GOTH TOWN'
    ]
};

const ZoneComplaintMap = ({ onBackToDashboard, globalFilters = { typeId: 'ALL', startDate: '', endDate: '' } }) => {
    const [ucData, setUcData] = useState(null);
    const [verificationMode, setVerificationMode] = useState(false);
    const [subtypes, setSubtypes] = useState([]);
    const [selectedSubtype, setSelectedSubtype] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL'); // New Filter State Vector
    const [complaintStats, setComplaintStats] = useState([]);
    const [maxComplaintsValue, setMaxComplaintsValue] = useState(0);
    const [hoveredUc, setHoveredUc] = useState(null); // Managed state panel for overlay card

    useEffect(() => {
        fetch('/ucs-json.geojson')
            .then(res => res.json())
            .then(data => setUcData(data));
    }, []);

    useEffect(() => {
        const fetchDistributionMetrics = async () => {
            try {
                const params = {
                    typeId: globalFilters.typeId,
                    startDate: globalFilters.startDate,
                    endDate: globalFilters.endDate,
                    subtypeId: selectedSubtype,
                    status: selectedStatus // Propagated cleanly to endpoint
                };

                const res = await api.get('zone-complaints/map-distribution', { params });
                if (res.data.success) {
                    setSubtypes(res.data.subtypes || []);
                    setComplaintStats(res.data.mapData || []);
                    
                    const maxVal = res.data.mapData.reduce((max, obj) => obj.total_complaints > max ? obj.total_complaints : max, 0);
                    setMaxComplaintsValue(maxVal || 1);
                }
            } catch (error) {
                console.error("Failed syncing map component data vectors", error);
            }
        };
        fetchDistributionMetrics();
    }, [globalFilters, selectedSubtype, selectedStatus]);

    const getUcLabelName = (feature) => feature.properties?.Name || feature.properties?.name || "Unnamed UC";

    const getCountForUc = (itemName) => {
        const cleanGeoName = itemName.toLowerCase().trim();
        
        // Extract numeric ID safely (e.g., "Keamari UC2" -> 2)
        const ucNumMatch = cleanGeoName.match(/uc[- ]*(\d+)/);
        const targetNumber = ucNumMatch ? parseInt(ucNumMatch[1], 10) : null;

        if (targetNumber === null) return 0;

        // Safely extract potential keywords of parent town inside GeoJSON name string (e.g. "keamari")
        const targetTownKeyword = cleanGeoName.replace(/uc[- ]*\d+/g, '').replace(/\s+/g, ' ').trim();

        // Cross check both the extracted sequence and the parent town space
        const record = complaintStats.find(r => {
            const dbUc = r.name.toLowerCase().replace(/\s+/g, ' ').trim();
            const dbTown = r.town_name.toLowerCase().trim();
            
            // Match structural configurations
            const dbUcNumMatch = dbUc.match(/uc\s*[- ]*\s*0*(\d+)/);
            if (dbUcNumMatch) {
                const dbNumber = parseInt(dbUcNumMatch[1], 10);
                
                // Matches the number sequence AND checks if the town substring intercepts correctly
                if (targetNumber === dbNumber) {
                    if (dbTown.includes(targetTownKeyword) || targetTownKeyword.includes(dbTown)) {
                        return true;
                    }
                }
            }
            return false;
        });

        return record ? record.total_complaints : 0;
    };

    const getColorFromRatio = (count) => {
        if (count === 0) return '#c2bebe'; // Slate border indicator for zero complaints
        
        // Log calculation spreads out variance at the lower numerical bounds
        const logCount = Math.log(count + 1);
        const logMax = Math.log(maxComplaintsValue + 1);
        const ratio = logMax > 0 ? logCount / logMax : 0;

        if (ratio <= 0.15) return '#ffe4e6';
        if (ratio <= 0.30) return '#fecdd3';
        if (ratio <= 0.45) return '#fda4af';
        if (ratio <= 0.60) return '#fb7185';
        if (ratio <= 0.75) return '#f43f5e';
        if (ratio <= 0.85) return '#e11d48';
        if (ratio <= 0.92) return '#be123c';
        return '#9f1239'; 
    };

    const onEachUcFeature = (feature, layer) => {
        const ucTitle = getUcLabelName(feature);
        const count = getCountForUc(ucTitle);

        // Determine Zone dynamically by extracting town name from feature label
        const cleanGeoName = ucTitle.toUpperCase().replace(/UC[- ]*\d+/g, '').replace(/\s+/g, ' ').trim();
        let detectedZone = "UNKNOWN ZONE";

        for (const [zoneName, towns] of Object.entries(ZONE_MAPPING)) {
            const match = towns.some(town => town.includes(cleanGeoName) || cleanGeoName.includes(town));
            if (match) {
                detectedZone = zoneName;
                break;
            }
        }

        // Setup mouse events to update the fixed position overlay card context
        layer.on({
            mouseover: (e) => {
                const targetLayer = e.target;
                targetLayer.setStyle({
                    fillOpacity: 0.95,
                    weight: 2,
                    color: '#00ffff' // highlight border boundary on pointer capture
                });
                setHoveredUc({
                    title: ucTitle.toUpperCase(),
                    count: count,
                    zone: detectedZone
                });
            },
            mouseout: (e) => {
                const targetLayer = e.target;
                targetLayer.setStyle({
                    fillOpacity: 0.75,
                    weight: 1.2,
                    color: '#ffffff'
                });
                setHoveredUc(null);
            }
        });
    };

    return (
        <div className="bg-[#0c1122] border border-slate-800 rounded-xl p-5 space-y-4 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex flex-wrap items-center gap-6">
                    <button onClick={onBackToDashboard} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black uppercase px-3 py-2 rounded-lg">
                        <ArrowLeft className="w-4 h-4" /> Exit Map
                    </button>
                    <div className="space-y-1.5">
                        <h2 className="text-sm font-black text-white uppercase flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-cyan-400" />
                            Karachi Administrative Overview - City-Wide UC Tracker
                        </h2>
                        {/* Dynamic Map Legend Segment */}
                        <div className="flex items-center gap-3 bg-[#070a14] border border-slate-800/80 rounded-md px-2.5 py-1 text-[12px] w-fit">
                            <span className="text-slate-500 font-black tracking-wider uppercase pr-1">Density Scale:</span>
                            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-[#c2bebe]" /> <span className="text-slate-400 font-bold">0</span></div>
                            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-[#ffe4e6]" /> <span className="text-slate-400 font-bold">Low</span></div>
                            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-[#fda4af]" /> <span className="text-slate-400 font-bold">Moderate</span></div>
                            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-[#f43f5e]" /> <span className="text-slate-400 font-bold">High</span></div>
                            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-[#9f1239]" /> <span className="text-slate-400 font-bold">Critical (Peak)</span></div>
                        </div>
                    </div>
                </div>

                <div className="text-xs font-bold text-slate-400 flex flex-wrap items-center gap-3 bg-[#12182c] border border-slate-800 px-3 py-1.5 rounded-lg">
                    <div className="flex items-center gap-1.5 pr-2 border-r border-slate-700 text-cyan-400 font-extrabold uppercase">
                        Total Counted: {ucData?.features?.length || 0} UCs
                    </div>
                    
                    <button 
                        onClick={() => setVerificationMode(!verificationMode)}
                        className={`flex items-center gap-1 pr-2 border-r border-slate-700 text-[10px] font-black tracking-wider uppercase transition-colors ${verificationMode ? 'text-green-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Map Street View</span>
                    </button>
                    
                    {/* Status Filter Component Element */}
                    <div className="flex items-center gap-1 pr-2 border-r border-slate-700">
                        <span className="text-slate-400 uppercase text-[10px] font-black tracking-wider">Status:</span>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="bg-transparent text-white font-black text-xs outline-none cursor-pointer pr-4 border-none focus:ring-0 uppercase"
                        >
                            <option value="ALL" className="bg-[#12182c] text-white font-semibold">REGISTERED</option>
                            <option value="0" className="bg-[#12182c] text-white font-semibold">PENDING</option>
                            <option value="2" className="bg-[#12182c] text-white font-semibold">WORK IN PROGRESS</option>
                            <option value="1" className="bg-[#12182c] text-white font-semibold">RESOLVED</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1 pr-2">
                        <span className="text-slate-400 uppercase text-[10px] font-black tracking-wider">Subtype:</span>
                        <select
                            value={selectedSubtype}
                            onChange={(e) => setSelectedSubtype(e.target.value)}
                            className="bg-transparent text-white font-black text-xs outline-none cursor-pointer pr-4 border-none focus:ring-0 uppercase"
                        >
                            <option value="ALL" className="bg-[#12182c] text-white font-semibold">ALL SUBTYPES</option>
                            {subtypes.map((st) => (
                                <option key={st.id} value={st.id} className="bg-[#12182c] text-white font-semibold">
                                    {st.title.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="h-[850px] w-full rounded-lg overflow-hidden border border-slate-800 relative bg-[#060913]">
                <MapContainer center={KarachiCenter} zoom={11} className="h-full w-full">
                <TileLayer 
                    url={verificationMode 
                        ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                        : "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                    } 
                    attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
                />

                    {ucData && (
                        <GeoJSON 
                            key={`global-ucs-${maxComplaintsValue}-${selectedSubtype}-${selectedStatus}-${verificationMode}`}
                            data={ucData}
                            style={(f) => {
                                const count = getCountForUc(getUcLabelName(f));
                                const color = getColorFromRatio(count);
                                return { 
                                    fillColor: color, 
                                    weight: 1.2, 
                                    color: '#ffffff', 
                                    fillOpacity: 0.75, 
                                    opacity: 0.9 
                                };
                            }}
                            onEachFeature={onEachUcFeature}
                        />
                    )}
                </MapContainer>

                {/* Fixed Overlay Card Dashboard Section positioned safely below Leaflet Zoom Controls */}
                <div className="absolute top-20 left-4 z-[1000] w-72 transition-all duration-200 pointer-events-none">
                    {hoveredUc ? (
                        <div className="bg-[#0c1122]/95 backdrop-blur border-2 border-cyan-500/80 shadow-2xl rounded-xl p-4 space-y-3 animate-fadeIn">
                            <div className="flex items-start justify-between">
                                <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                                    {hoveredUc.zone}
                                </span>
                                <Info className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Selected Sector</p>
                                <h4 className="text-white text-base font-black tracking-tight leading-snug drop-shadow-sm">
                                    {hoveredUc.title}
                                </h4>
                            </div>
                            <div className="bg-[#060913] border border-slate-800/80 rounded-lg p-2.5 flex items-center justify-between">
                                <span className="text-slate-400 font-medium text-xs">Total Complaints:</span>
                                <span className="text-xl font-black text-rose-400 tracking-wide">
                                    {hoveredUc.count}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#0c1122]/70 backdrop-blur border border-slate-800 shadow-xl rounded-xl p-3 text-center">
                            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                                Hover over a UC region to inspect
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ZoneComplaintMap;