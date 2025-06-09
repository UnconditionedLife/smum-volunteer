import React, { useEffect, useState } from 'react';
import SmumLogo from "../assets/SmumLogo.jsx";
import { useLang } from '../languageContext';

export default function SplashScreen({ onFinish }) {
    const { t } = useLang();
    const [isShrinking, setIsShrinking] = useState(false);

    useEffect(() => {
        const shrinkTimer = setTimeout(() => setIsShrinking(true), 1800); // start shrinking
        const finishTimer = setTimeout(() => onFinish(), 3000); // then finish

        return () => {
            clearTimeout(shrinkTimer);
            clearTimeout(finishTimer);
        };
    }, [onFinish]);

    return (
        <div className="splash-screen">
        <div className="splash-content">
            <SmumLogo className={`splash-logo ${isShrinking ? 'shrink-to-header' : ''}`} />
            <div className="splash-text">
                <h3>Welcome to the Volunteer Portal</h3>
                <h3>Bienvenido al Portal de Voluntarios</h3>
                <div mt="-10px" ><i>Making a difference, one volunteer at a time.</i></div>
                <div mt="-10px" ><i>Marcando la diferencia, un voluntario a la vez.</i></div>
            </div>
        </div>
    </div>
    );
}