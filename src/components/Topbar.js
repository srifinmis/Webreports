import React from "react";

const Topbar = () => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "50px",
        backgroundColor: "#000957",
        display: "flex",
        alignItems: "center",
        zIndex: 1000,
        paddingLeft: "16px",
      }}
    >
      {/* Logo with white background */}
      <div
        style={{
          width: "160px",
          height: "40px",
          backgroundColor: "#ffffff", // White background for the logo
          borderRadius: "8px", // Optional: rounded corners
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginRight: "40px", // Space between the logo and the text
        }}
      >
        <img
          src="./SriFin_Logo.png" // Replace with your actual logo path
          alt="Logo"
          style={{
            width: "100px", // Adjust the size inside the white box
            height: "30px",
          }}
        />
      </div>

      {/* Static page title */}
      <h2
        style={{
          color: "#FFFFFF",
          margin: 10,
          fontWeight: "normal",
          fontSize: "22px",
        }}
      >
        Reports
      </h2>
    </div>
  );
};

export default Topbar;
