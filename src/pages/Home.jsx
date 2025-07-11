import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { Box, Typography, TextField, MenuItem, Button, Select, InputLabel, FormControl } from '@mui/material';
import SmumLogo from '../assets/SmumLogo';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useLang } from '../utils/languageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { generateVolunteerId } from '../utils/generateVolunteerId';
import { getActivities, getPrograms, logAction, registerVolunteer } from '../utils/api';
import { prepareActivitiesList, prepareProgramsList } from '../utils/buildLists';
import { Register } from './Register';

// Extend dayjs with the plugins
dayjs.extend(utc);
dayjs.extend(timezone);

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

// I THINK WE WILL WANT TO STORE: VOLUNTEER FIRST NAME, VOLUNTEER-ID, LAST CHECK-IN DATE/TIME
function setCookie(name, value, days = 1) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

export default function Home({ isShrunk }) {
    const { lang } = useLang();
    const { t } = useLang();

    // URL Values
    const params = useParams();
    const initialActivityId = params.activityId || '0';
    
    // Volunteer info
    const [volunteerId, setVolunteerId]= useState('');

    // Program
    const [programId, setProgram] = useState('0');
    const [rawPrograms, setRawPrograms] = useState([]);
    const [programs, setPrograms] = useState([])
  
    // Activity & Time
    const [activityId, setActivity] = useState(initialActivityId);
    const [rawActivities, setRawActivities] = useState([]);
    const [activities, setActivities] = useState([])


    //   const [time, setTime] = useState(() => new Date().toISOString().slice(0, 16));
    const [time, setTime] = useState(() =>
        dayjs().tz('America/Los_Angeles').format('HH:mm')
    );

    // State
    const [checkedIn, setCheckedIn] = useState(false);
    const [knownName, setKnownName] = useState('');
    const [statusMsg, setStatusMsg] = useState('');

    function readCookies() {
        const checkedInCookie = getCookie(getTodayKey());
        setCheckedIn(!!checkedInCookie);
        setStatusMsg(checkedInCookie ? t('checkedIn') : t('checkedOut'));

        const nameCookie = getCookie(getNameKey());
        if (nameCookie) 
            setKnownName(nameCookie);
    }

    // Get & Set Programs and Activities Lists
    useEffect(() => {
        getPrograms()
            .then( programsList => {
                setRawPrograms(programsList)
            })
            .catch(console.error);

        getActivities()
            .then( activitiesList => {

                // const sorted = activities.sort((a, b) => {
                //     // Sort CoreActivity descending (true first)
                //     if (a.CoreActivity !== b.CoreActivity) {
                //       return a.CoreActivity ? -1 : 1;
                //     }
                //     // Then sort alphabetically by ActivityName_en
                //     return a.ActivityName_en.localeCompare(b.ActivityName_en);
                // });
                  
                setRawActivities(activitiesList)
                console.log(activitiesList)
            } )
            .catch(console.error);
    }, []);

    useEffect(() => {
        // Sort + localize programs when lang or data changes
        if (!rawPrograms.length) return;
        const cleanPrograms = prepareProgramsList(rawPrograms, lang)

        console.log(cleanPrograms)

        setPrograms(cleanPrograms);
    }, [lang, rawPrograms]);

    useEffect(() => {
        if (!rawActivities.length) return;
        const cleanActivities = prepareActivitiesList(rawActivities, lang)
        setActivities(cleanActivities);
    }, [lang, rawActivities]);


    useEffect(() => {
        readCookies();
        // setTime(new Date().toISOString().slice(0, 16));
        setTime(dayjs().tz('America/Los_Angeles').format('HH:mm'));
    }, []);

    useEffect(() => {
        setStatusMsg(checkedIn ? t('checkedIn') : t('checkedOut'));
    }, [checkedIn]);

    const handleSignIn = async () => {
        setCheckedIn(true);
        setStatusMsg( t('checkedIn') );
    };

    const handleSignOut = async () => {
        setCookie(getTodayKey(), '', -1); // Remove check-in cookie
        setCheckedIn(false);
        setStatusMsg( t('checkedOut') );
        const checkInResult = await logAction(volunteerId, "check-out", activityId, programId)
        // Name cookie is NOT cleared here
        // Optionally, save sign-out info somewhere
    };

    const handleNewUser = () => {
        setCookie(getNameKey(), '', -1); // Remove name cookie
        setKnownName('');
    };

    function doSignInOut() {
        return (
            <>
                {/* Volunteer Info Section */}
                <Box component="section">
                    <Typography fontSize="20px" color='#6FADAF'>{t('volunteerUpper')}</Typography>
                    <Box mb={8}>
                        <Typography variant="h6">Welcome, {knownName}!</Typography>
                        <Typography variant="subtitle1" fontSize="12px" color="primary">{statusMsg}</Typography>
                        {!checkedIn && (
                            <Button variant="text" color="secondary" onClick={handleNewUser} sx={{ mt: 1 }}>
                                Log in as a different user
                            </Button>
                        )}
                    </Box>
                </Box>

                {/* Program - XXX remove this and only set via admin interface */}
                <Box component="section" mt={4} mb={2}>
                    <Typography fontSize="20px" color='#6FADAF'>{ t('programUpper') }</Typography>
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="activity-label">{ t('program') }</InputLabel>
                        <Select
                        labelId="activity-label"
                        value={ programId }
                        label={ t('program') }
                        onChange={e => setProgram(e.target.value)}
                        margin="dense" 
                        size="small"
                        sx={{ 
                            mb: .5,
                            backgroundColor: 'rgba(255, 255, 255, 0.44)',
                            borderRadius: '4px' 
                        }}
                        >
                        {programs.map(prog => (
                            <MenuItem key={prog.programId} value={prog.ProgramId}>{prog.ProgramName}</MenuItem>
                        ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* Activity & Time Section */}           
                <Box component="section" mt={4} mb={2}>
                    <Typography fontSize="20px" color='#6FADAF'>{ t('activityTimeUpper') }</Typography>
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="activity-label">{ t('activity') }</InputLabel>
                        <Select
                        labelId="activity-label"
                        value={ activityId }
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
                        {activities.map(act => (
                            <MenuItem key={act.ActivityId} value={act.ActivityId}>{ act[`ActivityName_${lang}`] }</MenuItem>
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
                        <Button 
                            variant="contained" 
                            color="secondary" 
                            disabled={activityId === '0' || programId === '0'}
                            onClick={handleSignOut} 
                            fullWidth
                        >
                            { t('signOut') }
                        </Button>
                    ) : (
                        <Button 
                            variant="contained" 
                            color="primary"
                            disabled={activityId === '0' || programId === '0'}
                            onClick={handleSignIn} 
                            fullWidth
                        >
                            { t('signIn') }
                        </Button>
                    )}
                </Box>
            </>
        );
    }

    const ready = activityId != 0;

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
            <Box component="main" sx={{ flexGrow: 1, overflowY: 'auto', px: 2, }}>
                { knownName ? doSignInOut() : <Register onUpdate={readCookies} /> }        
            </Box>
            <Box component="footer" sx={{ pt: 1, textAlign: 'center' }}>
                <Typography fontSize='0.8em' color='#888'> 
                &copy; {new Date().getFullYear()} Santa Maria Urban Ministry
                </Typography>
            </Box>
        </Box>
    );
}