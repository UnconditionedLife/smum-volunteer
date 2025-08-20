import { Box, Container, Typography } from "@mui/material";
import SmumLogo from "../assets/SmumLogo.jsx";

export function Header({ showSplash }){
    return (
        <>
            <Box mb={5} mt={-1} p={0} display="flex" flexDirection="column" alignItems="center">
                {/* Anchor: keeps exact final size/position for the splash to land on */}
                <Box
                    id="header-logo-anchor"
                    sx={{
                        width: 40,
                        height: 40,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        visibility: showSplash ? "hidden" : "visible", // hide during splash, but keep layout
                    }}
                >
                <SmumLogo className="header-logo" width={40} height={40} />
            </Box>
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