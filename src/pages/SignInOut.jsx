import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, TextField, MenuItem, Button, Select, InputLabel, FormControl } from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useLang } from '../utils/languageContext';
import { getCookie, setCookie, deleteCookie, getActivities, logAction } from '../utils/api';
import { prepareActivitiesList } from '../utils/buildLists';

export function SignInOut(props) {
    const onUpdate = props.onUpdate;
    const { lang } = useLang();
    const { t } = useLang();

    // URL Values
    const params = useParams();
    
    // Volunteer info
    const [volunteerId, setVolunteerId]= useState('');

    // Activity & Time
    const [activityId, setActivity] = useState(0);
    const [rawActivities, setRawActivities] = useState([]);
    var activities;

    //   const [time, setTime] = useState(() => new Date().toISOString().slice(0, 16));
    const [time, setTime] = useState(() =>
        dayjs().tz('America/Los_Angeles').format('HH:mm')
    );

    // State
    const [checkedIn, setCheckedIn] = useState(false);
    const [knownName, setKnownName] = useState('');

    function readCookies() {
        const activityCookie = getCookie("volunteerActivity");
        if (activityCookie) {
            setCheckedIn(true);
            setActivity(activityCookie);
        } else {
            setCheckedIn(false);
            setActivity(params.activityId || 0);
        }

        const nameCookie = getCookie("volunteerName");
        if (nameCookie) 
            setKnownName(nameCookie);

        const idCookie = getCookie("volunteerId");
        if (idCookie)
            setVolunteerId(idCookie);
    }

    // Get & Set Activities List
    useEffect(() => {
        getActivities()
            .then( activitiesList => {
                setRawActivities(activitiesList)
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        readCookies();
        // setTime(new Date().toISOString().slice(0, 16));
        setTime(dayjs().tz('America/Los_Angeles').format('HH:mm'));
    }, []);

    const handleSignIn = async () => {
        setCheckedIn(true);
        setCookie("volunteerActivity", activityId);
        await logAction(volunteerId, "check-in", activityId, time)
            .catch(console.error);
    };

    const handleSignOut = async () => {
        deleteCookie("volunteerActivity");
        setCheckedIn(false);
        await logAction(volunteerId, "check-out", activityId, time)
            .catch(console.error);
    };

    const handleNewUser = () => {
        deleteCookie("volunteerName");
        deleteCookie("volunteerId");
        deleteCookie("volunteerActivity");
        setKnownName('');
        onUpdate();
    };

    if (rawActivities.length > 0)
        activities = prepareActivitiesList(rawActivities, lang, params.activityId);
    else
        return (<></>);

    return (
        <>
            {/* Volunteer Info Section */}
            <Box component="section">
                <Box mb={8}>
                    <Typography variant="h6">{ t('welcome') }, {knownName}!</Typography>
                    <Typography variant="subtitle1" fontSize="12px" color="primary">{checkedIn ? t('checkedIn') : t('checkedOut')}</Typography>
                    {!checkedIn && (
                        <Button variant="text" color="secondary" onClick={handleNewUser} sx={{ mt: 1 }}>
                            { t('logInAsDiff') }
                        </Button>
                    )}
                </Box>
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
                        disabled={checkedIn}
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
                        disabled={activityId == 0}
                        onClick={handleSignOut} 
                        fullWidth
                    >
                        { t('signOut') }
                    </Button>
                ) : (
                    <Button 
                        variant="contained" 
                        color="primary"
                        disabled={activityId == 0}
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