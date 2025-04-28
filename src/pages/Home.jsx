import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Box, Container, Typography } from '@mui/material';

export default function Home() {
    return (
        <Box component="container"
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                flexWrap: 'wrap',
                alignContent: 'space-between'
            }}
        >
        
            <Box component="header" >
                <Header/>
            </Box>

            <Box component="main" mt="40px">
                <Box component="section">
                    <h3>VOLUNTEER</h3>
                    <p>Info</p>
                </Box>

                <Box component="section" >
                    <h3>ACTIVITY & TIME</h3>
                    <p>Info</p>
                </Box>

                <Box component="section" >
                    <h3>CONFIRMATION</h3>
                    <p>Info</p>
                </Box>
            </Box>

            <Box component="footer" >
                <Typography fontSize='0.8em' color='#888'> 
                    &copy; {new Date().getFullYear()} Santa Maria Urban Ministry
                </Typography>
            </Box>
        </Box>
    );
}