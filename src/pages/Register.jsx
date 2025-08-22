import { useState, useEffect } from 'react';
import { Box, Typography, TextField, MenuItem, Button, Select, InputLabel, FormControl } from '@mui/material';
import { useLang } from '../utils/languageContext';
import { setCookie, registerVolunteer, updateVolunteer, sendEmail } from '../utils/api';

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

    const subject = `${t("regEmailSubject")}, ${firstName}!`;

    function buildEmailTextBody() {
        let body = 
            `${t("regEmailIntro1")}, ${ firstName }.\n\n` +
            `${t("regEmailIntro2")}\n\n` +
            `${t("regEmailAgreementsLead")}\n\n`;

        for (let i = 1; i <= maxStep; i++) {
            body += `<b>${t(`agreementsHdr${i}`)}</b>\n`;
            body += `${t(`agreementsBdy${i}`)}\n\n`;
        }

        body += `${t("regEmailClosing1")},\n ${t("regEmailClosing2")}`;
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
                    <p style="margin:0 0 12px;">${t("regEmailIntro1")}, ${ firstName }.</p>
                    <p style="margin:0 0 12px;">${t("regEmailIntro2")}</p>
                    <p style="margin:0 0 12px;">${t("regEmailAgreementsLead")}</p>
                    <ol style="margin:0 0 16px 20px; padding:0;">`

            for (let i = 1; i <= maxStep; i++) {
                body += `<li style="margin:0 0 10px;">
                            <div style="font-weight:700; margin:0 0 4px;">${t(`agreementsHdr${i}`)}</div>
                            <div>${t(`agreementsBdy${i}`)}</div>
                        </li>`
            }
            
            body += `</ol>
                    <p style="margin:16px 0 0;">${t("regEmailClosing1")},<br/>${t("regEmailClosing2")}</p>
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
            console.log("volunteerId:", volunteerId)
            updateVolunteer(volunteerId, { regComplete: true })
            // setVolunteerAttrs(volunteerId, {regComplete: true})
                .then(result => {
                    console.log("UPDATE VOLUNTEER:", result)
                    updateCookies(firstName, volunteerId);
                    sendEmail(
                        {
                            to: email ,
                            subject: subject,
                            text: buildEmailTextBody(),
                            html: buildEmailHtmlBody()
                        }
                    ).then(result => {
                        console.log("EMAIL:", result)
                    })
                })
                .catch(console.error);
        }

        const handleRegister = async () => {            
            registerVolunteer(firstName, lastName, telephone, email)
                .then(result => {
                    console.log('register-result', result)
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
                    <Box component="section" textAlign='center'>
                        <Typography fontSize="20px" color='#6FADAF'>{ t('agreementUpper') }</Typography>
                        <Typography color="#000">{t('agreementStmt')}</Typography>
                        <Box display='flex' width="100%" justifyContent='center'>
                            <Box 
                                maxWidth='500px'
                                width='90vw'
                                backgroundColor='#ffffff80'
                                borderRadius='10px'
                                border='solid 1px grey'
                                padding='12px'
                                alignSelf='center'
                                mt='10px'
                                mb='20px'
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