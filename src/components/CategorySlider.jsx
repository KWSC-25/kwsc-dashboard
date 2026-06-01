import React, { useState, useEffect } from 'react';

const CategorySlider = ({ categories = [] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Filter out categories where all columns are absolute zeros to keep the slider clean
    const activeCategories = categories.filter(cat => 
        ((cat.created || 0) + (cat.assigned || 0) + (cat.completed || 0) + (cat.cancelled || 0) + (cat.pending || 0)) > 0
    );

    // Auto-slide loop configuration (Every 30 seconds)
    useEffect(() => {
        if (activeCategories.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % activeCategories.length);
        }, 30000);

        return () => clearInterval(interval);
    }, [activeCategories.length]);

    // Bounds safety reset
    useEffect(() => {
        if (currentIndex >= activeCategories.length && activeCategories.length > 0) {
            setCurrentIndex(0);
        }
    }, [activeCategories.length, currentIndex]);

    if (activeCategories.length === 0) return null;

    const currentCat = activeCategories[currentIndex] || activeCategories[0];

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? activeCategories.length - 1 : prev - 1));
    };

    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % activeCategories.length);
    };

    return (
        <div className="category-premium-slider" style={{
            display: 'flex',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
            border: '2px solid #00f2ff',
            borderRadius: '6px',
            padding: '12px 24px', // Increased padding for a larger box height
            gap: '20px',
            boxShadow: '0 0 20px rgba(0, 242, 255, 0.35)',
            minWidth: '650px', // Increased box width to make it a bigger widget
            height: '54px', // explicit spacious height alignment
            boxSizing: 'border-box'
        }}>
            {/* Left Action Arrow Control */}
            <button type="button" onClick={handlePrev} style={arrowStyle}>&#9664;</button>

            {/* Main Content Info Tracking Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flex: 1, fontFamily: 'sans-serif' }}>
                <span style={{ 
                    color: '#FFF200', 
                    fontWeight: '800', 
                    fontSize: '16px', // Increased text size
                    letterSpacing: '0.6px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    borderRight: '1px solid rgba(255,255,255,0.25)',
                    paddingRight: '18px'
                }}>
                    {currentCat.name}
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '15px' }}> {/* Increased text size */}
                    <span style={metricStyle}>Total Created: <strong style={{ color: '#00f2ff', fontSize: '16px' }}>{currentCat.created}</strong></span>
                    <span style={metricStyle}>Driver Assigned: <strong style={{ color: '#ff9800', fontSize: '16px' }}>{currentCat.assigned}</strong></span>
                    <span style={metricStyle}>Total Completed: <strong style={{ color: '#4caf50', fontSize: '16px' }}>{currentCat.completed}</strong></span>
                    <span style={metricStyle}>Total Cancelled: <strong style={{ color: '#a0aec0', fontSize: '16px' }}>{currentCat.cancelled}</strong></span>
                    <span style={metricStyle}>Total Pending: <strong style={{ color: '#f44336', fontSize: '16px' }}>{currentCat.pending}</strong></span>
                </div>
            </div>

            {/* Right Action Arrow Control */}
            <button type="button" onClick={handleNext} style={arrowStyle}>&#9654;</button>
        </div>
    );
};

const arrowStyle = {
    background: 'none',
    border: 'none',
    color: '#00f2ff',
    cursor: 'pointer',
    fontSize: '18px', // Bigger navigation symbols
    padding: '0 6px',
    outline: 'none',
    userSelect: 'none',
    fontWeight: 'bold',
    transition: 'transform 0.1s ease'
};

const metricStyle = {
    color: '#cbd5e1',
    fontWeight: '700', // Made text slightly bolder for high contrast readability
    letterSpacing: '0.3px',
    whiteSpace: 'nowrap'
};

export default CategorySlider;