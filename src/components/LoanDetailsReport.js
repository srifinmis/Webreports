import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Box,
  Button,
  TextField,
  Grid,
  Typography,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import { APIURL } from '../configuration';

const LoanDetailsReport = () => {
  const [zoneName, setZoneName] = useState('');
  const [clusterName, setClusterName] = useState('');
  const [regionName, setRegionName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [loanApplicationId, setLoanApplicationId] = useState('');
  const [isDead, setIsDead] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState('');

  const [dropdownData, setDropdownData] = useState({
    zones: [],
    clusters: [],
    regions: [],
    branches: [],
    customers: [],
    loanApplications: [],
    statuses: []
  });

  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const response = await fetch(`${APIURL}/api/dropdown-data-loan`);
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);

        const data = await response.json();
        setDropdownData(data);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    fetchDropdownData();
  }, []);

  const generateExcelReport = async () => {
    if (!branchName) {
      alert('Branch Name is required');
      return;
    }

    setLoading(true);
    setDownloadLink('');

    const reportRequest = {
      zoneName,
      clusterName,
      regionName,
      branchName,
      customerId,
      loanApplicationId,
      isDead
    };

    try {
      const response = await fetch(`${APIURL}/generate-loan-details-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportRequest)
      });

      const jsonData = await response.json();
      if (!response.ok) throw new Error(jsonData.message || 'Failed to generate report');

      if (!Array.isArray(jsonData)) throw new Error("Unexpected response format: Expected an array");

      // Convert JSON data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(jsonData);

      // Convert worksheet to array, remove first row, and recreate the sheet
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      sheetData.shift(); // Remove first row

      const newWorksheet = XLSX.utils.aoa_to_sheet(sheetData);

      // Create a new workbook and append the cleaned sheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, newWorksheet, "LoanDetails");

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
    <Box sx={{ maxWidth: 900, margin: '20px auto', padding: 3, border: '1px solid #ccc', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h6" sx={{ color: '#0056b3', fontWeight: '600', fontSize: '20px', marginBottom: '20px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #0056b3', paddingBottom: '10px' }}>
        Loan Details Report
      </Typography>

      <Grid container spacing={2} sx={{ marginTop: 2 }}>

        <Grid item xs={12} md={6}>
          <Autocomplete
            options={dropdownData.branches}
            loading={loadingDropdowns}
            value={branchName}
            onChange={(event, newValue) => setBranchName(newValue || '')}
            renderInput={(params) => <TextField {...params} label="Branch Name (Required)" variant="outlined" fullWidth required />}
          />
        </Grid>
        {/* Zone & Cluster */}
        <Grid item xs={12} md={6}>
          <Autocomplete
            options={dropdownData.zones}
            loading={loadingDropdowns}
            value={zoneName}
            onChange={(event, newValue) => setZoneName(newValue || '')}
            renderInput={(params) => <TextField {...params} label="Zone Name" variant="outlined" fullWidth />}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Autocomplete
            options={dropdownData.clusters}
            loading={loadingDropdowns}
            value={clusterName}
            onChange={(event, newValue) => setClusterName(newValue || '')}
            renderInput={(params) => <TextField {...params} label="Cluster Name" variant="outlined" fullWidth />}
          />
        </Grid>

        {/* Region & Branch */}
        <Grid item xs={12} md={6}>
          <Autocomplete
            options={dropdownData.regions}
            loading={loadingDropdowns}
            value={regionName}
            onChange={(event, newValue) => setRegionName(newValue || '')}
            renderInput={(params) => <TextField {...params} label="Region Name" variant="outlined" fullWidth />}
          />
        </Grid>


        {/* Customer ID & Loan Application */}
        <Grid item xs={12} md={6}>
          <Autocomplete
            options={dropdownData.customers}
            loading={loadingDropdowns}
            value={customerId}
            onChange={(event, newValue) => setCustomerId(newValue || '')}
            renderInput={(params) => <TextField {...params} label="Customer ID" variant="outlined" fullWidth />}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Autocomplete
            options={dropdownData.loanApplications}
            loading={loadingDropdowns}
            value={loanApplicationId}
            onChange={(event, newValue) => setLoanApplicationId(newValue || '')}
            renderInput={(params) => <TextField {...params} label="Loan Application ID" variant="outlined" fullWidth />}
          />
        </Grid>

        {/* Is Dead (Status) */}
        <Grid item xs={12} md={6}>
          <Autocomplete
            options={dropdownData.statuses}
            loading={loadingDropdowns}
            value={isDead}
            onChange={(event, newValue) => setIsDead(newValue || '')}
            renderInput={(params) => <TextField {...params} label="Is Dead" variant="outlined" fullWidth />}
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
          Your Excel report is ready! <a href={downloadLink} download="LoanDetailsReport.xlsx">Click here to download</a>
        </Typography>
      )}
    </Box>
  );
};

export default LoanDetailsReport;
