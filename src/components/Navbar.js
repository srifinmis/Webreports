import React, { useState } from "react";
import { Drawer, Button, Box, Divider } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import ReportIcon from "@mui/icons-material/Assessment";
import { useTheme } from "@mui/material/styles";
import { useNavigate, Link } from "react-router-dom";

const Navbar = () => {
  const [showCICMenu, setShowCICMenu] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeLink, setActiveLink] = useState("");

  const handleNavigate = (path) => {
    navigate(path);
    setActiveLink(path);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: 180,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 180,
            boxSizing: "border-box",
            backgroundColor: "#000957",
            color: theme.palette.common.white,
            overflowY: "auto",
          },
        }}
      >
        <Divider sx={{ backgroundColor: theme.palette.divider }} />
        <Box sx={{ marginTop: "70px" }} />

        <Box sx={{ paddingX: 2, marginY: 1 }}>
          <Button
            color="inherit"
            fullWidth
            startIcon={<ReportIcon />}
            onClick={() => handleNavigate("/components/ReportForm")}
            sx={{
              justifyContent: "flex-start",
              color: activeLink === "/components/ReportForm" ? "#79D7BE" : "white",
              "&:hover": { color: "#79D7BE" },
            }}
          >
            Reports
          </Button>
        </Box>

        <Box sx={{ paddingX: 2, marginY: 1 }}>
          <Button
            color="inherit"
            fullWidth
            startIcon={<BusinessIcon />}
            onClick={() => setShowCICMenu(!showCICMenu)}
            sx={{
              justifyContent: "flex-start",
              color: "white",
              "&:hover": { color: "#79D7BE" },
            }}
          >
            CIC
          </Button>
        </Box>

        {showCICMenu && (
          <Box sx={{ paddingLeft: 4 }}>
            <Button
              color="inherit"
              fullWidth
              onClick={() => handleNavigate("/components/Reports")}
              sx={{ justifyContent: "flex-start", color: "white", "&:hover": { color: "#79D7BE" } }}
            >
              Reports
            </Button>
            <Button
              color="inherit"
              fullWidth
              onClick={() => handleNavigate("/components/Reupload")}
              sx={{ justifyContent: "flex-start", color: "white", "&:hover": { color: "#79D7BE" } }}
            >
              Reupload
            </Button>
          </Box>
        )}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 2 }}></Box>
    </Box>
  );
};

export default Navbar;

