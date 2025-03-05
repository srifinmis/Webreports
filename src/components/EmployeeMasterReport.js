import React, { useState, useEffect, useMemo } from "react";
import { Box, TextField, Grid, Typography, Autocomplete, Button, CircularProgress } from "@mui/material";
import { APIURL } from "../configuration";
import * as XLSX from 'xlsx';

const EmployeeMasterReport = () => {
  const [branch, setBranch] = useState(null);
  const [area, setArea] = useState(null);
  const [region, setRegion] = useState(null);
  const [cluster, setCluster] = useState(null);
  const [employeeStatus, setEmployeeStatus] = useState([]); // Added state for employeeStatus
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [downloadLink, setDownloadLink] = useState(null);
  const [loading, setLoading] = useState(false);

  const [dropdownData, setDropdownData] = useState({
    branches: [],
    areas: [],
    regions: [],
    clusters: [],
    employeeStatuses: [], // You may want to get this from the backend or define it
    branchMappings: {},
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      const cacheKey = "employeeMasterDropdownData";
      const cachedData = sessionStorage.getItem(cacheKey);
      const cacheExpiration = 1000 * 60 * 30; // 30 minutes in milliseconds

      if (cachedData) {
        const { timestamp, data } = JSON.parse(cachedData);
        if (Date.now() - timestamp < cacheExpiration) {
          setDropdownData(data);
          setLoadingDropdowns(false);
          return;
        }
      }

      try {
        const response = await fetch(`${APIURL}/api/employeemaster/dropdown-data`);
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
          employeeStatuses: filterValidEntries(data.employeeStatuses || [], "Employee_Status"), // Assuming employee status is fetched
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

  const handleEmployeeStatusChange = (event, newValue) => {
    setEmployeeStatus(newValue);
  };

  const filteredRegions = useMemo(() => {
    if (!dropdownData.regions || !cluster) return dropdownData.regions || [];
    return dropdownData.regions.filter((region) =>
      Object.values(dropdownData.branchMappings).some(
        (branch) => branch.cluster === cluster.label && branch.region === region.label
      )
    );
  }, [cluster, dropdownData.regions, dropdownData.branchMappings]);

  const filteredAreas = useMemo(() => {
    if (!dropdownData.areas || !region) return dropdownData.areas || [];
    return dropdownData.areas.filter((area) =>
      Object.values(dropdownData.branchMappings).some(
        (branch) => branch.region === region.label && branch.area === area.label
      )
    );
  }, [region, dropdownData.areas, dropdownData.branchMappings]);

  const filteredBranches = useMemo(() => {
    if (!dropdownData.branches) return [];
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
        employeeStatus: employeeStatus.length > 0 ? employeeStatus.map((status) => status.label) : [],
      };

      console.log("Sending request to API with body:", requestBody); // Log request body for debugging

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), 60000) // 60 seconds timeout
      );

      const response = await Promise.race([
        fetch(`${APIURL}/api/employeemaster/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }),
        timeoutPromise,
      ]);

      console.log("API Response Status:", response.status); // Log status to ensure API call is successful

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Response Error:", errorText);
        throw new Error(`Failed to generate report: ${errorText}`);
      }

      const jsonData = await response.json();
      console.log("API Response Data:", jsonData); // Log the data for debugging

      // Check if the response contains valid data
      if (!jsonData || !jsonData.data || !Array.isArray(jsonData.data) || jsonData.data.length === 0) {
        alert("No data available for the selected filters.");
        return;
      }

      // If valid data is present
      const ws = XLSX.utils.json_to_sheet(jsonData.data); // Use 'data' from the response object
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "EmployeeMasterReport");

      // File name format: Employee_Master_Report_YYYY-MM-DD_HH-mm-ss.xlsx
      const fileName = `Employee_Master_Report_${new Date().toLocaleString().replace(/[:]/g, '-')}.xlsx`;
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileLink = URL.createObjectURL(blob);

      setDownloadLink(fileLink); // Set the download link for the Excel file
    } catch (error) {
      console.error("Error generating report:", error);
      alert("There was an error generating the report. Please try again.");
    } finally {
      setLoading(false); // Ensure loading state is reset regardless of success or error
    }
  };

  return (
    <Box sx={{ boxShadow: 3, padding: 3, borderRadius: 2, maxWidth: 750, margin: "0 auto", marginTop: "64px" }}>
      <Typography variant="h4" sx={{ borderBottom: '3px solid blue', paddingBottom: 1, marginBottom: 2 }}>
        Employee Master Report
      </Typography>

      <Grid container spacing={2}>
        {/* Filters */}
        <Grid item xs={12} sm={6}>
          {dropdownData.branches && dropdownData.branches.length > 0 && (
            <Autocomplete
              options={filteredBranches}
              getOptionLabel={(option) => option.label || ""}
              onChange={handleBranchChange}
              value={branch || null}
              loading={loadingDropdowns}
              renderInput={(params) => <TextField {...params} label="Branch" variant="outlined" />}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6}>
          {dropdownData.areas && dropdownData.areas.length > 0 && (
            <Autocomplete
              options={filteredAreas}
              getOptionLabel={(option) => option.label || ""}
              onChange={handleAreaChange}
              value={area || null}
              loading={loadingDropdowns}
              renderInput={(params) => <TextField {...params} label="Area" variant="outlined" />}
            />
          )}
        </Grid>

        <Grid item xs={12} sm={6}>
          {dropdownData.regions && dropdownData.regions.length > 0 && (
            <Autocomplete
              options={filteredRegions}
              getOptionLabel={(option) => option.label || ""}
              onChange={handleRegionChange}
              value={region || null}
              loading={loadingDropdowns}
              renderInput={(params) => <TextField {...params} label="Region" variant="outlined" />}
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6}>
          {dropdownData.clusters && dropdownData.clusters.length > 0 && (
            <Autocomplete
              options={dropdownData.clusters}
              getOptionLabel={(option) => option.label || ""}
              onChange={handleClusterChange}
              value={cluster || null}
              loading={loadingDropdowns}
              renderInput={(params) => <TextField {...params} label="Cluster" variant="outlined" />}
            />
          )}
        </Grid>

        {/* Employee Status Dropdown */}
        <Grid item xs={12}>
          {dropdownData.employeeStatuses && dropdownData.employeeStatuses.length > 0 && (
            <Autocomplete
              multiple
              options={dropdownData.employeeStatuses}
              getOptionLabel={(option) => option.label || ""}
              value={employeeStatus}
              onChange={handleEmployeeStatusChange}
              loading={loadingDropdowns}
              renderInput={(params) => <TextField {...params} label="Employee Status" variant="outlined" />}
            />
          )}
        </Grid>
      </Grid>

      <Box marginTop={2}>
        <Button onClick={generateExcelReport} disabled={loading} variant="contained">
          {loading ? <CircularProgress size={24} /> : "Generate Report"}
        </Button>

        {downloadLink && (
          <Button
            variant="contained"
            color="secondary"
            onClick={() => window.location.href = downloadLink}
            style={{ marginLeft: "16px" }}
          >
            Download Excel
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default EmployeeMasterReport;
