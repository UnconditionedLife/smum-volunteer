import { useLang } from '../utils/languageContext';
import { Box, Typography } from '@mui/material';

export default function LanguageSwitcher() {
    const { lang, setLang } = useLang();
    const englishColor = (lang == 'en') ? "#6BA65F" : "#99D288"
    const espanolColor = (lang == 'es') ? "#6BA65F" : "#99D288"

    return (
        <Box display="flex" 
            flexDirection='row'
            width='calc(100% - 20px)'
            justifyContent='space-between'
            mt={1.5}
            ml='10px'
        >
            <Box onClick={() => {setLang("en")}} 
                sx={{ 
                    width: '70px', 
                    background: englishColor,
                    borderRadius: '20px'
                }}>
                <Typography fontSize='12px' color='white'><b>ENGLISH</b></Typography>
            </Box>
            <Box onClick={() => {setLang("es")}}
                sx={{ 
                    width: '70px', 
                    background: espanolColor,
                    borderRadius: '20px'
                }}>
                <Typography fontSize='12px' color='white'><b>ESPAÑOL</b></Typography>
            </Box>
        </Box>

        // <select value={lang} onChange={(e) => setLang(e.target.value)}>
        //   <option value="en">English</option>
        //   <option value="es">Español</option>
        // </select>
    );
}