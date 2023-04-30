import React from "react";
import loadingVideo from "./waiting.mp4";

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
      <video
        src={loadingVideo}
        style={{
          borderRadius: "2rem",
          width: "100%",
          maxWidth: "640px",
          height: "auto",
        }}
        autoPlay
        loop
        muted
        playsInline
      />
    </div>
  );
};

export default LoadingScreen;
