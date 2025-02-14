import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { TextField, Button, Grid, Box, Typography, Card, CardContent } from "@mui/material";

const SpecificReportPage = () => {
  const { reportType } = useParams();
  const [form, setForm] = useState({});

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Render different fields based on the report type
  const renderFields = () => {
    switch (reportType) {
      case "fore-closure-report":
        return (
          <>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Branch ID"
                name="branchId"
                value={form.branchId || ""}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Region"
                name="region"
                value={form.region || ""}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
          </>
        );
      case "borrower-master-report":
        return (
          <>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Branch Name"
                name="branchName"
                value={form.branchName || ""}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Cluster Name"
                name="clusterName"
                value={form.clusterName || ""}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
          </>
        );
      case "credit-report":
        return (
          <>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Branch ID Name"
                name="branchIdName"
                value={form.branchIdName || ""}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Credit Application Status"
                name="creditAppStatus"
                value={form.creditAppStatus || ""}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Application Date"
                type="date"
                name="appDate"
                value={form.appDate || ""}
                onChange={handleChange}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </>
        );
      case "loan-application-report":
        return (
          <>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Branch Name"
                name="branchName"
                value={form.branchName || ""}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Application Status"
                name="appStatus"
                value={form.appStatus || ""}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Application Date"
                type="date"
                name="appDate"
                value={form.appDate || ""}
                onChange={handleChange}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date Range"
                type="date"
                name="dateRange"
                value={form.dateRange || ""}
                onChange={handleChange}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </>
        );
      case "employee-master-report":
        return (
          <>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Branch ID Name"
                name="branchIdName"
                value={form.branchIdName || ""}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Area ID Name"
                name="areaIdName"
                value={form.areaIdName || ""}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Region ID Name"
                name="regionIdName"
                value={form.regionIdName || ""}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Cluster ID Name"
                name="clusterIdName"
                value={form.clusterIdName || ""}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
          </>
        );
      case "death-report":
        return (
          <>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Cluster"
                name="cluster"
                value={form.cluster || ""}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Region"
                name="region"
                value={form.region || ""}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Branch"
                name="branch"
                value={form.branch || ""}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
          </>
        );
      default:
        return <div>Report Not Found</div>;
    }
  };

  const handleSubmit = () => {
    // Implement form submission logic here
    alert("Report submitted");
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="#f4f6f8">
      <Card sx={{ width: 550, p: 3, boxShadow: 4, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h5" textAlign="center" gutterBottom fontWeight="bold">
            {reportType.replace(/-/g, " ")}
          </Typography>
          <Grid container spacing={2}>
            {renderFields()}
          </Grid>
          <Box mt={3} display="flex" justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              sx={{
                py: 1.8,
                px: 4,
                fontSize: "18px",
                fontWeight: "bold",
                textTransform: "none",
                width: "60%",
                borderRadius: 2,
              }}
            >
              Submit Report
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SpecificReportPage;
