import React from "react";
import LibverseTourViewer from "./components/LibverseTourViewer.jsx";
import LibverseMinimap from "./components/LibverseMinimap.jsx";
import { useLibverseFloorData } from "./hooks/useLibverseFloorData.js";

export default function LibverseApp() {
  const API_BASE_URL = "http://localhost:8000";
  
  const {
    currentFloor,
    currentNode,
    nodesData,
    isLoading,
    error,
    handleNodeTransition,
  } = useLibverseFloorData("eliboutside", API_BASE_URL);

  return (
    <div style={styles.appWrapper}>
      {isLoading && <div style={styles.overlay}>Loading tour dataset...</div>}
      {error && <div style={styles.overlay}>Error: {error}</div>}

      {!isLoading && !error && currentNode && (
        <>
          <LibverseTourViewer
            currentNode={currentNode}
            allNodes={nodesData}
            onNavigate={handleNodeTransition}
            apiBaseUrl={API_BASE_URL}
          />

          <LibverseMinimap
            currentNode={currentNode}
            allNodes={nodesData}
            onNavigate={handleNodeTransition}
            floorMapUrl={`${API_BASE_URL}/assets/maps/${currentFloor}.jpg`}
          />
        </>
      )}
    </div>
  );
}

const styles = {
  appWrapper: {
    width: "100vw",
    height: "100vh",
    backgroundColor: "#111111",
    position: "relative",
    overflow: "hidden",
  },
  overlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    color: "#ffffff",
    fontFamily: "sans-serif",
    fontSize: "18px",
    zIndex: 100,
  },
};