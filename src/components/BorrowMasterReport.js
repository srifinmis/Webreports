import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Box, Button, TextField, Grid, Typography, CircularProgress, Autocomplete } from '@mui/material';
import { APIURL } from '../configuration';

const BorrowerMasterReport = () => {
  const [branchName, setBranchName] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState('');
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [dropdownData, setDropdownData] = useState({ branches: [] });

  useEffect(() => {
    const fetchDropdownData = async () => {
      const cachedData = sessionStorage.getItem('borrowerMasterDropdowns');
      const cacheTimestamp = sessionStorage.getItem('borrowerMasterDropdownsTimestamp');
      const now = new Date().getTime();
  
      if (cachedData && cacheTimestamp && now - cacheTimestamp < 24 * 60 * 60 * 1000) {
        setDropdownData(JSON.parse(cachedData));
        setLoadingDropdowns(false);
        return;
      }
  
      try {
        const response = await fetch(`${APIURL}/api/dropdown-data-borrowermaster`);
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
  
        const data = await response.json();
  
        // Ensure API returns branches with both ID and Name
        const formattedBranches = (data.branches || []).map(branch => ({
          label: `${branch.BranchName} (${branch.BranchID})`, // Display both
          value: branch.BranchID, // Store ID internally
          branchName: branch.BranchName,
        }));
  
        setDropdownData({ branches: formattedBranches });
  
        sessionStorage.setItem('borrowerMasterDropdowns', JSON.stringify({ branches: formattedBranches }));
        sessionStorage.setItem('borrowerMasterDropdownsTimestamp', now.toString());
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      } finally {
        setLoadingDropdowns(false);
      }
    };
  
    fetchDropdownData();
  }, []);
  
  const handleBranchChange = (event, newValue) => {
    setBranchName(newValue || '');
  };

  const generateExcelReport = async () => {
    if (!branchName) {
      alert('Branch selection is required');
      return;
    }
  
    setLoading(true);
    setDownloadLink('');
  
    try {
      const selectedBranch = dropdownData.branches.find(branch => branch.value === branchName);
  
      const response = await fetch(`${APIURL}/generate-borrowermaster-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          branchName: selectedBranch?.branchName, 
          branchId: selectedBranch?.value 
        })
      });
  
      const jsonData = await response.json();
      if (!response.ok) throw new Error(jsonData.message || 'No data found  to generate report');
  
      if (!Array.isArray(jsonData)) throw new Error('Unexpected response format: Expected an array');
  
      const worksheet = XLSX.utils.json_to_sheet(jsonData);
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
    options={dropdownData.branches}
    loading={loadingDropdowns}
    getOptionLabel={(option) => option.label} // Show Branch Name & ID
    value={dropdownData.branches.find(branch => branch.value === branchName) || null}
    onChange={(event, newValue) => {
      setBranchName(newValue ? newValue.value : '');
    }}
    renderInput={(params) => <TextField {...params} label="Branch (Name & ID)" variant="outlined" fullWidth required />}
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
