import { useState, useEffect } from 'react';
import { Box, Typography, TextField, MenuItem, Button, Select, InputLabel, FormControl } from '@mui/material';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useLang } from '../utils/languageContext';
import { setCookie, getPrograms, registerVolunteer, setVolunteerAttrs } from '../utils/api';
import { prepareProgramsList } from '../utils/buildLists';

// XXX remove numbers and add remainder
const en_header = [
    "",
    "1 Treat everyone with dignity, compassion, and respect",
    "2 This is a safe space for everyone",
    "3 Dress Code",
];
const en_body = [
    "",
    "Santa Maria is committed to a welcoming environment. Volunteers are expected to uphold this by being kind and respectful to all—clients, staff, donors, and fellow volunteers.",
    "Harassment—verbal, physical, or visual—is not allowed. This includes offensive jokes, comments, or actions based on personal traits. Report any incidents to a manager right away.",
    "No gang-related, offensive, revealing, or short clothing. Shorts must be at least to your fingertips. Closed-toe shoes are required. Volunteers may be asked to change or return another time, if not following the dress code.",
];
const es_header = [
    "",
    "1 Tratar a todos con dignidad, compasión y respeto",
    "2 Este es un espacio seguro para todos",
    "3 Código de vestimenta",
];
const es_body = [
    "",
    "Santa Maria se compromete a brindar un ambiente acogedor. Se espera que los voluntarios lo mantengan siendo amables y respetuosos con todos: clientes, personal, donantes y compañeros voluntarios.",
    "No se permite el acoso, ya sea verbal, físico o visual. Esto incluye bromas, comentarios o acciones ofensivas basadas en rasgos personales. Reporte cualquier incidente a un gerente de inmediato.",
    "No se permite ropa relacionada con pandillas, ofensiva, reveladora o corta. Los pantalones cortos deben llegar al menos hasta la punta de los dedos. Se requiere calzado cerrado. Se les podría pedir a los voluntarios que se cambien o regresen en otro momento si no cumplen con el código de vestimenta.",
];

const maxStep = en_body.length - 1;

export  function Register(props) {
        const onUpdate = props.onUpdate;
        const { t, lang } = useLang();
        const [regStep, setRegStep] = useState(0);

        // Volunteer info
        const [firstName, setFirstName] = useState('');
        const [lastName, setLastName] = useState('');
        const [telephone, setTelephone] = useState('');
        const [email, setEmail] = useState('');
        const [volunteerId, setVolunteerId]= useState('');
    
        // Program
        const [programId, setProgram] = useState('0');
        const [rawPrograms, setRawPrograms] = useState([]);
        const [programs, setPrograms] = useState([])

        useEffect(() => {
            getPrograms()
                .then( programsList => {
                    setRawPrograms(programsList)
                })
                .catch(console.error);
        }, []);

        useEffect(() => {
            // Sort + localize programs when lang or data changes
            if (!rawPrograms.length) return;
            const cleanPrograms = prepareProgramsList(rawPrograms, lang)    
            setPrograms(cleanPrograms);
        }, [lang, rawPrograms]);

        const handleRegister = async () => {            
            registerVolunteer(firstName, lastName, telephone, email, programId)
                .then(result => {
                    console.log( "Registration:", result )
                    setVolunteerId(result.id)
                    if (result.regComplete)
                        setRegStep(maxStep + 1);
                    else
                        setRegStep(1);
                })
                .catch(console.error);
        };

        if (programs.length == 0)
            return (<></>);

        if (regStep == 0) {
            return (
                <>
                    <Box component="section">
                        <Typography fontSize="20px" color='#6FADAF'>{ t('volunteerUpper') }</Typography>
                        <TextField label={ t('firstName') } value={firstName} onChange={e => setFirstName(e.target.value)} fullWidth margin="dense" size="small" 
                            sx={{ 
                                mb: .5,
                                backgroundColor: 'rgba(255, 255, 255, 0.44)',
                                borderRadius: '4px' 
                            }} />
                        <TextField label={ t('lastName') } value={lastName} onChange={e => setLastName(e.target.value)} fullWidth margin="dense" size="small" 
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

                    <Box component="section" mt={4} mb={2}>
                        <Typography fontSize="20px" color='#6FADAF'>{ t('programUpper') }</Typography>
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="program-label">{ t('program') }</InputLabel>
                            <Select
                            labelId="program-label"
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

                    <Box component="section">
                        <Button 
                            variant="contained" 
                            color="primary"
                            disabled={false}
                            onClick={handleRegister}
                        >
                            { t('continue') }
                        </Button>
                    </Box>
                </>
            )
        } else if (regStep > maxStep) {
            console.log('Final step', regStep);
            // setRegStep(regStep + 1);
            setVolunteerAttrs(volunteerId, {regComplete: true})
                .then(result => {
                    setCookie("volunteerName", firstName);
                    setCookie("volunteerId", volunteerId);
                    onUpdate(); // cause caller to reload cookies
                    console.log( "Registration Complete");
                })
                .catch(console.error);
            return (<></>);
        } else {
            return (
                <>
                    <Box component="section">
                        <Typography fontSize="20px" color='#6FADAF'>{ t('agreementUpper') }</Typography>
                        <Typography variant="h6">{(lang == 'es') ? es_header[regStep] : en_header[regStep]}</Typography>
                        <Typography align="left">{(lang == 'es') ? es_body[regStep] : en_body[regStep]}</Typography>
                        <Button 
                            variant="contained" 
                            color="primary"
                            disabled={false}
                            onClick={ () => {setRegStep(regStep + 1); } } 
                        >
                            { t('agree') }
                        </Button>
                    </Box>
                </>
            );
        }
    }