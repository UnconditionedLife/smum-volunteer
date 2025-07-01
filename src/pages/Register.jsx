import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Box, Typography, TextField, MenuItem, Button, Select, InputLabel, FormControl } from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useLang } from '../utils/languageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { generateVolunteerId } from '../utils/generateVolunteerId';
import { getActivities, getPrograms, logAction, registerVolunteer } from '../utils/api';
import { prepareActivitiesList, prepareProgramsList } from '../utils/buildLists';

function getTodayKey() {
  const today = new Date();
  return `volunteer_checked_in_${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`;
}

function getNameKey() {
    const today = new Date();
    return `volunteer_name_${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`;
}

function setCookie(name, value, days = 1) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

export  function Register(props) {
        const onUpdate = props.onUpdate;
        const { t, lang } = useLang();
        const [regStep, setRegStep] = useState(0);

        // Volunteer info
        const [name, setName] = useState('');
        const [telephone, setTelephone] = useState('');
        const [email, setEmail] = useState('');
        const [volunteerId, setVolunteerId]= useState('');
    
        // Program
        const [programId, setProgram] = useState('0');
        const [rawPrograms, setRawPrograms] = useState([]);
        const [programs, setPrograms] = useState([])


            const handleRegister = async () => {
                // setKnownName(name || knownName);
                
                // SAVE TO DB
                generateVolunteerId( email, telephone )
                    .then( hash => {
                        setVolunteerId(hash)
                        console.log(
                            "volunteerId", hash,
                            "fullName", name,
                            "telephone", telephone,
                            "email", email,
                            "programId", programId
                        )
        
                        if (hash != null) {
                            try {                   
                                registerVolunteer( hash, name, telephone, email, programId )
                                    .then(vResult => {
                                        // setCookie(getTodayKey(), '1');
                                        setCookie(getNameKey(), name);
                                        setCookie("volunteerId", volunteerId);
                                        onUpdate();

                                        console.log( "Registration:", vResult )
                        
                                        logAction(hash, "Check-In", activityId, programId)
                                            .then(cResult =>{
                                                console.log( "LogAction:", cResult )
                                            } )
                                    })
                            } catch (err) {
                                alert("Error: " + err.message);
                            }
                        } else {
                            console.log('INVALID ID HASH')
                        }
                    }
                )
            };

        return (
            <>
                <Box component="section">
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
                </Box>
                <Box component="section">
                    <Typography>Lang = {lang} Step = {regStep}</Typography>
                    <Button 
                        variant="contained" 
                        color="primary"
                        disabled={false}
                        onClick={() => {setRegStep(regStep + 1)}} 
                        fullWidth
                    >
                        Increment
                    </Button>
                </Box>
                <Box component="section">
                    <Button 
                        variant="contained" 
                        color="primary"
                        disabled={false}
                        onClick={handleRegister} 
                        fullWidth
                    >
                        { t('register') }
                    </Button>
                </Box>
            </>
        );
    }