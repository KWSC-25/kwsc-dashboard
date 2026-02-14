/* global process */
import axios from 'axios';

export const getAsaniStats = async (req, res) => {
    try {
        const token = process.env.ASANI_API_TOKEN;
        const baseUrl = process.env.ASANI_API_URL;

        // MATCH POSTMAN EXACTLY: Pulling data since Jan 1st to get the 2604+ total
        const since = "2026-01-01T00:00:00"; 
        
        let allOrders = [];
        let totalPages = 1;

        console.log(`[Asani] Starting Deep Fetch since ${since}...`);

        // Step 1: Fetch the first page to determine total pages
        const firstPage = await axios.get(`${baseUrl}`, {
            params: { since, page: 0, size: 100 },
            headers: { Authorization: `Bearer ${token}` }
        });

        const totalElements = firstPage.data.total_elements || 0;
        totalPages = Math.ceil(totalElements / 100);
        allOrders = [...(firstPage.data.data || [])];

        // Step 2: Fetch all other pages in parallel for maximum speed
        if (totalPages > 1) {
            const promises = [];
            for (let i = 1; i < totalPages; i++) {
                promises.push(
                    axios.get(`${baseUrl}`, {
                        params: { since, page: i, size: 100 },
                        headers: { Authorization: `Bearer ${token}` }
                    })
                );
            }
            const results = await Promise.all(promises);
            results.forEach(r => {
                if (r.data?.data) allOrders = allOrders.concat(r.data.data);
            });
        }

        // Step 3: Use your exact Postman Logic for counting
        let counts = {
            TOTAL: allOrders.length,
            PENDING: 0,
            DISPATCHED: 0,
            COMPLETED: 0,
            CANCELLED: 0
        };

        allOrders.forEach(order => {
            const status = (order.status || "").toUpperCase(); 
            if (status.includes('PENDING')) counts.PENDING++;
            else if (status.includes('DISPATCH')) counts.DISPATCHED++;
            else if (status.includes('COMPLETE')) counts.COMPLETED++;
            else if (status.includes('CANCEL')) counts.CANCELLED++;
        });

        console.log(`[Asani] SUCCESS: Verified Overall Total: ${counts.TOTAL}`);
        res.json(counts);

    } catch (error) {
        console.error("Asani API Error:", error.message);
        res.status(500).json({ error: "Failed to fetch aggregate stats" });
    }
};