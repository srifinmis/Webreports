import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Box, Button, TextField, Grid, Typography, CircularProgress, Autocomplete } from '@mui/material';
import { APIURL } from '../configuration';

const BorrowerMasterReport = () => {
  const [branchName, setBranchName] = useState(null); // Store object instead of string
  const [loading, setLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState('');
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch(`${APIURL}/api/borrowermaster/dropdown-data-borrowermaster`);
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);

        const data = await response.json();
        if (Array.isArray(data.branches) && data.branches.length > 0) {
          setBranches(data.branches);
        } else {
          console.warn('No branches found in API response.');
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    fetchBranches();
  }, []);

  const generateExcelReport = async () => {
    if (!branchName) {
      alert('Branch selection is required');
      return;
    }
  
    setLoading(true);
    setDownloadLink('');
  
    try {
      const response = await fetch(`${APIURL}/api/borrowermaster/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ branchName: branchName?.BranchName }), // Ensure branchName is a string
      });
  
      const jsonData = await response.json();
      if (!response.ok) throw new Error(jsonData.message || 'No data found to generate report');
  
      if (!Array.isArray(jsonData.data)) throw new Error('Unexpected response format: Expected an array');
  
      const worksheet = XLSX.utils.json_to_sheet(jsonData.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'BorrowerMasterReport');
  
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
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
        Borrower Master Report
      </Typography>

      <Grid container spacing={2} sx={{ marginTop: 2 }}>
        <Grid item xs={12}>
        <Autocomplete
  options={branches}
  loading={loadingDropdowns}
  getOptionLabel={(option) => `${option.BranchID} - ${option.BranchName}`} // Show "B123 - BranchName"
  isOptionEqualToValue={(option, value) => option.BranchID === value?.BranchID} // Ensure correct selection
  value={branchName} // Store entire object
  onChange={(event, newValue) => setBranchName(newValue)} // Update selected branch
  renderInput={(params) => <TextField {...params} label="Branch Name" variant="outlined" fullWidth required />}
/>

        </Grid>
      </Grid>

      <Button variant="contained" onClick={generateExcelReport} disabled={loading} sx={{ marginTop: 3, display: 'block', marginX: 'auto' }}>
        {loading ? <CircularProgress size={24} /> : 'Generate Report'}
      </Button>

      {downloadLink && (
        <Typography variant="body2" sx={{ marginTop: '20px', textAlign: 'center' }}>
          Your Excel report is ready! <a href={downloadLink} download="BorrowerMasterReport.xlsx">Click here to download</a>
        </Typography>
      )}
    </Box>
  );
};

export default BorrowerMasterReport;
