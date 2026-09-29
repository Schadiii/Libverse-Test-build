import React, { useState, useEffect } from "react";
import LibverseTourViewer from "./components/LibverseTourViewer.jsx";

export default function LibverseApp() {
  const [currentFloor, setCurrentFloor] = useState("eliboutside");
  const [nodesData, setNodesData] = useState([]);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = "http://localhost:8000";

  // Fetch floor dataset from FastAPI LibverseServer
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`${API_BASE_URL}/api/floors/${currentFloor}/nodes`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch floor dataset`);
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;

        // Extract array from Python response format {"nodes": [...]}
        const nodesArray = data.nodes || [];
        setNodesData(nodesArray);

        // Preserve target node selection if it exists in the new floor dataset
        setCurrentNodeId((prevNodeId) => {
          const targetExistsInNewFloor = nodesArray.some((n) => n.id === prevNodeId);
          if (prevNodeId && targetExistsInNewFloor) {
            return prevNodeId;
          }
          return nodesArray.length > 0 ? nodesArray[0].id : null;
        });

        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Dataset load error:", err);
        setError(err.message);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentFloor]);

  const handleNodeTransition = (targetNodeId, targetFloor = null) => {
    if (!targetNodeId) return;

    if (targetFloor && targetFloor !== currentFloor) {
      setCurrentFloor(targetFloor);
      setCurrentNodeId(targetNodeId);
    } else {
      setCurrentNodeId(targetNodeId);
    }
  };

  const currentNode = nodesData.find((n) => n.id === currentNodeId);

  return (
    <div style={styles.appWrapper}>
      {isLoading && <div style={styles.overlay}>Loading tour dataset...</div>}
      {error && <div style={styles.overlay}>Error: {error}</div>}

      {!isLoading && !error && currentNode && (
        <LibverseTourViewer
          currentNode={currentNode}
          allNodes={nodesData}
          onNavigate={handleNodeTransition}
          apiBaseUrl={API_BASE_URL}
        />
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