import React, { useState, useEffect, useMemo } from "react";
import { Box, TextField, Grid, Typography, Autocomplete, Button, CircularProgress } from "@mui/material";
import { APIURL } from "../configuration";
import * as XLSX from 'xlsx';

const EmployeeMasterReport = () => {
  const [branch, setBranch] = useState(null);
  const [area, setArea] = useState(null);
  const [region, setRegion] = useState(null);
  const [cluster, setCluster] = useState(null);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [downloadLink, setDownloadLink] = useState(null);
  const [loading, setLoading] = useState(false);

  const [dropdownData, setDropdownData] = useState({
    branches: [],
    areas: [],
    regions: [],
    clusters: [],
    branchMappings: {},
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      const cacheKey = "employeeMasterDropdownData";
      const cachedData = sessionStorage.getItem(cacheKey);
      const cacheExpiration = 24 * 60 * 60 * 1000; // 30 minutes in milliseconds

      if (cachedData) {
        const { timestamp, data } = JSON.parse(cachedData);
        if (Date.now() - timestamp < cacheExpiration) {
          setDropdownData(data);
          setLoadingDropdowns(false);
          return;
        }
      }

      try {
        const response = await fetch(`${APIURL}/api/dropdown-data-employeemaster`);
        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

        const data = await response.json();

        // Filter out unwanted values
        const filterValidEntries = (arr, excludeLabel) =>
          arr.filter((item) => item && item.label !== excludeLabel);

        const processedData = {
          branches: filterValidEntries(data.branches || [], "BranchID_Name"),
          areas: filterValidEntries(data.areas || [], "AreaID_Name"),
          regions: filterValidEntries(data.regions || [], "RegionID_Name"),
          clusters: filterValidEntries(data.clusters || [], "ClusterID_Name"),
          branchMappings: data.branchMappings || {},
        };

        // Store in sessionStorage with timestamp
        sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: processedData }));

        setDropdownData(processedData);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    fetchDropdownData();
  }, []);




  const handleClusterChange = (event, newValue) => {
    setCluster(newValue);
    setRegion(null);
    setArea(null);
    setBranch(null);
  };


  const handleRegionChange = (event, newValue) => {
    setRegion(newValue);
    setArea(null);
    setBranch(null);
    if (newValue) {
      const matchingClusters = Object.values(dropdownData.branchMappings)
        .filter((b) => b.region === newValue.label)
        .map((b) => b.cluster);
      setCluster(matchingClusters.length ? { label: matchingClusters[0] } : null);
    }
  };

  const handleAreaChange = (event, newValue) => {
    setArea(newValue);
    setBranch(null);
    if (newValue) {
      const matchedRegion = Object.values(dropdownData.branchMappings).find(
        (b) => b.area === newValue.label
      )?.region;
      setRegion(matchedRegion ? { label: matchedRegion } : null);

      const matchedCluster = Object.values(dropdownData.branchMappings).find(
        (b) => b.area === newValue.label
      )?.cluster;
      setCluster(matchedCluster ? { label: matchedCluster } : null);
    }
  };

  const handleBranchChange = (event, newValue) => {
    setBranch(newValue);
    if (newValue) {
      const branchDetails = dropdownData.branchMappings[newValue.label] || {};
      setRegion(branchDetails.region ? { label: branchDetails.region } : null);
      setCluster(branchDetails.cluster ? { label: branchDetails.cluster } : null);
      setArea(branchDetails.area ? { label: branchDetails.area } : null);
    }
  };

  const filteredRegions = useMemo(() => {
    if (!cluster) return dropdownData.regions;
    return dropdownData.regions.filter((region) =>
      Object.values(dropdownData.branchMappings).some(
        (branch) => branch.cluster === cluster.label && branch.region === region.label
      )
    );
  }, [cluster, dropdownData.regions, dropdownData.branchMappings]);

  const filteredAreas = useMemo(() => {
    if (!region) return dropdownData.areas;
    return dropdownData.areas.filter((area) =>
      Object.values(dropdownData.branchMappings).some(
        (branch) => branch.region === region.label && branch.area === area.label
      )
    );
  }, [region, dropdownData.areas, dropdownData.branchMappings]);

  const filteredBranches = useMemo(() => {
    return dropdownData.branches.filter((branch) =>
      Object.entries(dropdownData.branchMappings).some(([branchName, details]) => {
        return (
          branch.label === branchName &&
          (!cluster || details.cluster === cluster.label) &&
          (!region || details.region === region.label) &&
          (!area || details.area === area.label)
        );
      })
    );
  }, [cluster, region, area, dropdownData.branches, dropdownData.branchMappings]);

  const generateExcelReport = async () => {
    setLoading(true);
    setDownloadLink(null);

    try {
      const requestBody = {
        branchID: branch ? branch.label : null,
        areaID: area ? area.label : null,
        regionID: region ? region.label : null,
        clusterID: cluster ? cluster.label : null,
        employeeStatus: [],
      };

      console.log("Sending request to API with body:", requestBody);

      const response = await fetch(`${APIURL}/api/generate-employee-master-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("API Response Status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Response Error:", errorText);
        throw new Error(`Failed to generate report: ${errorText}`);
      }

      const jsonData = await response.json();
      console.log("API Response Data:", jsonData);

      if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
        alert("No data available for the selected filters.");
        setLoading(false);
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "EmployeeMasterReport");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const fileURL = URL.createObjectURL(blob);
      setDownloadLink(fileURL);
    } catch (error) {
      console.error("Error generating report:", error);
      alert(`Error generating report: ${error.message}`);
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
        Employee Master Report
      </Typography>

      <Grid container spacing={2}>

        <Grid item xs={12}>
          <Autocomplete options={filteredBranches} value={branch} onChange={handleBranchChange}
            renderInput={(params) => <TextField {...params} label="Branch Name" fullWidth />} />
        </Grid>

        <Grid item xs={12}>
          <Autocomplete options={dropdownData.clusters} value={cluster} onChange={handleClusterChange}
            renderInput={(params) => <TextField {...params} label="Cluster Name" fullWidth />} />
        </Grid>

        <Grid item xs={12}>
          <Autocomplete options={filteredRegions} value={region} onChange={handleRegionChange}
            renderInput={(params) => <TextField {...params} label="Region Name" fullWidth />} />
        </Grid>
        <Grid item xs={12}>
          <Autocomplete options={filteredAreas} value={area} onChange={handleAreaChange}
            renderInput={(params) => <TextField {...params} label="Area Name" fullWidth />} />
        </Grid>

      </Grid>

      <Button variant="contained" onClick={generateExcelReport} disabled={loading} sx={{ mt: 3, display: "block", mx: "auto" }}>
        {loading ? <CircularProgress size={24} /> : "Generate Report"}
      </Button>

      {downloadLink && (
        <Typography variant="body2" sx={{ marginTop: '20px', textAlign: 'center' }}>
          Your Excel report is ready! <a href={downloadLink} download="EmployeerMasterReport.xlsx">Click here to download</a>
        </Typography>
      )}
    </Box>
  );
};

export default EmployeeMasterReport;
