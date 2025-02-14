import React from "react";
import { motion } from "framer-motion";

const InfinityLoader = () => {
  return (
    <div style={styles.container}>
      <motion.div
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        }}
        style={styles.infinity}
      />
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    zIndex: 9999,
  },
  infinity: {
    width: "80px",
    height: "40px",
    borderRadius: "50%",
    border: "5px solid transparent",
    borderTop: "5px solid blue",
    borderBottom: "5px solid blue",
  },
};

export default InfinityLoader;
