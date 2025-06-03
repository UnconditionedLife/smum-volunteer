import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Box, Typography, TextField, MenuItem, Button, Select, InputLabel, FormControl } from '@mui/material';

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

export default function Home() {
  // Volunteer info
  const [name, setName] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  // Activity & time
  const [activity, setActivity] = useState(ACTIVITIES[0]);
  const [time, setTime] = useState(() => new Date().toISOString().slice(0, 16));
  // State
  const [checkedIn, setCheckedIn] = useState(false);
  const [knownName, setKnownName] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const checkedInCookie = getCookie(getTodayKey());
    setCheckedIn(!!checkedInCookie);
    setTime(new Date().toISOString().slice(0, 16));
    const nameCookie = getCookie(getNameKey());
    if (nameCookie) setKnownName(nameCookie);
    setStatusMsg(checkedInCookie ? 'You are currently checked in.' : 'You are currently checked out.');
  }, []);

  useEffect(() => {
    setStatusMsg(checkedIn ? 'You are currently checked in.' : 'You are currently checked out.');
  }, [checkedIn]);

  const handleSignIn = () => {
    setCookie(getTodayKey(), '1');
    setCookie(getNameKey(), name || knownName);
    setCheckedIn(true);
    setKnownName(name || knownName);
    setStatusMsg('You are currently checked in.');
    // Optionally, save volunteer info somewhere
  };

  const handleSignOut = () => {
    setCookie(getTodayKey(), '', -1); // Remove check-in cookie
    setCheckedIn(false);
    setStatusMsg('You are currently checked out.');
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
    <Box component="container"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'wrap',
        alignContent: 'space-between'
      }}
    >
      <Box component="header" >
        <Header/>
      </Box>
      <Box component="main" mt="40px">
        {/* Volunteer Info Section */}
        <Box component="section" mb={3}>
          <h3>VOLUNTEER</h3>
          <Typography variant="subtitle1" color="primary">{statusMsg}</Typography>
          {knownName ? (
            <>
              <Typography variant="h6">Welcome, {knownName}!</Typography>
              {!checkedIn && (
                <Button variant="text" color="primary" onClick={handleNewUser} sx={{ mt: 1 }}>
                  Log in as a different user
                </Button>
              )}
            </>
          ) : (
            <>
              <TextField label="Name" value={name} onChange={e => setName(e.target.value)} fullWidth margin="normal" />
              <TextField label="Telephone" value={telephone} onChange={e => setTelephone(e.target.value)} fullWidth margin="normal" />
              <TextField label="Email" value={email} onChange={e => setEmail(e.target.value)} fullWidth margin="normal" />
            </>
          )}
        </Box>
        {/* Activity & Time Section */}
        <Box component="section" mb={3}>
          <h3>ACTIVITY & TIME</h3>
          <FormControl fullWidth margin="normal">
            <InputLabel id="activity-label">Activity</InputLabel>
            <Select
              labelId="activity-label"
              value={activity}
              label="Activity"
              onChange={e => setActivity(e.target.value)}
            >
              {ACTIVITIES.map(act => (
                <MenuItem key={act} value={act}>{act}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={checkedIn ? 'Select time to check out' : 'Select time to check in'}
            type="datetime-local"
            value={time}
            onChange={e => setTime(e.target.value)}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </Box>
        {/* Confirmation Section */}
        <Box component="section" mb={3}>
          <h3>CONFIRMATION</h3>
          {checkedIn ? (
            <Button variant="contained" color="secondary" onClick={handleSignOut} fullWidth>
              Sign Out
            </Button>
          ) : (
            <Button variant="contained" color="primary" onClick={handleSignIn} fullWidth>
              Sign In
            </Button>
          )}
        </Box>
      </Box>
      <Box component="footer" >
        <Typography fontSize='0.8em' color='#888'> 
          &copy; {new Date().getFullYear()} Santa Maria Urban Ministry
        </Typography>
      </Box>
    </Box>
  );
}