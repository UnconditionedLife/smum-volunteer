import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, TextField, MenuItem, Button, Select, InputLabel, FormControl } from '@mui/material';
import SmumLogo from '../assets/SmumLogo';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useLang } from '../utils/languageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { getCookie } from '../utils/api';
import { Register } from './Register';
import { SignInOut } from './SignInOut';

// Extend dayjs with the plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export default function Home({ isShrunk }) {
    const { lang } = useLang();
    const { t } = useLang();

    // URL Values XXX
    // const params = useParams();
    // console.log("params", params)
    // const initialActivityId = params.activityId || '0';
    
    // State
    const [knownName, setKnownName] = useState('');

    function readCookies() {
        const nameCookie = getCookie("volunteerName");
        setKnownName(nameCookie);
    }

    useEffect(() => {
        readCookies();
    }, []);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', maxWidth:'100vw', minHeight: 'calc(100vh - 40px)', overflow: 'hidden'}}  >
            <Box component="header" >
                <Box>
                    <LanguageSwitcher/>
                    <SmumLogo className="header-logo"/>
                    {isShrunk && <h1 className="ministry-name">Santa Maria Urban Ministry</h1>}
                </Box>
            </Box>
            <Box component="main" sx={{ flexGrow: 1, overflowY: 'auto', px: 2, }}>
                { knownName ? <SignInOut onUpdate={readCookies} /> : <Register onUpdate={readCookies} /> }        
            </Box>
            <Box component="footer" sx={{ pt: 1, textAlign: 'center' }}>
                <Typography fontSize='0.8em' color='#888'> 
                    &copy; {new Date().getFullYear()} Santa Maria Urban Ministry
                </Typography>
            </Box>
        </Box>
    );
}