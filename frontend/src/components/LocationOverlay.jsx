import React from 'react';
import { useTranslation } from 'react-i18next';

const LocationOverlay = ({ address, loading, label }) => {
    const { t } = useTranslation();

    return (
        <div className="location-overlay">
            <div className="location-box">
                <div className="location-icon">📍</div>
                <div className="location-text">
                    <span className="location-label">{label || t('playerPage.currentLocation')}</span>
                    <h2 className="location-name">
                        {loading ? t('common.loading') : (address || t('playerPage.currentLocation'))}
                    </h2>
                </div>
            </div>
        </div>
    );
};

export default LocationOverlay;
