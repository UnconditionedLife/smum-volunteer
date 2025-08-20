import { useState, useEffect } from 'react';
import { Box, Typography, TextField, MenuItem, Button, Select, InputLabel, FormControl } from '@mui/material';
import { useLang } from '../utils/languageContext';
import { setCookie, registerVolunteer, updateVolunteer, sendEmail } from '../utils/api';

const en_header = [
    "",
    "Treat everyone with dignity, compassion, and respect",
    "This is a safe space for everyone",
    "Dress Code",
    "Volunteer parking is limited",
    "Limit personal items and phone use",
    "No smoking, drugs, or alcohol",
    "No special access or treatment",
    "Follow shift guidelines and track hours",
    "Eating and drinking",
    "Be respectful, flexible, and follow directions",
];
const en_body = [
    "",
    "Santa Maria is committed to a welcoming environment. Volunteers are expected to uphold this by being kind and respectful to all—clients, staff, donors, and fellow volunteers.",
    "Harassment—verbal, physical, or visual—is not allowed. This includes offensive jokes, comments, or actions based on personal traits. Report any incidents to a manager right away.",
    "No gang-related, offensive, revealing, or short clothing. Shorts must be at least to your fingertips. Closed-toe shoes are required. Volunteers may be asked to change or return another time, if not following the dress code.",
    "Use designated areas or street parking at your own risk. Parking spaces are not guaranteed.",
    "Santa Maria is not responsible for lost or stolen items. Phones must be on silent; no texting, calls, or music during your shift. Urgent calls should be taken outside after notifying your coordinator.",
    "Smoking is not allowed on-site, including the parking lot. Volunteers may not use, possess, or be under the influence of drugs or alcohol.",
    "Do not reserve items or give preference to anyone. Volunteers may not use pantry or clothing services on the same day they serve there.",
    "Arrive on time, stay your full shift, notify a manager if you will miss a planned shift or need to leave early. Clock in and out for each shift. Directors can sign off if needed.",
    "Breaks may be taken anywhere, but eating and drinking should be limited to the kitchen. If you need to take a break, inform your manager.",
    "Act responsibly, treat others with respect, and be open to changing tasks. Do not confront clients or volunteers—bring concerns to a coordinator, manager, or director. Volunteers may be released if guidelines aren’t followed.",
];
const es_header = [
    "",
    "Tratar a todos con dignidad, compasión y respeto",
    "Este es un espacio seguro para todos",
    "Código de vestimenta",
    "El estacionamiento para voluntarios es limitado",
    "Limite el uso de artículos personales y del teléfono",
    "No fumar, drogas ni alcohol",
    "No se permite el acceso ni el trato especial",
    "Siga las pautas de turno y controle las horas",
    "Comer y beber",
    "Sea respetuoso, flexible y siga las instrucciones",
];
const es_body = [
    "",
    "Santa Maria se compromete a brindar un ambiente acogedor. Se espera que los voluntarios sean amables y respetuosos con todos: clientes, personal, donantes y compañeros voluntarios.",
    "No se permite el acoso, ya sea verbal, físico o visual. Esto incluye bromas, comentarios o acciones ofensivas basadas en rasgos personales. Reporte cualquier incidente a un gerente de inmediato.",
    "No se permite ropa relacionada con pandillas, ofensiva, reveladora o corta. Los pantalones cortos deben llegar al menos hasta la punta de los dedos. Se requiere calzado cerrado. Se les podría pedir a los voluntarios que se cambien o regresen en otro momento si no cumplen con el código de vestimenta.",
    "Use las áreas designadas o el estacionamiento en la calle bajo su propio riesgo. No se garantizan los espacios de estacionamiento.",
    "Santa Maria no se hace responsable de la pérdida o el robo de artículos. Los teléfonos deben estar en silencio; no se permiten mensajes de texto, llamadas ni música durante su turno. Las llamadas urgentes deben atenderse afuera después de notificar a su coordinador.",
    "No se permite fumar en las instalaciones, incluido el estacionamiento. Los voluntarios no pueden consumir, poseer ni estar bajo la influencia de drogas o alcohol.",
    "No reserve artículos ni dé preferencia a nadie. Los voluntarios no pueden usar la despensa ni los servicios de ropa el mismo día que prestan servicio.",
    "Llegue puntualmente, permanezca en su turno completo y notifique a un gerente si va a perder un turno programado o necesita salir antes. Registre su entrada y salida en cada turno. Los directores pueden firmar si es necesario.",
    "Se pueden tomar descansos en cualquier lugar, pero comer y beber debe limitarse a la cocina. Si necesita tomar un descanso, informe a su gerente.",
    "Actúe con responsabilidad, trate a los demás con respeto y esté abierto a cambios de tareas. No confronte a los clientes ni a los voluntarios; plantee sus inquietudes a un coordinador, gerente o director. Los voluntarios podrían ser despedidos si no siguen las pautas.",
];

const maxStep = en_body.length - 1;

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
                    console.log(result)
                    updateCookies(firstName, volunteerId);
                    sendEmail(
                        {
                            to: "jose@radicalpurpose.org",
                            subject: "Hello from the APP!!!",
                            text: "This is really the APP!!",
                            html: ""
                        }
                    )
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
                                // height='124px'
                                backgroundColor='#ffffff80'
                                borderRadius='10px'
                                border='solid 1px grey'
                                padding='12px'
                                alignSelf='center'
                                mt='10px'
                                mb='20px'
                            >
                                <Typography variant="h6" color="#000" lineHeight="50px">{(lang == 'es') ? es_header[regStep] : en_header[regStep]}</Typography>
                                <Typography align="left" color="#000">{(lang == 'es') ? es_body[regStep] : en_body[regStep]}</Typography>
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