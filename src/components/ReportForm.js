import React, { useState, useEffect } from "react";
import { Box, Grid, TextField, Button, Typography, Alert, Autocomplete, MenuItem } from "@mui/material"; // Combined import
import InfinityLoader from "./InfinityLoader";
import { APIURL } from '../configuration';

const ReportForm = () => {
  const [reportType, setReportType] = useState("");
  const [formState, setFormState] = useState({});
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [dropdownData, setDropdownData] = useState({});
  const today = new Date().toISOString().split("T")[0];

  // Fetch dropdown data based on selected report type
  useEffect(() => {
    if (!reportType) return;

    const fetchData = async () => {
      try {
        const endpoints = ["branches", "regions", "clusters", "areas", "creditAppStatuses", "appStatuses", "employeeStatuses"];
        const responses = await Promise.all(
          endpoints.map((endpoint) =>
            fetch(`${APIURL}/api/dropdowns/${endpoint}?reportType=${encodeURIComponent(reportType)}`)
          )
        );

        const data = await Promise.all(
          responses.map(async (res, index) => {
            if (!res.ok) {
              console.error(`Error fetching ${endpoints[index]}:`, await res.text());
              return [];
            }
            return await res.json();
          })
        );

        console.log("Fetched Dropdown Data:", data);

        setDropdownData({
          branches: data[0] || [],
          regions: data[1] || [],
          clusters: data[2] || [],
          areas: data[3] || [],
          creditAppStatuses: data[4] || [],
          appStatuses: data[5] || [],
          employeeStatuses: data[6] || [],
        });
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };

    fetchData();
  }, [reportType]);

  // Handles form field selection
  const handleChange = (field) => (event, newValue) => {
    setFormState((prev) => ({
      ...prev,
      [field]: newValue || event.target.value,
    }));
  };

  // Handles report submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage("");
    setFileName(null);

    try {
      const response = await fetch("http://localhost:5000/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType, ...formState }),
      });

      if (!response.ok) throw new Error(await response.text());

      const contentType = response.headers.get("content-type");
      if (contentType.includes("application/json")) {
        const result = await response.json();
        if (!result.fileName) throw new Error("No Report generated.");
        setFileName(result.fileName);
      } else if (contentType.includes("text/csv")) {
        const blob = await response.blob();
        const fileURL = URL.createObjectURL(blob);
        setFileName(fileURL);
      } else {
        throw new Error("Unexpected response type from the server.");
      }

      setSuccessMessage("Report generated successfully! Click 'Download' to get the file.");
    } catch (err) {
      setError({ message: err.message || "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // Handles report download
  const handleDownload = () => {
    if (!fileName) return alert("No report available to download.");
    if (fileName.startsWith("blob:")) {
      const link = document.createElement("a");
      link.href = fileName;
      link.download = `Report_${reportType.replace(/\s+/g, "_")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(`http://localhost:5000/api/reports/download?file=${fileName}`, "_blank");
    }
  };

  // Define report fields dynamically
  const reportFields = {
    "Fore Closure Report": ["branches", "regions"],
    "Borrower Master Report": ["branches", "clusters"],
    "Credit Report": ["branches", "creditAppStatuses", "appStartDate", "appEndDate"],
    "Loan Application Report": ["branches", "appStatuses", "appStartDate", "appEndDate"],
    "Employee Master Report": ["branches", "areas", "regions", "clusters", "employeeStatuses"],
    "Death Report": ["clusters", "branches", "regions"],
    "Loan Details Report": ["Zone Name", "Cluster Name", "Region Name", "Branch Name", "Customer_ID", "loan_application_id", "IS_Dead"],
    "LUC Report": ["Zone Name", "Cluster Name", "Region Name", "Branch Name"]
  };

  // Map field labels
  const fieldLabels = {
    branches: "Branch",
    regions: "Region",
    clusters: "Cluster Name",
    areas: "Area",
    creditAppStatuses: "Credit App Status",
    appStatuses: "Application Status",
    employeeStatuses: "Employee Status",
    appStartDate: "Application Start Date",
    appEndDate: "Application End Date",
  };

  return (
    <Box sx={{ maxWidth: 900, margin: "0 auto", padding: 5, backgroundColor: "#fff", boxShadow: 3, borderRadius: 3, marginTop: "100px" }}>
      {loading && <InfinityLoader />}
      <Typography variant="h5" align="center" gutterBottom>Generate Report</Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField label="Report Type" select fullWidth value={reportType} onChange={(e) => setReportType(e.target.value)} size="small">
              {Object.keys(reportFields).map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
            </TextField>
          </Grid>

          {reportFields[reportType]?.map((field) => (
            <Grid item xs={6} key={field}>
              {field === "appStartDate" || field === "appEndDate" ? (
                <TextField
                  label={fieldLabels[field]}
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formState[field] || ""}
                  onChange={handleChange(field)}
                />
              ) : (
                <Autocomplete
                  freeSolo
                  options={dropdownData[field] || []}
                  getOptionLabel={(option) => option?.name || option?.id || option || ""}
                  renderInput={(params) => <TextField {...params} label={fieldLabels[field] || field} fullWidth />}
                  value={formState[field] || ""}
                  onChange={handleChange(field)}
                  onInputChange={(event, newValue) => handleChange(field)({ target: { value: newValue } })}
                />
              )}
            </Grid>
          ))}
        </Grid>

        {error && <Alert severity="error" sx={{ marginTop: 2 }}>{error.message}</Alert>}
        {successMessage && <Alert severity="success" sx={{ marginTop: 2 }}>{successMessage}</Alert>}

        <Box sx={{ textAlign: "center", marginTop: 2 }}>
          <Button type="submit" variant="contained" color="primary">Generate</Button>
          <Button onClick={handleDownload} variant="outlined" color="secondary" sx={{ marginLeft: 2 }}>Download Report</Button>
        </Box>
      </form>
    </Box>
  );
};

export default ReportForm;
