import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, TextField, MenuItem, Button, Select, InputLabel, FormControl, Backdrop, CircularProgress } from '@mui/material';
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
    const [busy, setBusy] = useState(false);
    const [checkedIn, setCheckedIn] = useState(false);
    const [knownName, setKnownName] = useState('');

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmData, setConfirmData] = useState({
        type: 'check-in',           // 'check-in' | 'check-out'
        timeText: '',               // e.g., "3:42 PM"
        durationText: '',           // e.g., "2h 15m" (only for check-out)
        activityName: ''            // localized activity name
    });

    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotData, setForgotData] = useState({
        activityName: '',
        checkInTimeText: '', // e.g., "3:42 PM"
        relativeDayText: ''     // e.g., "Yesterday" | "Two days ago" | "3 days ago"
    });
    const closeConfirm = () => setConfirmOpen(false);

    const canCheckoutToday = () => {
        const todayPT = dayjs().tz('America/Los_Angeles').format('YYYY-MM-DD');
        const dayCookie = getCookie("checkInDayPT");
        if (dayCookie) return dayCookie === todayPT;
        // Fallback for older check-ins that only set checkInAt
        const checkInISO = getCookie("checkInAt");
        if (!checkInISO) return true;
        // Ensure UTC parse, then convert to PT before comparing
        const startedPT = dayjs.utc(checkInISO).tz('America/Los_Angeles');
        return dayjs().tz('America/Los_Angeles').isSame(startedPT, 'day');
    };

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

    const tt = (key, fallback) => {
        const v = t(key);
        return v && v !== key ? v : fallback;
    };

    const formatRelativeDay = (startedPT) => {
        const todayPT = dayjs().tz('America/Los_Angeles').startOf('day');
        const diff = todayPT.diff(startedPT.startOf('day'), 'day');
        if (diff === 0) return '';
        // if (diff === 1) return t('yesterday');
        // if (diff === 2) return t('twoDaysAgo');
        // return `${diff} ${t('daysAgo')}`;
        if (diff === 1) return tt('yesterday', 'Yesterday');
        if (diff === 2) return tt('twoDaysAgo', 'Two days ago');
        return `${diff} ${tt('daysAgo', 'days ago')}`;
    };

    // Build a PT datetime using the date from checkInDayPT (YYYY-MM-DD) and the time from checkInAt (ISO).
    const buildStartedPT = (checkInISO, dayCookie) => {
        const isoPT = checkInISO ? dayjs.utc(checkInISO).tz('America/Los_Angeles') : null;
        if (dayCookie) {
            const dayPT = dayjs.tz(dayCookie, 'America/Los_Angeles').startOf('day');
            const timeHHmmss = isoPT ? isoPT.format('HH:mm:ss') : '00:00:00';
            return dayjs.tz(`${dayPT.format('YYYY-MM-DD')}T${timeHHmmss}`, 'America/Los_Angeles');
        }
        return isoPT; // no day cookie → just use the ISO time converted to PT
    };

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

    // On load: if last check-in wasn't today (PT), show warning and clear cookies
    useEffect(() => {
        if (rawActivities.length === 0) return; // wait until we have activities

        const checkInISO = getCookie("checkInAt");
        const hasCheckIn = !!checkInISO;
        if (!hasCheckIn) return;

        const todayOK = canCheckoutToday();
        if (todayOK) return;

        setBusy(true);
        // Build activity list locally to resolve name (no re-render dependency on "activities" var)
        const localActs = prepareActivitiesList(rawActivities, lang, params.activityId);
        const actName =
            (localActs.find(a => a.ActivityId === activityId)?.[`ActivityName_${lang}`]) || '';

        // PT day cookie for relative label
        const dayCookie = getCookie("checkInDayPT");
        const startedPT = buildStartedPT(checkInISO, dayCookie);

        setForgotData({
            activityName: actName,
            checkInTimeText: startedPT ? startedPT.format('h:mm A') : '',
            relativeDayText: startedPT ? formatRelativeDay(startedPT) : ''
        });

        // Clear stale cookies & reset state so a new shift can start
        deleteCookie("volunteerActivity");
        deleteCookie("checkInAt");
        deleteCookie("checkInDayPT");
        setCheckedIn(false);

        setForgotOpen(true);
        setBusy(false);
    }, [rawActivities, lang, params.activityId]);

    const handleSignIn = async () => {
        setBusy(true);
        setCheckedIn(true);
        setCookie("volunteerActivity", activityId);

        // Store precise check-in time (ISO UTC) for later duration calc
        const now = dayjs().tz('America/Los_Angeles');
        setCookie("checkInAt", now.toISOString());
        setCookie("checkInDayPT", now.format('YYYY-MM-DD'));

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
        setBusy(false);
    };

    const handleSignOut = async () => {
        // If the check-in was not today (PT), block checkout and show warning
        setBusy(true);
        if (!canCheckoutToday()) {
            const checkInISO = getCookie("checkInAt");
            const dayCookie = getCookie("checkInDayPT");
            const startedPT = buildStartedPT(checkInISO, dayCookie);

            setForgotData({
                activityName: getActivityName(activityId),
                checkInTimeText: startedPT ? startedPT.format('h:mm A') : '',
                relativeDayText: startedPT ? formatRelativeDay(startedPT) : ''
            });

            console.log('[ForgotDialog] startedPT=', startedPT && startedPT.format(), 'relative=', startedPT && formatRelativeDay(startedPT));

            // Clear cookies and reset state so the volunteer can start a new shift
            deleteCookie("volunteerActivity");
            deleteCookie("checkInAt");
            deleteCookie("checkInDayPT");
            setCheckedIn(false);

            setForgotOpen(true);
            setBusy(false);
            return;
        }

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
        setBusy(false);
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
                        disabled={busy || activityId == 0}
                        onClick={handleSignOut} 
                        fullWidth
                    >
                        { t('signOut') }
                    </Button>
                ) : (
                    <Button 
                        variant="contained" 
                        color="primary"
                        disabled={busy || activityId == 0}
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
                        component="div"
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

            {/* Forgot-to-check-out Pop-up */}
            <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ pr: 6 }}>
                    <Typography
                        variant="h5"
                        component="div"
                        fontWeight="bold"
                        textAlign="center"
                        color="primary"
                        marginTop={4}
                    >
                    {t('checkoutNotAllowedTitle') /* e.g., "Check-out not available" */}
                    </Typography>
                    <IconButton
                        aria-label="close"
                        onClick={() => setForgotOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon fontSize="large" />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={1.25}>
                        {forgotData.activityName && (
                            <Typography variant="h5" textAlign="center" color="text.secondary">
                                <Typography component="span" fontWeight="bold">
                                    {forgotData.activityName}
                                </Typography>
                            </Typography>
                        )}
                        <>
                            <Typography variant="body1" textAlign="center" lineHeight='20px' sx={{ mb: 0.25, lineHeight: 1.2 }} >
                                {t('lastCheckInAt')}
                            </Typography>
                            <Typography 
                                variant="body1" textAlign="center" fontWeight="bold" sx={{ mt: 0, lineHeight: 1.2 }} >
                                {forgotData.relativeDayText
                                    ? `${forgotData.relativeDayText} ${tt('atWord', 'at')} ${forgotData.checkInTimeText}`
                                    : forgotData.checkInTimeText}
                            </Typography>
                        </>

                        <Typography variant="body1" textAlign="center" color="secondary">
                            {t('checkoutNotAllowedBody')}
                        </Typography>
                    </Stack>
                </DialogContent>
            </Dialog>

            {/* Busy overlay */}
            <Backdrop
                open={busy}
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            >
                <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                    <CircularProgress color="inherit" />
                    <Typography variant="body2">Processing…</Typography>
                </Box>
            </Backdrop>
        </>
    );
}