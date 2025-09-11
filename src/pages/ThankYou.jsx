import { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import { useLang } from '../utils/languageContext';

export default function ThankYou() {
    const { t } = useLang();

    function readCookies() {
        // const nameCookie = getCookie("volunteerName");
        // setKnownName(nameCookie);
    }

    useEffect(() => {
        readCookies();
    }, []);

    return (
        <>
            {/* Thank you section */}
            <Box component="section" textAlign="center">
                <Box my={8} maxWidth='375px' mx='auto'>
                    <Typography variant="h6" color="textPrimary"><p>{ t('thankYouForJoining')}</p></Typography>
                    <VolunteerActivismIcon sx={{ fontSize: 60, color: 'green', mb: 0 }} />
                    <Typography variant="subhead" color="textPrimary"><p>{ t('welcomeToSMUM') }</p><p><i><b>{ t('togetherWeCan') }</b></i></p></Typography>
                </Box>
            </Box>
        </>
    );
}