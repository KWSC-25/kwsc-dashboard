import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, MapPin, Layers } from 'lucide-react';
import api from '../utils/api';

const KarachiCenter = [24.8607, 67.0011];

const TOWN_TO_ZONE_MAP = {
    'shah faisal town': 'ZONE 1', 'ibrahim hydry town': 'ZONE 1', 'korangi town': 'ZONE 1', 'landhi town': 'ZONE 1', 'malir town': 'ZONE 1', 'gadap town': 'ZONE 1', 'model zone town': 'ZONE 1',

    'gulshan e iqbal town': 'ZONE 2', 'chanesar town': 'ZONE 2', 'lyari town': 'ZONE 2', 'saddar town': 'ZONE 2', 'safoora town': 'ZONE 2', 'clifton town': 'ZONE 2', 'jinnah town': 'ZONE 2',

    'baldia town': 'ZONE 3', 'mangopir town (surjani town)': 'ZONE 3', 'keamari town': 'ZONE 3', 'orangi town': 'ZONE 3', 'site town (moriro mir bahar)': 'ZONE 3', 'mominabad town': 'ZONE 3', 

    'north nazimabad town': 'ZONE 4', 'gulberg town': 'ZONE 4', 'liaquatabad town': 'ZONE 4', 'new karachi town': 'ZONE 4', 'nazimabad town': 'ZONE 4',  'sohrab goth town': 'ZONE 4'
};

const invisibleIcon = new L.Icon({
    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    iconSize: [1, 1],
    iconAnchor: [0, 0]
});

const ZoneComplaintMap = ({ onBackToDashboard, globalFilters = { typeId: 'ALL', startDate: '', endDate: '' } }) => {
    const [mapDepth, setMapDepth] = useState('zone'); 
    const [townData, setTownData] = useState(null);
    const [ucData, setUcData] = useState(null);
    const [selectedZone, setSelectedZone] = useState(null);
    const [selectedTown, setSelectedTown] = useState(null);
    const [zoneCenters, setZoneCenters] = useState([]);
    const [verificationMode, setVerificationMode] = useState(false);
    const [subtypes, setSubtypes] = useState([]);
    const [selectedSubtype, setSelectedSubtype] = useState('ALL');
    const [complaintStats, setComplaintStats] = useState([]);
    const [maxComplaintsValue, setMaxComplaintsValue] = useState(0);

    useEffect(() => {
        fetch('/towns-json.geojson')
            .then(res => res.json())
            .then(data => {
                setTownData(data);
                calculateZoneCenters(data);
            });

        fetch('/ucs-json.geojson')
            .then(res => res.json())
            .then(data => setUcData(data));
    }, []);

    useEffect(() => {
        const fetchDistributionMetrics = async () => {
            try {
                const params = {
                    currentDepth: mapDepth,
                    typeId: globalFilters.typeId,
                    startDate: globalFilters.startDate,
                    endDate: globalFilters.endDate,
                    subtypeId: selectedSubtype
                };
                if (selectedZone) params.selectedZoneName = selectedZone;
                if (selectedTown) params.selectedTownId = selectedTown;

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
    }, [mapDepth, selectedZone, selectedTown, globalFilters, selectedSubtype]);

    const calculateZoneCenters = (geoJson) => {
        if (!geoJson || !geoJson.features) return;
        const groups = {};
        geoJson.features.forEach(f => {
            const name = (f.properties?.name || f.properties?.Name || "").toLowerCase().trim();
            const zone = TOWN_TO_ZONE_MAP[name];
            if (zone && f.geometry) {
                if (!groups[zone]) groups[zone] = [];
                try {
                    let coords = f.geometry.coordinates;
                    while (Array.isArray(coords) && Array.isArray(coords[0])) coords = coords[0];
                    if (Array.isArray(coords) && coords.length >= 2) groups[zone].push([coords[1], coords[0]]);
                } catch  {
                            return false;}

            }
        });

        const calculatedCenters = Object.keys(groups).map(zone => {
            const points = groups[zone];
            if (points.length === 0) return { zone, center: KarachiCenter };
            const avgLat = points.reduce((sum, p) => sum + p[0], 0) / points.length;
            const avgLng = points.reduce((sum, p) => sum + p[1], 0) / points.length;
            return { zone, center: [avgLat, avgLng] };
        });
        setZoneCenters(calculatedCenters);
    };

    const getTownName = (feature) => feature.properties?.name || feature.properties?.Name || "Unknown Town";
    const getZoneOfTown = (feature) => TOWN_TO_ZONE_MAP[getTownName(feature).toLowerCase().trim()] || 'ZONE 1';
    const getUcLabelName = (feature) => feature.properties?.Name || feature.properties?.name || "Unnamed UC";

    const getCountForLayerItem = (itemName, targetDepth) => {
        const cleanName = itemName.toLowerCase().trim();
        let record = null;

        if (targetDepth === 'zone') {
            record = complaintStats.find(r => {
                const dbName = r.name.toLowerCase();
                if (cleanName === dbName) return true;
                if (cleanName.includes('1') && dbName.includes('-i')) return true;
                if (cleanName.includes('2') && dbName.includes('-ii')) return true;
                if (cleanName.includes('3') && dbName.includes('-iii')) return true;
                if (cleanName.includes('4') && dbName.includes('-iv')) return true;
                return false;
            });
            } else if (targetDepth === 'town') {
                record = complaintStats.find(r => {
                    // Just remove the word 'town' and normalize spacing
                    const dbTown = r.name.toLowerCase().replace(/\btown\b/g, '').replace(/\s+/g, ' ').trim();
                    const geoTown = cleanName.toLowerCase().replace(/\btown\b/g, '').replace(/\s+/g, ' ').trim();
                    
                    // 1. Standard strict match (This will now naturally match "site (moriro mir bahar)")
                    if (dbTown === geoTown) return true;
                    
                    // 2. Keamari / Mauripur exception fallbacks
                    if (geoTown.includes('keamari') && dbTown.includes('keamari')) return true;

                    return false;
                });
            } else if (targetDepth === 'uc') {
            const ucNumMatch = cleanName.match(/uc[- ]*(\d+)/);
            record = complaintStats.find(r => {
                const dbUc = r.name.toLowerCase();
                if (dbUc.includes(cleanName) || cleanName.includes(dbUc)) return true;
                if (ucNumMatch) {
                    const dbUcNumMatch = dbUc.match(/uc[- ]*(\d+)/);
                    return dbUcNumMatch && ucNumMatch[1] === dbUcNumMatch[1];
                }
                return false;
            });
        }
        return record ? record.total_complaints : 0;
    };

    const getColorFromRatio = (count) => {
        const ratio = maxComplaintsValue > 0 ? count / maxComplaintsValue : 0;
        if (count === 0) return '#fee2e2';
        if (ratio <= 0.2) return '#fecaca';
        if (ratio <= 0.4) return '#fca5a5';
        if (ratio <= 0.6) return '#f87171';
        if (ratio <= 0.8) return '#ef4444';
        return '#b91c1c';
    };

    const styleFeature = (feature) => {
        const townName = getTownName(feature);
        const currentZone = getZoneOfTown(feature);

        if (mapDepth === 'zone') {
            const zoneCount = getCountForLayerItem(currentZone, 'zone');
            return {
                fillColor: getColorFromRatio(zoneCount),
                weight: 2,
                color: '#ffffff',
                fillOpacity: 0.65, 
                opacity: 1
            };
        }

        if (mapDepth === 'town') {
            const isMatch = currentZone === selectedZone;
            const count = getCountForLayerItem(townName, 'town');
            const color = getColorFromRatio(count);

            return {
                fillColor: isMatch ? color : '#12182c',
                weight: isMatch ? 2.5 : 1,
                color: isMatch ? '#ffffff' : '#1e293b',
                fillOpacity: isMatch ? 0.8 : 0.05,
                opacity: isMatch ? 1 : 0.2
            };
        }
        return { fillOpacity: 0, opacity: 0, weight: 0 };
    };

    const onEachTownFeature = (feature, layer) => {
        const townName = getTownName(feature);
        const currentZone = getZoneOfTown(feature);
        const count = getCountForLayerItem(townName, 'town');

        if (mapDepth === 'town' && currentZone === selectedZone) {
            layer.bindTooltip(`${townName.toUpperCase()} (${count} Complaints)`, {
                permanent: true,
                direction: 'center',
                className: 'bg-slate-950/90 text-white font-black text-[10px] px-2 py-0.5 rounded border border-slate-700 pointer-events-none'
            });
        }

        layer.on({
            click: () => {
                if (mapDepth === 'zone') {
                    setSelectedZone(currentZone);
                    setMapDepth('town');
                } else if (mapDepth === 'town' && currentZone === selectedZone) {
                    setSelectedTown(townName);
                    setMapDepth('uc');
                }
            }
        });
    };

    const onEachUcFeature = (feature, layer) => {
        const ucTitle = getUcLabelName(feature);
        const count = getCountForLayerItem(ucTitle, 'uc');

        layer.bindTooltip(`${ucTitle.toUpperCase()} [${count}]`, {
            permanent: true,
            direction: 'center',
            className: 'bg-rose-950/95 text-rose-100 font-black text-[9px] px-1.5 py-0.5 rounded border border-rose-500/40 pointer-events-none shadow-lg'
        });
    };

    const checkPointInPolygon = (lng, lat, polygonCoordinates) => {
        let inside = false;
        for (let i = 0, j = polygonCoordinates.length - 1; i < polygonCoordinates.length; j = i++) {
            const xi = polygonCoordinates[i][0], yi = polygonCoordinates[i][1];
            const xj = polygonCoordinates[j][0], yj = polygonCoordinates[j][1];
            const intersect = ((yi > lat) !== (yj > lat))
                && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    const getFeatureCentroid = (geometry) => {
        let points = [];
        const extractPoints = (coords) => {
            if (typeof coords[0] === 'number') {
                points.push(coords);
            } else {
                coords.forEach(extractPoints);
            }
        };
        if (geometry && geometry.coordinates) {
            extractPoints(geometry.coordinates);
        }
        if (points.length === 0) return null;
        
        let sumLng = 0;
        let sumLat = 0;
        points.forEach(p => {
            sumLng += p[0];
            sumLat += p[1];
        });
        return [sumLng / points.length, sumLat / points.length];
    };

    const filterUcByTownBoundary = (ucGeoJson) => {
        if (!ucGeoJson || !selectedTown || !townData) return { type: "FeatureCollection", features: [] };
        
        const currentTargetClean = selectedTown.toLowerCase().replace('town', '').trim();
        
        const targetTownFeature = townData.features.find(f => 
            getTownName(f).toLowerCase().replace('town', '').trim() === currentTargetClean
        );

        if (!targetTownFeature || !targetTownFeature.geometry) return { type: "FeatureCollection", features: [] };

        const filteredFeatures = ucGeoJson.features.filter(ucFeature => {
            const centroid = getFeatureCentroid(ucFeature.geometry);
            if (!centroid) return false;

            const [ucLng, ucLat] = centroid;
            const geom = targetTownFeature.geometry;

            try {
                if (geom.type === 'Polygon') {
                    return checkPointInPolygon(ucLng, ucLat, geom.coordinates[0]);
                } else if (geom.type === 'MultiPolygon') {
                    return geom.coordinates.some(poly => checkPointInPolygon(ucLng, ucLat, poly[0]));
                }
            } catch {
                return false;
            }
            return false;
        });

        return { type: "FeatureCollection", features: filteredFeatures };
    };

    const getRenderedTotalsText = () => {
        if (mapDepth === 'zone') {
            return `Total Shown: 4 Zones`;
        } else if (mapDepth === 'town') {
            if (!townData) return '';
            const filteredTownsCount = townData.features.filter(f => getZoneOfTown(f) === selectedZone).length;
            return `Total Shown: ${filteredTownsCount} Towns`;
        } else if (mapDepth === 'uc') {
            if (!ucData) return '';
            const filteredUcsCount = filterUcByTownBoundary(ucData).features.length;
            return `Total Shown: ${filteredUcsCount} Union Councils`;
        }
        return '';
    };

    return (
        <div className="bg-[#0c1122] border border-slate-800 rounded-xl p-5 space-y-4 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBackToDashboard} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black uppercase px-3 py-2 rounded-lg">
                        <ArrowLeft className="w-4 h-4" /> Exit Map
                    </button>
                    <h2 className="text-sm font-black text-white uppercase flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-cyan-400" />
                        {mapDepth === 'zone' ? "Karachi Administrative Zone Layout" : mapDepth === 'town' ? `${selectedZone} - Active Towns` : `${selectedTown?.toUpperCase()} - Union Councils`}
                    </h2>
                </div>

                <div className="text-xs font-bold text-slate-400 flex flex-wrap items-center gap-3 bg-[#12182c] border border-slate-800 px-3 py-1.5 rounded-lg">
                    <div className="flex items-center gap-1.5 pr-2 border-r border-slate-700 text-cyan-400 font-extrabold uppercase">
                        {getRenderedTotalsText()}
                    </div>
                    
                    {/* SUBTYPE SELECT ENGINE DROPDOWN */}
                    <div className="flex items-center gap-1 pr-2 border-r border-slate-700">
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

                    <span className="cursor-pointer uppercase" onClick={() => { setSelectedZone(null); setSelectedTown(null); setMapDepth('zone'); }}>Karachi</span>
                    {selectedZone && <><span>&gt;</span><span className="cursor-pointer uppercase" onClick={() => { setSelectedTown(null); setMapDepth('town'); }}>{selectedZone}</span></>}
                    {selectedTown && <><span>&gt;</span><span className="text-rose-400 font-black uppercase">{selectedTown}</span></>}
                </div>
            </div>

            <div className="h-[850px] w-full rounded-lg overflow-hidden border border-slate-800 relative bg-[#060913]">
                <MapContainer center={KarachiCenter} zoom={11} className="h-full w-full">
                    <TileLayer url={verificationMode ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"} />

                    {townData && (
                        <GeoJSON 
                            key={`towns-${mapDepth}-${selectedZone}-${verificationMode}-${maxComplaintsValue}-${selectedSubtype}`}
                            data={townData}
                            style={styleFeature}
                            onEachFeature={onEachTownFeature}
                        />
                    )}

                    {mapDepth === 'zone' && zoneCenters.map(zc => {
                        const count = getCountForLayerItem(zc.zone, 'zone');
                        return (
                            <Marker key={zc.zone} position={zc.center} icon={invisibleIcon}>
                                <Tooltip permanent direction="center" className="bg-slate-900 border-2 border-cyan-500 text-white font-black text-xs px-2.5 py-1 rounded-md shadow-2xl">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="flex items-center gap-1.5 font-extrabold">
                                            {zc.zone}
                                        </div>
                                        <span className="text-[10px] text-rose-400 font-bold">{count} Complaints</span>
                                    </div>
                                </Tooltip>
                            </Marker>
                        );
                    })}

                    {ucData && mapDepth === 'uc' && (
                        <GeoJSON 
                            key={`ucs-${selectedTown}-${maxComplaintsValue}-${selectedSubtype}`}
                            data={filterUcByTownBoundary(ucData)}
                            style={(f) => {
                                const count = getCountForLayerItem(getUcLabelName(f), 'uc');
                                const color = getColorFromRatio(count);
                                return { fillColor: color, weight: 1.8, color: '#ffffff', fillOpacity: 0.8, opacity: 1 };
                            }}
                            onEachFeature={onEachUcFeature}
                        />
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

export default ZoneComplaintMap;