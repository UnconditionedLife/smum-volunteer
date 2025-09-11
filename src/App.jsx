// App.jsx
import { useState } from 'react';
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

  return (
    <ThemeProvider theme={theme}>
      <LanguageProvider>
        <div className={`app-container ${showSplash ? "allow-overflow" : ""}`}>
            {/* Router always mounted */}
            <BrowserRouter>
                <Routes>
                <Route path="/" element={<Home isShrunk={isShrunk} />} />
                <Route path="/activity/:activityId" element={<Home isShrunk={isShrunk} />} />
                <Route path="/nocheckin" element={<Home isShrunk={isShrunk} noCkeckin={true} />} />
                <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>

            {/* Splash overlays the app, then removes itself */}
            {showSplash && (
                <SplashScreen
                    onShrinkEnd={() => setIsShrunk(true)}
                    onFinish={() => setShowSplash(false)}
                />
            )}
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}
export default App