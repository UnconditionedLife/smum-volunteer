import { useState } from 'react';
import { Box, Typography, TextField, MenuItem, Button, Select, InputLabel, FormControl } from '@mui/material';
import { useLang } from '../utils/languageContext';
import { setCookie, registerVolunteer, updateVolunteer, sendEmail } from '../utils/api';
import dayjs from 'dayjs';

const maxStep = 10

export function Register(props) {
    const onUpdate = props.onUpdate;
    const { t, lang } = useLang();
    const [regStep, setRegStep] = useState(0);

    // Volunteer info
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [telephone, setTelephone] = useState('');
    const [email, setEmail] = useState('');
    const [volunteerId, setVolunteerId]= useState('');
    const [programId, setProgramId]= useState('0')

    const subject = `${t("regEmailSubject")}, ${firstName}!`;

    function buildEmailTextBody() {
        let body = 
            `${t("regEmailThankYou")}, ${ firstName } ${t("regEmailThankYouFor")}.\n\n` +
            `${t("regEmailBody1")}\n\n` +
            `${t("regEmailBody2")}\n\n` +
            `${t("regEmailBody3")}\n\n\n` +
            `${t("regEmailSign1Name")}\n` +
            `${t("regEmailSign1Role")}\n\n` +
            `${t("regEmailSign2Name")}\n` +
            `${t("regEmailSign2Role")}\n\n\n` +
            `${t("regEmailAgreementsLead")}\n\n`;

        for (let i = 1; i <= maxStep; i++) {
            body += `<b>${t(`agreementsHdr${i}`)}</b>\n`;
            body += `${t(`agreementsBdy${i}`)}\n\n`;
        }
        return body;
    }

    function escapeHtml(s = "") {
        return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

        function buildEmailHtmlBody() {
            let body = 
                `<!doctype html>
                <html lang="${lang}" dir="ltr">
                    <body style="margin:0; padding:20px; font-family: Arial, Helvetica, sans-serif; line-height:1.5; color:#111;">
                    <p style="margin:0 0 12px;">${t("regEmailThankYou")}, ${ firstName }, ${t("regEmailThankYouFor")}</p>
                    <p style="margin:0 0 12px;">${t("regEmailBody1")}</p>
                    <p style="margin:0 0 12px;">${t("regEmailBody2")}</p>
                    <p style="margin:0 0 24px;">${t("regEmailBody3")}</p>
                    <p style="margin:0 0 0px;">${t("regEmailSign1Name")}</p>
                    <p style="margin:0 0 24px;">${t("regEmailSign1Role")}</p>
                    <p style="margin:0 0 0px;">${t("regEmailSign2Name")}</p>
                    <p style="margin:0 0 24px;">${t("regEmailSign2Role")}</p>
                    <p style="font-weight:900; margin:0 0 24px;">${t("regEmailAgreementsLead")}</p>
                    <ol style="margin:0 0 16px 20px; padding:0;">`

            for (let i = 1; i <= maxStep; i++) {
                body += `<li style="margin:0 0 10px;">
                            <div style="font-weight:700; margin:0 0 4px;">${t(`agreementsHdr${i}`)}</div>
                            <div>${t(`agreementsBdy${i}`)}</div>
                        </li>`
            }
            
            body += `</ol>
                    </body>
                    </html>`
            return body;
        }

        const updateCookies = (firstName, volunteerId) => {
            setCookie("volunteerName", firstName);
            setCookie("volunteerId", volunteerId);
            onUpdate(); // cause caller to reload cookies
        }

        const finishRegistration = async () => {
            updateVolunteer(volunteerId, { regComplete: true })
            // setVolunteerAttrs(volunteerId, {regComplete: true})
                .then(result => {
                    // console.log("UPDATE VOLUNTEER:", result)
                    updateCookies(firstName, volunteerId);
                    sendEmail(
                        {
                            to: email ,
                            subject: subject,
                            text: buildEmailTextBody(),
                            html: buildEmailHtmlBody()
                        }
                    ).then(m_result => {
                        // console.log("EMAIL:", m_result)
                    })
                })
                .catch(console.error);
        }

        const handleRegister = async () => {  
            const now = dayjs().tz('America/Los_Angeles');
            const time = now.toISOString()
            registerVolunteer(firstName, lastName, telephone, email, programId, time)
                .then(result => {
                    // console.log('register-result', result)
                    setVolunteerId(result.id);
                    if (result.regComplete)
                        updateCookies(firstName, result.id);
                    else
                        setRegStep(1);
                })
                .catch(console.error);
        };

        if (regStep == 0) {
            return (
                <>
                    <Box component="section" mb={ 2 } mt={ 2 }>
                        <Typography fontSize="20px" color='#6FADAF'>{ t('volunteerUpper') }</Typography>
                        <TextField label={ t('firstName') } value={firstName} onChange={e => setFirstName(e.target.value)} fullWidth margin="dense" size="small" 
                            id="firstName"
                            sx={{ 
                                mb: .5,
                                backgroundColor: 'rgba(255, 255, 255, 0.44)',
                                borderRadius: '4px' 
                            }} />
                        <TextField label={ t('lastName') } value={lastName} onChange={e => setLastName(e.target.value)} fullWidth margin="dense" size="small" 
                            id="lastName"
                            sx={{ 
                                mb: .5,
                                backgroundColor: 'rgba(255, 255, 255, 0.44)',
                                borderRadius: '4px' 
                            }} />
                        <TextField label={ t('telephone') } value={telephone} onChange={e => setTelephone(e.target.value)} fullWidth margin="dense" size="small" 
                            id="telephone"
                            sx={{ 
                                mb: .5,
                                backgroundColor: 'rgba(255, 255, 255, 0.44)',
                                borderRadius: '4px' 
                            }} />
                        <TextField label={ t('email') } value={email} onChange={e => setEmail(e.target.value)} fullWidth margin="dense" size="small" 
                            id="email"
                            sx={{ 
                                mb: .5,
                                backgroundColor: 'rgba(255, 255, 255, 0.44)',
                                borderRadius: '4px' 
                            }} />
                    </Box>
                    <Box component="section">
                        <Button 
                            id="continue"
                            variant="contained" 
                            color="primary"
                            disabled={!firstName || !lastName || (!telephone && !email)}
                            onClick={handleRegister}
                        >
                            { t('continue') }
                        </Button>
                    </Box>
                </>
            )
        } else if (regStep <= maxStep) {
            return (
                <>
                    <Box component="section" textAlign='center' mt={2} >
                        <Typography fontSize="20px" color='#6FADAF'>{ t('agreementUpper') }</Typography>
                        <Typography color="#000">{t('agreementStmt')}</Typography>
                        <Box display='flex' width="100%" justifyContent='center'>
                            <Box 
                                maxWidth='500px'
                                width='90vw'
                                backgroundColor='#ffffff70'
                                borderRadius='10px'
                                border='solid 1px grey'
                                padding='12px'
                                alignSelf='center'
                                mt='10px'
                                mb='20px'
                                minHeight='214px'
                            >
                                <Box my={ 2 }>
                                    <Typography variant="h6" color="#000" lineHeight="20px">{ t(`agreementsHdr${regStep}`) }</Typography>
                                </Box>
                                <Typography align="left" color="#000">{ t(`agreementsBdy${regStep}`) }</Typography>
                            </Box>
                        </Box>
                        <Button 
                            variant="contained" 
                            color="primary"
                            disabled={false}
                            onClick={ () => {
                                if (regStep == maxStep) 
                                    finishRegistration();
                                else
                                    setRegStep(regStep + 1);
                            } }
                            id={"agree_" + regStep}
                        >
                            { t('agree') }
                        </Button>
                    </Box>
                </>
            );
        } else  {
            return (<></>);
        }
}