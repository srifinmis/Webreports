import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Box, Button, TextField, Grid, Typography, CircularProgress, Autocomplete } from '@mui/material';
import { APIURL } from '../configuration';

const ForeClosureReport = () => {
  const [branchName, setBranchName] = useState('');
  const [regionName, setRegionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState('');
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [dropdownData, setDropdownData] = useState({ branches: [], branchRegionMap: {}, regionBranchMap: {} });
  const [filteredBranches, setFilteredBranches] = useState([]);

  // Function to fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      const response = await fetch(`${APIURL}/get-foreclosure-dropdowns`);
      if (!response.ok) throw new Error('Failed to fetch dropdown data');

      const data = await response.json();
      setDropdownData(data);
      setFilteredBranches(data.branches);

      // Store in sessionStorage
      sessionStorage.setItem(
        "ForeClosureDropdownData",
        JSON.stringify({ data, timestamp: Date.now() })
      );

    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    } finally {
      setLoadingDropdowns(false);
    }
  };

  // Fetch dropdown data on mount
  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem("ForeClosureDropdownData");
      if (storedData) {
        const { data, timestamp } = JSON.parse(storedData);
        const thirtyMinutes = 24 * 60 * 60 * 1000; // 30 minutes in milliseconds

        if (Date.now() - timestamp < thirtyMinutes) {
          setDropdownData(data);
          setFilteredBranches(data.branches);
          setLoadingDropdowns(false);
          return;
        }
      }
    } catch (error) {
      console.error("Error reading session storage:", error);
    }
    fetchDropdownData();
  }, []);

  // Handle Branch Selection and update Region accordingly
  const handleBranchChange = (event, newValue) => {
    setBranchName(newValue || '');
    setRegionName(dropdownData.branchRegionMap[newValue] || '');
  };

  // Handle Region Selection and update Branch dropdown accordingly
  const handleRegionChange = (event, newValue) => {
    setRegionName(newValue || '');
    setBranchName(''); // Reset branch when changing region

    if (newValue && dropdownData.regionBranchMap[newValue]) {
      setFilteredBranches(dropdownData.regionBranchMap[newValue]);
    } else {
      setFilteredBranches(dropdownData.branches); // Show all branches if no region is selected
    }
  };

  const generateExcelReport = async () => {
    setLoading(true);
    setDownloadLink('');

    const reportRequest = { branchName, regionName };

    try {
      const response = await fetch(`${APIURL}/generate-foreclosure-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportRequest)
      });

      const jsonData = await response.json();
      if (!response.ok) throw new Error(jsonData.message || 'No data found to generate report');

      if (!Array.isArray(jsonData)) throw new Error("Unexpected response format: Expected an array");

      // Convert JSON data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "ForeClosureReport");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const fileURL = URL.createObjectURL(blob);
      setDownloadLink(fileURL);

    } catch (error) {
      console.error('Error generating report:', error);
      alert(error.message || 'An error occurred while generating the Excel report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, margin: '20px auto', padding: 3, border: '1px solid #ccc', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h6" sx={{ color: '#0056b3', fontWeight: '600', fontSize: '20px', marginBottom: '20px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #0056b3', paddingBottom: '10px' }}>
        Fore Closure Report
      </Typography>

      <Grid container spacing={2} sx={{ marginTop: 2 }}>


        {/* Branch Dropdown */}
        <Grid item xs={12}>
          <Autocomplete
            options={filteredBranches}
            loading={loadingDropdowns}
            value={branchName}
            onChange={handleBranchChange}
            renderInput={(params) => <TextField {...params} label="Branch Name" variant="outlined" fullWidth />}
          />
        </Grid>

        {/* Region Dropdown */}
        <Grid item xs={12}>
          <Autocomplete
            options={Object.keys(dropdownData.regionBranchMap)}
            loading={loadingDropdowns}
            value={regionName}
            onChange={handleRegionChange}
            renderInput={(params) => <TextField {...params} label="Region Name" variant="outlined" fullWidth />}
          />
        </Grid>


      </Grid>

      {/* Generate Report Button */}
      <Button variant="contained" onClick={generateExcelReport} disabled={loading} sx={{ marginTop: 3, display: 'block', marginX: 'auto' }}>
        {loading ? <CircularProgress size={24} /> : 'Generate Report'}
      </Button>

      {/* Download Link */}
      {downloadLink && (
        <Typography variant="body2" sx={{ marginTop: '20px', textAlign: 'center' }}>
          Your Excel report is ready! <a href={downloadLink} download="ForeClosureReport.xlsx">Click here to download</a>
        </Typography>
      )}
    </Box>
  );
};

export default ForeClosureReport;
