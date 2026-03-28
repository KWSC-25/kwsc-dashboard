import { hmpDb } from "../db.js";

const formatTo12Hr = (time24) => {
    if (!time24) return null;
    const [hrs, mins] = time24.split(':');
    let h = parseInt(hrs);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${mins} ${ampm}`;
};

export const getHydrantOperationalStatus = async (req, res) => {
    try {
        const query = `
            SELECT h.id, h.name, h.color, l.slots
            FROM hydrants h
            LEFT JOIN hydrant_status_logs l ON h.id = l.hydrant_id AND l.entry_date = '2026-03-26'
            WHERE h.id IN (1, 2, 3, 4, 5, 6, 7)
            ORDER BY h.id ASC`;

        const [rows] = await hmpDb.execute(query);
        const hasEntriesToday = rows.some(r => r.slots !== null);

        const now = new Date('2026-03-26T10:00:00');
        const currentHrs = now.getHours();
        const currentMins = now.getMinutes();
        const currentTimeSlot24 = `${String(currentHrs).padStart(2, '0')}:${currentMins < 30 ? '00' : '30'}`;

        const data = rows.map(row => {
            let status = 'ACTIVE';
            let startTime = null;
            let cctvOffSince = null;
            let customAlert = null;
            
            if (row.slots) {
                const slots = typeof row.slots === 'string' ? JSON.parse(row.slots) : row.slots;
                
                // Track time slots for filling logic
                const timeSlots = [];
                for (let h = 0; h <= currentHrs; h++) {
                    for (let m of ['00', '30']) {
                        const ts = `${String(h).padStart(2, '0')}:${m}`;
                        timeSlots.push(ts);
                        if (ts === currentTimeSlot24) break;
                    }
                    if (timeSlots[timeSlots.length - 1] === currentTimeSlot24) break;
                }

                if (slots[currentTimeSlot24]?.s === 'CCTV_OFF') {
                    status = 'CCTV_OFF';
                    // Find when the CCTV first went OFF by looking back
                    for (let i = timeSlots.length - 1; i >= 0; i--) {
                        if (slots[timeSlots[i]]?.s === 'CCTV_OFF') {
                            cctvOffSince = timeSlots[i];
                        } else {
                            break;
                        }
                    }
                } else {
                    let lastTransition = null; 
                    for (const ts of timeSlots) {
                        const entry = slots[ts];
                        if (entry?.s === 'FILLING_START' || entry?.s === 'FILLING_STOP') {
                            lastTransition = entry.s;
                            startTime = entry.e || null;
                        }
                    }

                    if (lastTransition === 'FILLING_STOP') {
                        const currentEntry = slots[currentTimeSlot24];
                        if (!currentEntry || currentEntry.s === 'OPERATIONAL' || currentEntry.s === null) {
                            status = 'UNKNOWN';
                            customAlert = `NO ENTRY FOR FILLING START AFTER FILLING STOP`;
                        } else {
                            status = 'FILLING_STOP';
                        }
                    } else if (lastTransition === 'FILLING_START') {
                        status = 'FILLING_START';
                    }
                }
            }

            return {
                id: row.id,
                name: row.name,
                color: row.color,
                currentStatus: status,
                startTime: startTime,
                cctvOffSince: cctvOffSince,
                customAlert: customAlert,
                displayStartTime: formatTo12Hr(startTime),
                displayCctvOffSince: formatTo12Hr(cctvOffSince),
                displayTimeSlot: formatTo12Hr(currentTimeSlot24),
                timeSlot: currentTimeSlot24 
            };
        });

        res.json({ success: true, hasEntriesToday, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};