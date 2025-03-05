import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Box, Button, TextField, Grid, Typography, CircularProgress, Autocomplete } from "@mui/material";
import { APIURL } from "../configuration";

const ForeClosureReport = () => {
  const [dropdownData, setDropdownData] = useState({
    branches: [],
    regions: [],
    branchRegionMap: {},
    regionBranchMap: {},
  });

  const [branchName, setBranchName] = useState("");
  const [regionName, setRegionName] = useState("");
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [loading, setLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState("");

  // Fetch dropdown data from API
  const fetchDropdownData = async () => {
    try {
      setLoadingDropdowns(true);
      const response = await fetch(`${APIURL}/api/foreclosure/get-foreclosure-dropdowns`);
      if (!response.ok) throw new Error("Failed to fetch dropdown data");

      const rawData = await response.json();
      console.log("Dropdown API Response:", rawData);

      if (!rawData?.branches || !rawData?.branchToRegionMap || !rawData?.regionToBranchMap) {
        throw new Error("Invalid dropdown data structure received.");
      }

      // Ensure branches is always an array
      const branches = Array.isArray(rawData.branches) ? rawData.branches : [];

      setDropdownData({
        branches,
        regions: Object.keys(rawData.regionToBranchMap || {}),
        branchRegionMap: rawData.branchToRegionMap || {},
        regionBranchMap: rawData.regionToBranchMap || {},
      });

      setFilteredBranches(branches); // Initially, show all branches

      sessionStorage.setItem(
        "ForeClosureDropdownData",
        JSON.stringify({ data: rawData, timestamp: Date.now() })
      );
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      setDropdownData({ branches: [], regions: [], branchRegionMap: {}, regionBranchMap: {} });
      setFilteredBranches([]);
    } finally {
      setLoadingDropdowns(false);
    }
  };

  // Load dropdown data on mount
  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem("ForeClosureDropdownData");
      if (storedData) {
        const { data, timestamp } = JSON.parse(storedData);
        const expiryTime =  1000; // 30 minutes cache

        if (Date.now() - timestamp < expiryTime) {
          console.log("Using cached dropdown data:", data);
          setDropdownData({
            branches: data.branches || [],
            regions: Object.keys(data.regionBranchMap || {}),
            branchRegionMap: data.branchRegionMap || {},
            regionBranchMap: data.regionBranchMap || {},
          });
          setFilteredBranches(data.branches || []);
          setLoadingDropdowns(false);
          return;
        }
      }
    } catch (error) {
      console.error("Error reading session storage:", error);
    }
    fetchDropdownData();
  }, []);

  // Handle branch selection
  const handleBranchChange = (_, newValue) => {
    setBranchName(newValue || "");

    if (newValue) {
      console.log("Selected Branch:", newValue);
      const mappedRegion = dropdownData.branchRegionMap[newValue] || "";
      console.log("Mapped Region:", mappedRegion);
      setRegionName(mappedRegion);
    } else {
      setRegionName("");
    }
  };

  // Handle region selection
  const handleRegionChange = (_, newValue) => {
    setRegionName(newValue || "");
    setBranchName("");

    if (newValue) {
      console.log("Selected Region:", newValue);
      const newFilteredBranches = dropdownData.regionBranchMap[newValue] || [];
      console.log("Mapped Branches:", newFilteredBranches);
      setFilteredBranches(newFilteredBranches);
    } else {
      setFilteredBranches(dropdownData.branches); // Reset branch list
    }
  };

  const generateExcelReport = async () => {
    setLoading(true);
    setDownloadLink("");
  
    try {
      const payload = {
        branchName: branchName || "",  // Ensure empty values are sent
        regionName: regionName || "",
      };
  
      const response = await fetch(`${APIURL}/api/foreclosure/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch report: ${response.statusText}`);
      }
  
      const jsonData = await response.json();
      console.log("API Response:", jsonData);
  
      if (!jsonData.success || !Array.isArray(jsonData.data)) {
        throw new Error("Unexpected response format or no data available");
      }
  
      const worksheet = XLSX.utils.json_to_sheet(jsonData.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "ForeClosureReport");
  
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const fileURL = URL.createObjectURL(blob);
      setDownloadLink(fileURL);
    } catch (error) {
      console.error("Error generating report:", error);
      alert(error.message || "An error occurred while generating the Excel report.");
    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <Box sx={{ maxWidth: 600, margin: "20px auto", padding: 3, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h6" sx={{ textAlign: "center", borderBottom: "2px solid #0056b3", paddingBottom: "10px" }}>
        Foreclosure Report
      </Typography>

      <Grid container spacing={2} sx={{ marginTop: 2 }}>
        <Grid item xs={12}>
          <Autocomplete
            options={filteredBranches} // Use filtered branch list
            loading={loadingDropdowns}
            value={branchName || null}
            onChange={handleBranchChange}
            renderInput={(params) => <TextField {...params} label="Branch Name" variant="outlined" fullWidth />}
          />
        </Grid>

        <Grid item xs={12}>
          <Autocomplete
            options={dropdownData?.regions || []}
            loading={loadingDropdowns}
            value={regionName || null}
            onChange={handleRegionChange}
            renderInput={(params) => <TextField {...params} label="Region Name" variant="outlined" fullWidth />}
          />
        </Grid>
      </Grid>

      <Button
        variant="contained"
        onClick={generateExcelReport}
        disabled={loading}
        sx={{ marginTop: 3, display: "block", marginX: "auto" }}
      >
        {loading ? <CircularProgress size={24} /> : "Generate Report"}
      </Button>

      {downloadLink && (
        <Typography variant="body2" sx={{ marginTop: "20px", textAlign: "center" }}>
          <a href={downloadLink} download="ForeClosureReport.xlsx">Download Report</a>
        </Typography>
      )}
    </Box>
  );
};

export default ForeClosureReport;
