import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Box, Button, TextField, Grid, Typography, CircularProgress, Autocomplete } from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { APIURL } from "../configuration";
import { format } from "date-fns";

const CreditReport = () => {
  const today = new Date();
  const [branch, setBranch] = useState(null);
  const [creditAppStatus, setCreditAppStatus] = useState(null);
  const [startDate, setStartDate] = useState(new Date("2023-10-01"));
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState("");
  const [dropdownData, setDropdownData] = useState({ branches: [], statuses: [] });
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const response = await fetch(`${APIURL}/api/creditreport/dropdown-data-creditreport`);
      if (!response.ok) throw new Error("Failed to fetch dropdown data");

      const data = await response.json();
      console.log("API Response:", data);

      setDropdownData({
        branches: Array.isArray(data.branches) ? data.branches.map(b => ({ label: b, id: b })) : [],
        statuses: Array.isArray(data.statuses) ? data.statuses.map(s => ({ label: s, id: s })) : [],
      });
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
      setError("Failed to load dropdown options.");
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const handleStartDateChange = (newValue) => {
    setStartDate(newValue);
    if (newValue > endDate) {
      setError("Start Date cannot be greater than End Date.");
    } else {
      setError("");
    }
  };

  const handleEndDateChange = (newValue) => {
    setEndDate(newValue);
    if (newValue < startDate) {
      setError("End Date cannot be earlier than Start Date.");
    } else {
      setError("");
    }
  };

  const generateExcelReport = async () => {
    setError("");
    if (!branch || !startDate || !endDate) {
      setError("Branch and Apply Date Range are required.");
      return;
    }

    setLoading(true);
    setDownloadLink("");

    const reportRequest = {
      branchID: branch.id,
      creditAppStatus: creditAppStatus ? creditAppStatus.id : "",
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    };

    try {
      const response = await fetch(`${APIURL}/api/creditreport/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportRequest),
      });

      const jsonData = await response.json();
      if (!response.ok) throw new Error(jsonData.message || "No data found to generate report");

      const worksheet = XLSX.utils.json_to_sheet(jsonData.data || []);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "CreditReport");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const fileURL = URL.createObjectURL(blob);
      setDownloadLink(fileURL);
    } catch (error) {
      console.error("Error generating report:", error);
      setError(error.message || "An error occurred while generating the report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ maxWidth: 600, margin: "20px auto", padding: 3, border: "1px solid #ccc", borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" sx={{ textAlign: "center", marginBottom: "20px" }}>Credit Report</Typography>
        {error && <Typography color="error" sx={{ textAlign: "center" }}>{error}</Typography>}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Autocomplete
              options={dropdownData.branches}
              getOptionLabel={(option) => option.label}
              value={branch}
              onChange={(event, newValue) => setBranch(newValue)}
              loading={loadingDropdowns}
              renderInput={(params) => <TextField {...params} label="Branch" variant="outlined" fullWidth required />}
            />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              options={dropdownData.statuses}
              getOptionLabel={(option) => option.label}
              value={creditAppStatus}
              onChange={(event, newValue) => setCreditAppStatus(newValue)}
              loading={loadingDropdowns}
              renderInput={(params) => <TextField {...params} label="Credit App Status" variant="outlined" fullWidth />}
            />
          </Grid>

          <Grid item xs={6}>
            <DatePicker label="Start Date" value={startDate} onChange={handleStartDateChange} renderInput={(params) => <TextField {...params} fullWidth />} />
          </Grid>
          <Grid item xs={6}>
            <DatePicker label="End Date" value={endDate} onChange={handleEndDateChange} renderInput={(params) => <TextField {...params} fullWidth />} />
          </Grid>
        </Grid>

        <Button variant="contained" onClick={generateExcelReport} disabled={loading} sx={{ marginTop: 3, width: "100%" }}>
          {loading ? <CircularProgress size={24} /> : "Generate Report"}
        </Button>

        {downloadLink && (
          <Typography textAlign="center" sx={{ marginTop: 2 }}>
            <a href={downloadLink} download="CreditReport.xlsx">Download Report</a>
          </Typography>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default CreditReport;