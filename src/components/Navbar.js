import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Drawer, Box, Divider, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// Icon imports
import ReportIcon from "@mui/icons-material/Assessment";

const Navbar = () => {
  const [activeLink, setActiveLink] = useState(null); // Track active link for color change
  const theme = useTheme(); // Get the current theme for color reference

  const handleLinkClick = (link) => {
    setActiveLink(link); // Set active link
  };

  return (
    <Box sx={{ display: "flex" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          "& .MuiDrawer-paper": {
            width: 260,
            marginTop: "50px",
            boxSizing: "border-box",
            backgroundColor: "#000957", // Sidebar background color
            color: theme.palette.common.white,
            overflowY: "auto", // Enable scrolling
            scrollbarWidth: "thin", // Thin scrollbar (for Firefox)
            msOverflowStyle: "none", // For IE/Edge, hide arrows
            "&::-webkit-scrollbar": {
              width: "12px", // Scrollbar width
            },
            "&::-webkit-scrollbar-track": {
              background: theme.palette.background.default,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.secondary.main,
              borderRadius: "10px",
            },
          },
        }}
      >
        <Divider sx={{ backgroundColor: theme.palette.divider }} />

        {/* Single Navigation Item */}
        <Box sx={{ marginTop: "16px", paddingLeft: "16px" }}>
          <Button
            color="inherit"
            fullWidth
            startIcon={<ReportIcon />}
            onClick={() => handleLinkClick("/Reports")}
            sx={{
              justifyContent: "flex-start",
              color: activeLink === "/Reports" ? "#79D7BE" : "white", // Change text color when active
              "&:hover": {
                color: "#79D7BE",
              },
            }}
            component={Link}
            to="/Reports"
          >
            Reports
          </Button>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.default",
          padding: "16px",
        }}
      >
        {/* Your main content goes here */}
        <h1>Reports Page</h1>
      </Box>
    </Box>
  );
};

export default Navbar;
