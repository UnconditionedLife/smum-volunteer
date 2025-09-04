import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, TextField, MenuItem, Button, Select, InputLabel, FormControl } from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useLang } from '../utils/languageContext';
import { getCookie, setCookie, deleteCookie, getActivities, logAction } from '../utils/api';
import { prepareActivitiesList } from '../utils/buildLists';
import { Dialog, DialogTitle, DialogContent, IconButton, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import duration from 'dayjs/plugin/duration';
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);

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

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmData, setConfirmData] = useState({
        type: 'check-in',           // 'check-in' | 'check-out'
        timeText: '',               // e.g., "3:42 PM"
        durationText: '',           // e.g., "2h 15m" (only for check-out)
        activityName: ''            // localized activity name
    });

    const closeConfirm = () => setConfirmOpen(false);

    const formatDurationHM = (ms) => {
        const totalM = Math.max(0, Math.floor(ms / 60000));
        const h = Math.floor(totalM / 60);
        const m = totalM % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const getActivityName = (id) =>
        (activities?.find(a => a.ActivityId === id)?.[`ActivityName_${lang}`]) || '';

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
    // Set time
    useEffect(() => {
        const tick = () => setTime(dayjs().tz('America/Los_Angeles').format('h:mm'));
        tick(); // ensure it’s correct immediately
        const timer = setInterval(tick, 500);
        return () => clearInterval(timer);
    }, []);

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

        // Store precise check-in time (ISO UTC) for later duration calc
        const now = dayjs().tz('America/Los_Angeles');
        setCookie("checkInAt", now.toISOString());

        await logAction(volunteerId, "check-in", activityId, time)
            .catch(console.error);

        // Open confirmation dialog for check-in
        setConfirmData({
            type: 'check-in',
            timeText: now.format('h:mm A'),
            durationText: '',
            activityName: getActivityName(activityId),
        });
        setConfirmOpen(true);
    };

    const handleSignOut = async () => {
        deleteCookie("volunteerActivity");
        setCheckedIn(false);

        const now = dayjs().tz('America/Los_Angeles');
        const checkInISO = getCookie("checkInAt");
        let durationText = '';
        if (checkInISO) {
            const started = dayjs(checkInISO);
            const diffMs = now.diff(started);
            durationText = formatDurationHM(diffMs);
        }
        deleteCookie("checkInAt");

        await logAction(volunteerId, "check-out", activityId, time)
            .catch(console.error);
        
        // Open confirmation dialog for check-out
        setConfirmData({
            type: 'check-out',
            timeText: now.format('h:mm A'),
            durationText,
            activityName: getActivityName(activityId),
        });
        setConfirmOpen(true);
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
                    {/* // temporary edit to see if it works to keep it always visible */}
                    {/* {!checkedIn && ( */} 
                        <Button variant="text" color="secondary" onClick={handleNewUser} sx={{ mt: 1 }}>
                            { t('logInAsDiff') }
                        </Button>
                    {/* )} */}
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
                <Typography
                    variant="h3"
                    fontWeight="bold"
                    textAlign="center"
                    sx={{
                        mb: 0.5,
                        backgroundColor: 'rgba(255, 255, 255, 0.44)',
                        borderRadius: '8px',
                        p: 1,
                        color: '#000'
                    }}
                    >
                    {time}
                </Typography>
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
            
            {/* Confirmation Pop-up */}
            <Dialog open={confirmOpen} onClose={closeConfirm} fullWidth maxWidth="xs">
                <DialogTitle sx={{ pr: 6 }}>
                    <Typography
                        variant="h5"
                        fontWeight="bold"
                        textAlign="center"
                        color="primary"
                        marginTop={4}
                    >
                        {confirmData.type === 'check-in' ? t('checkedIn') : t('checkedOut')}
                    </Typography>
                    <IconButton
                        aria-label="close"
                        onClick={closeConfirm}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon fontSize="large" />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={1.25}>
                        {activityId !== 0 && (
                            <Typography
                                variant="h5"
                                textAlign="center"
                                color="text.secondary"
                            >
                                <Typography component="span" fontWeight="bold">{confirmData.activityName}</Typography>
                            </Typography>
                        )}
                        <Typography variant="h4" fontWeight="bold" textAlign="center">
                            {confirmData.timeText}
                        </Typography>
                        {confirmData.type === 'check-out' && confirmData.durationText && (
                            <Typography variant="body1" textAlign="center">
                                {t('shiftLength')}: <Typography component="span" fontWeight="bold">{confirmData.durationText}</Typography>
                            </Typography>
                        )}
                        {confirmData.type === 'check-in' && (
                        <Typography variant="body2" color="secondary" textAlign="center">
                            {t('rememberToCheckout')}
                        </Typography>
                        )}
                    </Stack>
                </DialogContent>
            </Dialog>

        </>
    );
}