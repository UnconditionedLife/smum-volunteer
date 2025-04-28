import { Box, Container, Typography } from "@mui/material";
import SmumLogo from "../assets/SmumLogo.jsx";

export function Header(){
    return (
        <>
            <Box mb="40px" mt='-10px' padding={0}>
                <SmumLogo width="70px"/>
                <Typography variant="H1" fontSize="20px" align="center" gutterBottom><b>Santa Maria Urban Ministry</b></Typography>
            </Box>
            <Box mb="0px" padding={0}>
                <Typography variant="H2" lineHeight="20px" fontSize="28px" align="center"><b>Welcome to the Volunteer Portal</b></Typography>
            </Box>
            <Typography variant="H3" lineHeight="20px" fontSize="17px" align="center">
                <i>Making a difference, one volunteer at a time.</i>
            </Typography>  
        </>
    )
}