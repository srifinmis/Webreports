import React, { useState, useEffect } from "react";
import { Box, Grid, TextField, Button, MenuItem, Typography, Alert } from "@mui/material";
import InfinityLoader from "./InfinityLoader";

const ReportForm = () => {
  const [reportType, setReportType] = useState("");
  const [formState, setFormState] = useState({});
  const [customInputs, setCustomInputs] = useState({});
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [dropdownData, setDropdownData] = useState({});
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchData = async () => {
      if (!reportType) return;
      try {
        const endpoints = ["branches", "regions", "clusters", "areas", "creditAppStatuses", "appStatuses", "employeeStatuses"];
        const responses = await Promise.all(
          endpoints.map((endpoint) =>
            fetch(`http://localhost:5000/api/dropdowns/${endpoint}?reportType=${encodeURIComponent(reportType)}`)
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

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    if (value === "custom") {
      setCustomInputs((prev) => ({ ...prev, [field]: "" }));
    } else {
      setFormState((prev) => ({ ...prev, [field]: value }));
      setCustomInputs((prev) => {
        const newInputs = { ...prev };
        delete newInputs[field];
        return newInputs;
      });
    }
  };

  const handleCustomInputChange = (field) => (event) => {
    setCustomInputs((prev) => ({ ...prev, [field]: event.target.value }));
  };

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
        body: JSON.stringify({ reportType, ...formState, ...customInputs }),
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

  const reportFields = {
    "Fore Closure Report": ["branches", "regions"],
    "Borrower Master Report": ["branches", "clusters"],
    "Credit Report": ["branches", "creditAppStatus", "appStartDate", "appEndDate"],
    "Loan Application Report": ["branches", "appStatus", "appStartDate", "appEndDate"],
    "Employee Master Report": ["branches", "areas", "regions", "clusters", "employeeStatuses"],
    "Death Report": ["clusters", "branches", "regions", "appStartDate", "appEndDate"],
  };

  const fieldLabels = {
    branches: "Branch",
    regions: "Region",
    clusters: "Cluster",
    areas: "Area",
    creditAppStatus: "Credit App Status",
    appStatus: "Application Status",
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
                  label={fieldLabels[field] || field}
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formState[field] || ""}
                  onChange={handleChange(field)}
                  inputProps={{ max: today }}
                />
              ) : customInputs[field] !== undefined ? (
                <TextField
                  label={`Enter ${fieldLabels[field] || field}`}
                  fullWidth
                  value={customInputs[field]}
                  onChange={handleCustomInputChange(field)}
                />
              ) : (
                <TextField
                  label={fieldLabels[field] || field}
                  select
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={formState[field] || ""}
                  onChange={handleChange(field)}
                  list="listb"
                >
                  
                  {dropdownData[field]?.length > 0 ? (
    dropdownData[field].map((item, index) => (
      <MenuItem  key={index} value={item?.id || item?.name || item}>
        {item?.name || item?.id || item}
      </MenuItem>
    ))
  ) : (
    <MenuItem disabled>No options available</MenuItem>
  )}
                  <MenuItem value="custom">Custom Input</MenuItem>
                </TextField>
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


