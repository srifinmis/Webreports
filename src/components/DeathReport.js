import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Box, Button, TextField, Grid, Typography, CircularProgress, Autocomplete } from '@mui/material';
import { APIURL } from '../configuration';

const CACHE_KEY = "deathReportDropdownData";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 30 minutes

const DeathReport = () => {
  const [branch, setBranch] = useState(null);
  const [cluster, setCluster] = useState(null);
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState('');
  const [dropdownData, setDropdownData] = useState({
    branches: [],
    clusters: [],
    regions: [],
    branchMap: {},
    allBranches: [],
    allRegions: [],
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      const cachedData = sessionStorage.getItem(CACHE_KEY);
      const cachedTimestamp = sessionStorage.getItem(`${CACHE_KEY}_timestamp`);

      if (cachedData && cachedTimestamp && Date.now() - cachedTimestamp < CACHE_DURATION) {
        setDropdownData(JSON.parse(cachedData));
        return;
      }

      try {
        const response = await fetch(`${APIURL}/api/dropdown-data-deathreport`);
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);

        const data = await response.json();
        console.log("Fetched dropdown data:", data);

        const branchArray = Object.keys(data.branchMap).map(branchKey => ({
          label: branchKey,
          id: branchKey,
          clusterId: data.branchMap[branchKey].cluster.id,
          regionId: data.branchMap[branchKey].region.id
        }));

        const formattedData = {
          clusters: data.clusters?.map(c => ({ label: c.name, id: c.id })) || [],
          regions: data.regions?.map(r => ({ label: r.name, id: r.id, clusterId: r.clusterId })) || [],
          branches: branchArray || [],
          branchMap: data.branchMap || {},
          allBranches: branchArray || [],
          allRegions: data.regions?.map(r => ({ label: r.name, id: r.id, clusterId: r.clusterId })) || [],
        };

        sessionStorage.setItem(CACHE_KEY, JSON.stringify(formattedData));
        sessionStorage.setItem(`${CACHE_KEY}_timestamp`, Date.now());

        setDropdownData(formattedData);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        setDropdownData({ clusters: [], regions: [], branches: [], branchMap: {}, allBranches: [], allRegions: [] });
      }
    };

    fetchDropdownData();
  }, []);

  const handleClusterChange = (event, newValue) => {
    setCluster(newValue);
    setRegion(null);
    setBranch(null);

    if (newValue) {
      const filteredRegions = dropdownData.allRegions.filter(region => region.clusterId === newValue.id);
      const filteredBranches = dropdownData.allBranches.filter(branch => branch.clusterId === newValue.id);

      setDropdownData(prev => ({
        ...prev,
        regions: filteredRegions,
        branches: filteredBranches
      }));
    } else {
      setDropdownData(prev => ({
        ...prev,
        regions: dropdownData.allRegions,
        branches: dropdownData.allBranches
      }));
    }
  };

  const handleRegionChange = (event, newValue) => {
    setRegion(newValue);
    setBranch(null);

    if (newValue) {
      const filteredBranches = dropdownData.allBranches.filter(branch => branch.regionId === newValue.id);

      setDropdownData(prev => ({
        ...prev,
        branches: filteredBranches
      }));

      const relatedCluster = dropdownData.clusters.find(cluster => cluster.id === newValue.clusterId);
      setCluster(relatedCluster || null);
    } else {
      setDropdownData(prev => ({
        ...prev,
        branches: dropdownData.allBranches
      }));
      setCluster(null);
    }
  };

  const handleBranchChange = (event, newValue) => {
    setBranch(newValue);

    if (newValue) {
      const selectedBranchData = dropdownData.branchMap[newValue.label];

      const relatedCluster = dropdownData.clusters.find(cluster => cluster.id === selectedBranchData.cluster.id);
      const relatedRegion = dropdownData.regions.find(region => region.id === selectedBranchData.region.id);

      setCluster(relatedCluster || null);
      setRegion(relatedRegion || null);
    } else {
      setCluster(null);
      setRegion(null);
    }
  };

  const generateExcelReport = async () => {
    setLoading(true);
    setDownloadLink('');

    const reportRequest = {
      Cluster: cluster?.label || '',
      Region: region?.label || '',
      Branch: branch?.id || '',
    };

    try {
      const response = await fetch(`${APIURL}/generate-deathreport`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportRequest),
      });

      const jsonData = await response.json();
      if (!response.ok) throw new Error(jsonData.message || 'No data found to generate report');

      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        throw new Error("No data found.");
      }

      const headers = Object.keys(jsonData[0]).map(key => ({ v: key, t: "s" }));
      const worksheet = XLSX.utils.json_to_sheet([headers.map(h => h.v)], { skipHeader: true });
      XLSX.utils.sheet_add_json(worksheet, jsonData, { origin: "A2", skipHeader: true });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "DeathReport");

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
      <Typography variant="h6" sx={{
        color: '#0056b3', fontWeight: '600', fontSize: '20px', marginBottom: '20px', textAlign: 'center',
        textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '2px solid #0056b3', paddingBottom: '10px'
      }}>
        Death Report
      </Typography>

      <Grid container spacing={2}>

        <Grid item xs={12}>
          <Autocomplete
            options={dropdownData.branches}
            value={branch}
            onChange={handleBranchChange}
            getOptionLabel={(option) => option?.label || ""}
            renderInput={(params) => <TextField {...params} label="Branch " variant="outlined" fullWidth />}
          />
        </Grid>

        <Grid item xs={12}>
          <Autocomplete
            options={dropdownData.clusters}
            value={cluster}
            onChange={handleClusterChange}
            getOptionLabel={(option) => option?.label || ""}
            renderInput={(params) => <TextField {...params} label="Cluster" variant="outlined" fullWidth />}
          />
        </Grid>

        <Grid item xs={12}>
          <Autocomplete
            options={dropdownData.regions}
            value={region}
            onChange={handleRegionChange}
            getOptionLabel={(option) => option?.label || ""}
            renderInput={(params) => <TextField {...params} label="Region" variant="outlined" fullWidth />}
          />
        </Grid>


      </Grid>

      <Button variant="contained" onClick={generateExcelReport} disabled={loading} sx={{ marginTop: 3, width: '100%', height: '48px' }}>
        {loading ? <CircularProgress size={24} /> : 'Generate Report'}
      </Button>

      {downloadLink && (
        <Typography variant="body2" sx={{ marginTop: '20px', textAlign: 'center' }}>
          <a href={downloadLink} download="DeathReport.xlsx">Download Report</a>
        </Typography>
      )}
    </Box>
  );
};

export default DeathReport;
