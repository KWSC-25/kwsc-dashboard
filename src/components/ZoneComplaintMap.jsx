import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, MapPin, Eye, Layers } from 'lucide-react';

const KarachiCenter = [24.8607, 67.0011];

// Official KWSB 4-Zone configuration matrix mapping (With fallback normalization variants)
const TOWN_TO_ZONE_MAP = {
    'shah faisal town': 'ZONE 1', 'ibrahim hyderi town': 'ZONE 1', 'koraingi town': 'ZONE 1', 'landhi town': 'ZONE 1', 'malir town': 'ZONE 1', 'gadap town': 'ZONE 1', 'model zone town': 'ZONE 1',
    'gulshan town': 'ZONE 2', 'gulshan e iqbal town': 'ZONE 2', 'chanesar goth town': 'ZONE 2', 'chanesar town': 'ZONE 2', 'lyari town': 'ZONE 2', 'saddar town': 'ZONE 2', 'safoora town': 'ZONE 2', 'clifton': 'ZONE 2', 'jinnah town': 'ZONE 2', 'saddar town2': 'ZONE 2',
    'baldia town': 'ZONE 3', 'manghopir town': 'ZONE 3', 'mangopir town': 'ZONE 3', 'manghopir town (surjani town)': 'ZONE 3', 'mangopir town (surjani town)': 'ZONE 3', 'keamari town': 'ZONE 3', 'mauripur town': 'ZONE 3', 'maripur/keamari town': 'ZONE 3', 'orangi town': 'ZONE 3', 'site town': 'ZONE 3', 'site town (moriro mir bahar)': 'ZONE 3', 'mominabad town': 'ZONE 3',
    'north nazimabad town': 'ZONE 4', 'gulberg town': 'ZONE 4', 'liaquatabad town': 'ZONE 4', 'new karachi town': 'ZONE 4', 'nazimabad town': 'ZONE 4', 'sohrabh goth town': 'ZONE 4', 'sohrab goth town': 'ZONE 4'
};

const ZONE_COLORS = {
    'ZONE 1': '#3b82f6', // Blue
    'ZONE 2': '#10b981', // Emerald Green
    'ZONE 3': '#f59e0b', // Amber
    'ZONE 4': '#a855f7'  // Purple
};

const invisibleIcon = new L.Icon({
    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    iconSize: [1, 1],
    iconAnchor: [0, 0]
});

const ZoneComplaintMap = ({ onBackToDashboard }) => {
    const [mapDepth, setMapDepth] = useState('zone'); 
    const [townData, setTownData] = useState(null);
    const [ucData, setUcData] = useState(null);
    
    const [selectedZone, setSelectedZone] = useState(null);
    const [selectedTown, setSelectedTown] = useState(null);
    const [zoneCenters, setZoneCenters] = useState([]);
    const [verificationMode, setVerificationMode] = useState(false);

    const selectedTownPolygonRef = useRef(null);

    useEffect(() => {
        fetch('/towns-json.geojson')
            .then(res => res.json())
            .then(data => {
                setTownData(data);
                calculateZoneCenters(data);
            })
            .catch(err => console.error("Error fetching towns-json layer:", err));

        fetch('/ucs-json.geojson')
            .then(res => res.json())
            .then(data => setUcData(data))
            .catch(err => console.error("Error fetching ucs-json layer:", err));
    }, []);

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
                    while (Array.isArray(coords) && Array.isArray(coords[0])) {
                        coords = coords[0];
                    }
                    if (Array.isArray(coords) && coords.length >= 2 && typeof coords[0] === 'number') {
                        groups[zone].push([coords[1], coords[0]]);
                    }
                } catch (e) {
                    console.warn("Skipped coordinate entry for center assignment optimization", e);
                }
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
    
    const getUcLabelName = (feature) => {
        if (!feature || !feature.properties) return "UC Layer Fragment";
        return feature.properties.Name || feature.properties.name || "Unnamed UC";
    };

    const styleFeature = (feature) => {
        const currentZone = getZoneOfTown(feature);

        if (mapDepth === 'zone') {
            return {
                fillColor: ZONE_COLORS[currentZone] || '#64748b',
                weight: 2,
                color: verificationMode ? '#ffffff' : '#0f172a',
                fillOpacity: verificationMode ? 0.35 : 0.6,
                opacity: 1
            };
        }

        if (mapDepth === 'town') {
            const isMatch = currentZone === selectedZone;
            return {
                fillColor: isMatch ? ZONE_COLORS[selectedZone] : '#12182c',
                weight: isMatch ? 2.5 : 1,
                color: isMatch ? '#ffffff' : '#1e293b',
                fillOpacity: isMatch ? (verificationMode ? 0.4 : 0.75) : 0.05,
                opacity: isMatch ? 1 : 0.2
            };
        }

        return { fillOpacity: 0, opacity: 0, weight: 0 };
    };

    const onEachTownFeature = (feature, layer) => {
        const townName = getTownName(feature);
        const currentZone = getZoneOfTown(feature);

        if (mapDepth === 'town' && currentZone === selectedZone) {
            layer.bindTooltip(townName.toUpperCase(), {
                permanent: true,
                direction: 'center',
                className: 'bg-slate-950/90 text-white font-black text-[10px] px-2 py-0.5 rounded border border-slate-700 pointer-events-none'
            });
        }

        layer.on({
            mouseover: () => {
                if (mapDepth === 'zone' || (mapDepth === 'town' && currentZone === selectedZone)) {
                    layer.setStyle({ fillOpacity: 0.85 });
                }
            },
            mouseout: () => {
                layer.setStyle(styleFeature(feature));
            },
            click: () => {
                if (mapDepth === 'zone') {
                    setSelectedZone(currentZone);
                    setMapDepth('town');
                } else if (mapDepth === 'town' && currentZone === selectedZone) {
                    selectedTownPolygonRef.current = layer; 
                    setSelectedTown(townName);
                    setMapDepth('uc');
                }
            }
        });
    };

    const onEachUcFeature = (feature, layer) => {
        const ucTitle = getUcLabelName(feature);
        layer.bindTooltip(ucTitle.toUpperCase(), {
            permanent: true,
            direction: 'center',
            className: 'bg-rose-950/95 text-rose-100 font-black text-[9px] px-1.5 py-0.5 rounded border border-rose-500/40 tracking-wide pointer-events-none shadow-lg'
        });
    };

    // FIXED FILTER ENGINE: Matches via text prefix first to prevent neighboring town leakages
    const filterUcByTownBoundary = (ucGeoJson) => {
        if (!ucGeoJson || !selectedTown) return { type: "FeatureCollection", features: [] };
        
        // Normalize strings (e.g., "manghopir town" -> "manghopir" or "mangopir")
        const currentTargetClean = selectedTown.toLowerCase().replace('town', '').trim();
        const baseNameRoot = currentTargetClean.substring(0, 5); // Grabs root like "mangh" or "mango"
        
        const townLayer = selectedTownPolygonRef.current;
        
        const filteredFeatures = ucGeoJson.features.filter(ucFeature => {
            const ucLabel = getUcLabelName(ucFeature).toLowerCase();
            
            // Step 1: Text Validation Strategy (Ensures zero bleed-through from neighbors)
            if (ucLabel.includes(currentTargetClean) || ucLabel.includes(baseNameRoot)) {
                return true;
            }

            // Step 2: Spatial Fallback strategy if text validation didn't hit but it sits perfectly inside boundary
            if (!townLayer) return false;
            try {
                let coords = ucFeature.geometry.coordinates;
                while (Array.isArray(coords) && Array.isArray(coords[0])) {
                    coords = coords[0];
                }
                const leafletPoint = L.latLng(coords[1], coords[0]);
                
                // Double validation: Must be inside boundary AND must not explicitly mention a different town name
                const isInsideGeo = townLayer.getBounds().contains(leafletPoint);
                const belongsToAnotherTown = Object.keys(TOWN_TO_ZONE_MAP).some(otherTown => {
                    const otherClean = otherTown.replace('town', '').trim();
                    return otherClean !== currentTargetClean && ucLabel.includes(otherClean);
                });

                return isInsideGeo && !belongsToAnotherTown;
            } catch (e) {
                return false;
            }
        });

        return { type: "FeatureCollection", features: filteredFeatures };
    };

    const handleBreadcrumbClick = (depth) => {
        if (depth === 'zone') {
            setSelectedZone(null);
            setSelectedTown(null);
            selectedTownPolygonRef.current = null;
            setMapDepth('zone');
        } else if (depth === 'town') {
            setSelectedTown(null);
            setMapDepth('town');
        }
    };

    return (
        <div className="bg-[#0c1122] border border-slate-800 rounded-xl p-5 space-y-4 shadow-2xl">
            
            {/* Upper Action Interface Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBackToDashboard}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black uppercase tracking-wider px-3 py-2 rounded-lg transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> Exit Map
                    </button>
                    <div>
                        <h2 className="text-sm font-black tracking-wide text-white uppercase flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-cyan-400" />
                            {mapDepth === 'zone' ? "Karachi Administrative Zone Layout" : mapDepth === 'town' ? `${selectedZone} - Active Towns` : `${selectedTown?.toUpperCase()} - Verified Union Councils (UC)`}
                        </h2>
                    </div>
                </div>

                {/* Satellite/Street Map verification switch */}
                <button
                    onClick={() => setVerificationMode(!verificationMode)}
                    className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider px-3 py-2 rounded-lg transition-all border ${
                        verificationMode 
                            ? 'bg-amber-500 text-slate-950 border-amber-400' 
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                >
                    {verificationMode ? <Layers className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {verificationMode ? "Standard Dark Map" : "Verify with Street Map"}
                </button>

                {/* Dynamic Legend Palette */}
                <div className="flex items-center gap-4 bg-[#12182c] border border-slate-800 px-4 py-2 rounded-lg text-xs font-bold">
                    {Object.keys(ZONE_COLORS).map(z => (
                        <div key={z} className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ZONE_COLORS[z] }} />
                            <span className={selectedZone === z ? "text-white font-black" : "text-slate-400"}>{z}</span>
                        </div>
                    ))}
                </div>

                {/* Dashboard Navigation Controls */}
                <div className="text-xs font-bold text-slate-400 flex items-center gap-2 bg-[#12182c] border border-slate-800 px-3 py-1.5 rounded-lg">
                    <span className={`cursor-pointer uppercase ${mapDepth === 'zone' ? 'text-cyan-400 font-black' : 'hover:text-white'}`} onClick={() => handleBreadcrumbClick('zone')}>Karachi</span>
                    {selectedZone && <> <span className="text-slate-600 font-medium">&gt;</span> <span className={`cursor-pointer uppercase ${mapDepth === 'town' ? 'text-cyan-400 font-black' : 'hover:text-white'}`} onClick={() => handleBreadcrumbClick('town')}>{selectedZone}</span> </>}
                    {selectedTown && <> <span className="text-slate-600 font-medium">&gt;</span> <span className="text-rose-400 font-black uppercase">{selectedTown}</span> </>}
                </div>
            </div>

            {/* Main Interactive Leaflet Map Window */}
            <div className="h-[620px] w-full rounded-lg overflow-hidden border border-slate-800 relative bg-[#060913]">
                <MapContainer center={KarachiCenter} zoom={11} className="h-full w-full" scrollWheelZoom={true}>
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url={verificationMode 
                            ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        }
                    />

                    {/* Layer 1 & 2: Towns Polygon Render Matrix */}
                    {townData && (
                        <GeoJSON 
                            key={`towns-${mapDepth}-${selectedZone}-${verificationMode}`}
                            data={townData}
                            style={styleFeature}
                            onEachFeature={onEachTownFeature}
                        />
                    )}

                    {/* Single Central Floating Title Overlays for Macro Zones */}
                    {mapDepth === 'zone' && zoneCenters.map(zc => (
                        <Marker key={zc.zone} position={zc.center} icon={invisibleIcon}>
                            <Tooltip permanent direction="center" className="bg-slate-900 border-2 border-cyan-500 text-white font-black text-xs px-2.5 py-1 rounded-md shadow-2xl tracking-widest text-center">
                                <div className="flex items-center gap-1.5 justify-center">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ZONE_COLORS[zc.zone] }} />
                                    {zc.zone}
                                </div>
                            </Tooltip>
                        </Marker>
                    ))}

                    {/* Layer 3: Filtered Real KML-Labeled Union Councils */}
                    {ucData && mapDepth === 'uc' && (
                        <GeoJSON 
                            key={`ucs-${selectedTown}`}
                            data={filterUcByTownBoundary(ucData)}
                            style={{ fillColor: '#e11d48', weight: 1.5, color: '#ffffff', fillOpacity: 0.65, opacity: 1 }}
                            onEachFeature={onEachUcFeature}
                        />
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

export default ZoneComplaintMap;