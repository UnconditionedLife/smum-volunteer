import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Box, Typography, TextField, MenuItem, Button, Select, InputLabel, FormControl } from '@mui/material';
import SmumLogo from '../assets/SmumLogo';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useLang } from '../languageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

// Extend dayjs with the plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const ACTIVITIES = [
  'Warehouse Duty',
  'Frontdesk Duty',
  'Cleanup Duty',
];

function getTodayKey() {
  const today = new Date();
  return `volunteer_checked_in_${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`;
}

function getNameKey() {
  const today = new Date();
  return `volunteer_name_${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function setCookie(name, value, days = 1) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

export default function Home({ isShrunk }) {
    const { t } = useLang();
    
    // Volunteer info
    const [name, setName] = useState('');
    const [telephone, setTelephone] = useState('');
    const [email, setEmail] = useState('');
  
    // Activity & time
    const [activity, setActivity] = useState(ACTIVITIES[0]);

    //   const [time, setTime] = useState(() => new Date().toISOString().slice(0, 16));
    const [time, setTime] = useState(() =>
        dayjs().tz('America/Los_Angeles').format('HH:mm')
    );

    // State
    const [checkedIn, setCheckedIn] = useState(false);
    const [knownName, setKnownName] = useState('');
    const [statusMsg, setStatusMsg] = useState('');

    useEffect(() => {
        const checkedInCookie = getCookie(getTodayKey());
        setCheckedIn(!!checkedInCookie);
        // setTime(new Date().toISOString().slice(0, 16));
        setTime(dayjs().tz('America/Los_Angeles').format('HH:mm'))
        const nameCookie = getCookie(getNameKey());
        if (nameCookie) setKnownName(nameCookie);
        setStatusMsg(checkedInCookie ? t('checkedIn') : t('checkedOut'));
    }, []);

    useEffect(() => {
        setStatusMsg(checkedIn ? t('checkedIn') : t('checkedOut'));
    }, [checkedIn]);

  const handleSignIn = () => {
    setCookie(getTodayKey(), '1');
    setCookie(getNameKey(), name || knownName);
    setCheckedIn(true);
    setKnownName(name || knownName);
    setStatusMsg( t('checkedIn') );
    // Optionally, save volunteer info somewhere
  };

  const handleSignOut = () => {
    setCookie(getTodayKey(), '', -1); // Remove check-in cookie
    setCheckedIn(false);
    setStatusMsg( t('checkedOut') );
    // Name cookie is NOT cleared here
    // Optionally, save sign-out info somewhere
  };

  const handleNewUser = () => {
    setCookie(getNameKey(), '', -1); // Remove name cookie
    setKnownName('');
    setName('');
    setTelephone('');
    setEmail('');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', maxWidth:'100vw', minHeight: 'calc(100vh - 40px)', overflow: 'hidden'}}  >
        
        <Box component="header" >
            <Box>
                <LanguageSwitcher/>
                {/* <Box onClick={(e) => setLang(e.target.value)}>ENGLISH</Box>
                <Box>ESPAñOL</Box> */}
                <SmumLogo className="header-logo"/>
                {isShrunk && <h1 className="ministry-name">Santa Maria Urban Ministry</h1>}
            </Box>
        </Box>
        <Box component="main" 
            sx={{ flexGrow: 1,
                overflowY: 'auto',
                px: 2,
              }}>
        {/* Volunteer Info Section */}
        <Box component="section">
          <Typography fontSize="20px" color='#6FADAF'>{t('volunteerUpper')}</Typography>
          <Typography variant="subtitle1" fontSize="12px" color="primary">{statusMsg}</Typography>
          {knownName ? (
            <Box mb={8}>
              <Typography variant="h6">Welcome, {knownName}!</Typography>
              {!checkedIn && (
                <Button variant="text" color="secondary" onClick={handleNewUser} sx={{ mt: 1 }}>
                  Log in as a different user
                </Button>
              )}
            </Box>
          ) : (
            <>
              <TextField label={ t('name') } value={name} onChange={e => setName(e.target.value)} fullWidth margin="dense" size="small" 
                sx={{ 
                    mb: .5,
                    backgroundColor: 'rgba(255, 255, 255, 0.44)',
                    borderRadius: '4px' 
                }} />
              <TextField label={ t('telephone') } value={telephone} onChange={e => setTelephone(e.target.value)} fullWidth margin="dense" size="small" 
                sx={{ 
                    mb: .5,
                    backgroundColor: 'rgba(255, 255, 255, 0.44)',
                    borderRadius: '4px' 
                }} />
              <TextField label={ t('email') } value={email} onChange={e => setEmail(e.target.value)} fullWidth margin="dense" size="small" 
                sx={{ 
                    mb: .5,
                    backgroundColor: 'rgba(255, 255, 255, 0.44)',
                    borderRadius: '4px' 
                }} />
            </>
          )}
        </Box>
        {/* Activity & Time Section */}
        <Box component="section" mt={4} mb={2}>
          <Typography fontSize="20px" color='#6FADAF'>{ t('activityTimeUpper') }</Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel id="activity-label">{ t('activity') }</InputLabel>
            <Select
              labelId="activity-label"
              value={activity}
              label={ t('activity') }
              onChange={e => setActivity(e.target.value)}
              margin="dense" 
              size="small"
              sx={{ 
                mb: .5,
                backgroundColor: 'rgba(255, 255, 255, 0.44)',
                borderRadius: '4px' 
            }}
            >
              {ACTIVITIES.map(act => (
                <MenuItem key={act} value={act}>{act}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={ checkedIn ? t('checkoutTime') : t('checkinTime') }
            type="time"
            value={ time }
            onChange={e => setTime(e.target.value)}
            fullWidth
            margin="dense" 
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{
                mb: 0.5,
                backgroundColor: 'rgba(255, 255, 255, 0.44)',
                borderRadius: '4px',
                '& input': {
                  textAlign: 'center'
                }
              }}
          />
        </Box>
        {/* Confirmation Section */}
        <Box component="section">
          {checkedIn ? (
            <Button variant="contained" color="secondary" onClick={handleSignOut} fullWidth>
              { t('signOut') }
            </Button>
          ) : (
            <Button variant="contained" color="primary" onClick={handleSignIn} fullWidth>
              { t('signIn') }
            </Button>
          )}
        </Box>
      </Box>
      <Box component="footer" sx={{ pt: 1, textAlign: 'center' }}>
        <Typography fontSize='0.8em' color='#888'> 
          &copy; {new Date().getFullYear()} Santa Maria Urban Ministry
        </Typography>
      </Box>
    </Box>
  );
}