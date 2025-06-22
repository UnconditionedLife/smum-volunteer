import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home';
import SplashScreen from './pages/SplashScreen';
import NotFound from './pages/NotFound';
import SmumLogo from "./assets/SmumLogo.jsx";
import './App.css'
import theme from './theme.jsx';
import { ThemeProvider } from '@mui/material';
import { LanguageProvider } from './utils/languageContext.jsx';


function App() {
    const [showSplash, setShowSplash] = useState(true);
    const [isShrunk, setIsShrunk] = useState(false);

    useEffect(() => {
        const shrinkTimer = setTimeout(() => setIsShrunk(true), 1200);
        const splashTimer = setTimeout(() => setShowSplash(false), 2000);
    
        return () => {
          clearTimeout(shrinkTimer);
          clearTimeout(splashTimer);
        }
      }, [])

    return (
        <ThemeProvider theme={theme}>
            <LanguageProvider>
                <div className="app-container">
                    {/* Always render logo, animate with class */}
                    
                { showSplash ? (
                    <SplashScreen onFinish={() => setShowSplash(false)} />
                ) : (
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<Home isShrunk={isShrunk} />} />
                            {/* <Route path="/activity/:activityId" element={<Activity />} /> */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </BrowserRouter>
                )}
                </div>
            </LanguageProvider>
        </ThemeProvider>
    );
}

export default App
