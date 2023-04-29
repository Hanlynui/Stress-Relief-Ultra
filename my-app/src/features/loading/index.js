import React from "react";
import loadingGif from "./loading-2.gif";

const LoadingScreen = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <img src={loadingGif} alt="Loading..." />
    </div>
  );
};

export default LoadingScreen;
