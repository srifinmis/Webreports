import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Box, Button, TextField, Grid, Typography, CircularProgress, Autocomplete } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { APIURL } from "../configuration";
import dayjs from "dayjs";

const CACHE_KEY = "dropdownDataCache";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const LoanApplicationReport = () => {
  const DEFAULT_START_DATE = dayjs("2023-10-01");
  const [branchName, setBranchName] = useState("");
  const [appStatus, setAppStatus] = useState([]);
  const [appDate, setAppDate] = useState({ start: DEFAULT_START_DATE, end: dayjs() });
  const [loading, setLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState("");
  const [dropdownData, setDropdownData] = useState({ branches: [], statuses: [] });
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    const fetchDropdownData = async () => {
      const cachedData = sessionStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setDropdownData(data);
          setLoadingDropdowns(false);
          return;
        }
      }

      try {
        const response = await fetch(`${APIURL}/api/dropdown-data-loanapplication`);
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);

        const data = await response.json();
        const filterValidEntries = (arr) => arr.filter((item) => item && item !== "value");

        const processedData = {
          branches: filterValidEntries(data.branches),
          statuses: filterValidEntries(data.statuses),
        };

        setDropdownData(processedData);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: processedData, timestamp: Date.now() }));
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    fetchDropdownData();
  }, []);

  const validateDates = (start, end) => {
    if (start.isAfter(end)) {
      setDateError("Start date cannot be later than end date.");
      return false;
    }
    setDateError("");
    return true;
  };

  const generateExcelReport = async () => {
    if (!branchName || !appDate.start || !appDate.end) {
      alert("Branch Name and Application Date Range are required");
      return;
    }

    if (!validateDates(appDate.start, appDate.end)) {
      return;
    }

    setLoading(true);
    setDownloadLink("");

    const formattedStartDate = dayjs(appDate.start).format("YYYY-MM-DD");
    const formattedEndDate = dayjs(appDate.end).format("YYYY-MM-DD");

    const reportRequest = {
      branchName,
      appStatus,
      appDate: {
        start: formattedStartDate,
        end: formattedEndDate,
      },
    };

    try {
      const response = await fetch(`${APIURL}/generate-loanapplication-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportRequest),
      });

      const jsonData = await response.json();
      if (!response.ok) throw new Error(jsonData.message || "No data found to generate report");
      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        alert("No data available for the selected criteria.");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(jsonData);
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const cleanedSheetData = sheetData.map(row => row.slice(1));
      const newWorksheet = XLSX.utils.aoa_to_sheet(cleanedSheetData);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, newWorksheet, "LoanApplicationReport");

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
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ maxWidth: 600, margin: "40px auto", padding: 3, border: "1px solid #ccc", borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" sx={{ color: "#0056b3", fontWeight: "600", fontSize: "20px", textAlign: "center", textTransform: "uppercase", borderBottom: "2px solid #0056b3", paddingBottom: "10px", marginBottom: "30px" }}>
          Loan Application Report
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Autocomplete
              options={dropdownData.branches || []}
              loading={loadingDropdowns}
              value={branchName}
              onChange={(event, newValue) => setBranchName(newValue || "")}
              renderInput={(params) => <TextField {...params} label="Branch Name (Required)" variant="outlined" fullWidth required />}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={dropdownData.statuses || []}
              loading={loadingDropdowns}
              value={appStatus}
              onChange={(event, newValue) => setAppStatus(newValue)}
              renderInput={(params) => <TextField {...params} label="Application Status" variant="outlined" fullWidth />}
            />
          </Grid>
          <Grid item xs={6}>
            <DatePicker
              label="Application Start Date"
              value={appDate.start}
              onChange={(newValue) => {
                if (validateDates(newValue, appDate.end)) {
                  setAppDate((prev) => ({ ...prev, start: newValue }));
                }
              }}
              format="YYYY-MM-DD"
              maxDate={dayjs()}
            />
          </Grid>
          <Grid item xs={6}>
            <DatePicker
              label="Application End Date"
              value={appDate.end}
              onChange={(newValue) => {
                if (validateDates(appDate.start, newValue)) {
                  setAppDate((prev) => ({ ...prev, end: newValue }));
                }
              }}
              format="YYYY-MM-DD"
              maxDate={dayjs()}
            />
          </Grid>
        </Grid>
        {dateError && (
          <Typography color="error" sx={{ marginTop: 1, textAlign: "center" }}>
            {dateError}
          </Typography>
        )}
        <Button variant="contained" onClick={generateExcelReport} disabled={loading} sx={{ marginTop: 3, display: "block", marginX: "auto" }}>
          {loading ? <CircularProgress size={24} /> : "Generate Report"}
        </Button>
        {downloadLink && (
          <Typography variant="body2" sx={{ marginTop: "20px", textAlign: "center" }}>
            Your Excel report is ready! <a href={downloadLink} download="LoanApplicationReport.xlsx">Click here to download</a>
          </Typography>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default LoanApplicationReport;
