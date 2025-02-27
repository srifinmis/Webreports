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
    try {
      const storedData = sessionStorage.getItem("creditReportDropdownData");

      if (storedData) {
        const { data, timestamp } = JSON.parse(storedData);
        const cacheDuration = 24 * 60 * 60 * 1000;

        if (Date.now() - timestamp < cacheDuration) {
          setDropdownData(data);
          setLoadingDropdowns(false);
          return;
        }
      }
    } catch (error) {
      console.error("Error reading session storage:", error);
    }

    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const response = await fetch(`${APIURL}/api/dropdown-data-creditreport`);
      const data = await response.json();

      const filterValidEntries = (arr) => arr.filter((item) => item && item !== "value");

      const formattedData = {
        branches: filterValidEntries(data.branches).map((b) => ({ label: b, id: b })),
        statuses: filterValidEntries(data.statuses).map((s) => ({ label: s, id: s })),
      };

      setDropdownData(formattedData);
      sessionStorage.setItem("creditReportDropdownData", JSON.stringify({ data: formattedData, timestamp: Date.now() }));
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const handleStartDateChange = (newValue) => {
    if (newValue > endDate) {
      setError("Start Date cannot be greater than End Date.");
    } else {
      setError("");
    }
    setStartDate(newValue);
  };

  const handleEndDateChange = (newValue) => {
    if (newValue < startDate) {
      setError("End Date cannot be earlier than Start Date.");
    } else {
      setError("");
    }
    setEndDate(newValue);
  };

  const generateExcelReport = async () => {
    setError("");
    if (!branch || !startDate || !endDate) {
      setError("Branch and Apply Date Range are required.");
      return;
    }
    if (startDate > endDate) {
      setError("Start Date cannot be greater than End Date.");
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
      const response = await fetch(`${APIURL}/generate-creditreport`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportRequest),
      });

      const jsonData = await response.json();
      if (!response.ok) throw new Error(jsonData.message || "No data found to generate report");
      if (!Array.isArray(jsonData)) throw new Error("Unexpected response format: Expected an array");

      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "CreditReport");

      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const fileURL = URL.createObjectURL(blob);
      setDownloadLink(fileURL);
    } catch (error) {
      console.error("Error generating report:", error);
      setError(error.message || "An error occurred while generating the Excel report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ maxWidth: 600, margin: "20px auto", padding: 3, border: "1px solid #ccc", borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" sx={{ textAlign: "center", marginBottom: "20px", borderBottom: "2px solid #0056b3", paddingBottom: "10px" }}>
          Credit Report
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Autocomplete
              options={dropdownData.branches}
              loading={loadingDropdowns}
              getOptionLabel={(option) => option.label || ""}
              onChange={(event, newValue) => setBranch(newValue)}
              renderInput={(params) => <TextField {...params} label="Branch (Required)" fullWidth required />}
            />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              options={dropdownData.statuses}
              loading={loadingDropdowns}
              getOptionLabel={(option) => option.label || ""}
              onChange={(event, newValue) => setCreditAppStatus(newValue)}
              renderInput={(params) => <TextField {...params} label="Credit App Status" fullWidth />}
            />
          </Grid>

          <Grid item xs={6}>
            <DatePicker label="Application Start Date (Required)" value={startDate} onChange={handleStartDateChange} maxDate={today} />
          </Grid>

          <Grid item xs={6}>
            <DatePicker label="Application End Date (Required)" value={endDate} onChange={handleEndDateChange} maxDate={today} />
          </Grid>
        </Grid>

        {error && <Typography color="error" sx={{ marginTop: 2, textAlign: "center" }}>{error}</Typography>}

        <Button variant="contained" onClick={generateExcelReport} disabled={loading} sx={{ marginTop: 3, width: "100%" }}>
          {loading ? <CircularProgress size={24} /> : "Generate Report"}
        </Button>
      </Box>
    </LocalizationProvider>
  );
};

export default CreditReport;
