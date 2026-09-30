import React, { useState, useMemo, useEffect } from "react";
import {
  getNodesBounds,
  calculateMinimapPosition,
  calculateRadarRotation,
} from "../utils/LibverseMinimapUtils.js";

export default function LibverseMinimap({
  currentNode,
  allNodes,
  onNavigate,
  floorMapUrl,
  pxPerMeter = 50,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingNode, setPendingNode] = useState(null);
  const [mapAspectRatio, setMapAspectRatio] = useState(null);
  const [floorDimensions, setFloorDimensions] = useState(null);

  // Reset image dimensions when changing floors / map image
  useEffect(() => {
    setFloorDimensions(null);
    setMapAspectRatio(null);
  }, [floorMapUrl]);

  // Calculates precise canvas bounds in meters using true image dimensions
  const bounds = useMemo(
    () => getNodesBounds(allNodes, floorDimensions, pxPerMeter),
    [allNodes, floorDimensions, pxPerMeter]
  );

  const radarRotation = calculateRadarRotation(currentNode);

  if (!Array.isArray(allNodes) || allNodes.length === 0) return null;

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      setMapAspectRatio(naturalWidth / naturalHeight);
      setFloorDimensions({ width: naturalWidth, height: naturalHeight });
    }
  };

  const handleNodeClick = (node, fromExpanded = false) => {
    if (fromExpanded) {
      setPendingNode(node);
    } else {
      onNavigate(node.id, node.floor);
    }
  };

  const confirmTravel = () => {
    if (pendingNode) {
      onNavigate(pendingNode.id, pendingNode.floor);
      setPendingNode(null);
      setIsExpanded(false);
    }
  };

  const renderNodeDots = (fromExpanded = false) => {
    return allNodes.map((node) => {
      const isSelected = currentNode && node.id === currentNode.id;
      const pos = calculateMinimapPosition(node, bounds);

      return (
        <div
          key={node.id}
          onClick={() => handleNodeClick(node, fromExpanded)}
          style={{
            ...styles.nodeDot,
            left: pos.left,
            top: pos.top,
            backgroundColor: isSelected ? "#00e676" : "#ffffff",
            transform: isSelected
              ? "translate(-50%, -50%) scale(1.4)"
              : "translate(-50%, -50%)",
          }}
          title={node.title || node.id}
        >
          {isSelected && (
            <div
              style={{
                ...styles.radarCone,
                transform: `translate(-50%, -100%) rotate(${radarRotation}deg)`,
              }}
            />
          )}
        </div>
      );
    });
  };

  const dynamicContentStyle = {
    ...styles.mapContentContainer,
    aspectRatio: mapAspectRatio ? `${mapAspectRatio}` : "auto",
  };

  return (
    <>
      {/* 1. COMPACT MINIMAP (BOTTOM-RIGHT) */}
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>FLOOR MAP</span>
          <button
            style={styles.expandBtn}
            onClick={() => setIsExpanded(true)}
            title="Expand Map"
          >
            ⤢
          </button>
        </div>
        <div style={styles.mapWrapper}>
          <div style={dynamicContentStyle}>
            {floorMapUrl && (
              <img
                src={floorMapUrl}
                alt="Floorplan Minimap"
                style={styles.mapImage}
                onLoad={handleImageLoad}
              />
            )}
            {renderNodeDots(false)}
          </div>
        </div>
      </div>

      {/* 2. EXPANDED FULLSCREEN MAP OVERLAY */}
      {isExpanded && (
        <div style={styles.fullscreenOverlay}>
          <div style={styles.fullscreenModal}>
            <div style={styles.fullscreenHeader}>
              <span>EXPANDED FLOOR MAP</span>
              <button
                style={styles.closeBtn}
                onClick={() => {
                  setIsExpanded(false);
                  setPendingNode(null);
                }}
              >
                ✕
              </button>
            </div>
            <div style={styles.fullscreenMapWrapper}>
              <div style={dynamicContentStyle}>
                {floorMapUrl && (
                  <img
                    src={floorMapUrl}
                    alt="Expanded Floorplan"
                    style={styles.mapImage}
                    onLoad={handleImageLoad}
                  />
                )}
                {renderNodeDots(true)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. "TRAVEL?" CONFIRMATION MODAL */}
      {pendingNode && (
        <div style={styles.travelModalOverlay}>
          <div style={styles.travelCard}>
            <h3 style={{ margin: "0 0 16px 0", color: "#fff" }}>Travel?</h3>
            <div style={styles.travelActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => setPendingNode(null)}
              >
                Cancel
              </button>
              <button style={styles.confirmBtn} onClick={confirmTravel}>
                Go
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  container: {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    width: "260px",
    height: "200px",
    backgroundColor: "rgba(17, 24, 39, 0.9)",
    border: "1.5px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "8px",
    overflow: "hidden",
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 4px 16px rgba(0,0,0,0.6)",
  },
  header: {
    height: "26px",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: "0 8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: "11px",
    fontFamily: "sans-serif",
    fontWeight: "bold",
  },
  expandBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
  },
  mapWrapper: {
    position: "relative",
    flex: 1,
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  fullscreenMapWrapper: {
    position: "relative",
    flex: 1,
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: "16px",
  },
  mapContentContainer: {
    position: "relative",
    maxWidth: "100%",
    maxHeight: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  mapImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  },
  nodeDot: {
    position: "absolute",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    cursor: "pointer",
    transition: "transform 0.2s ease, background-color 0.2s ease",
    boxShadow: "0 0 4px rgba(0,0,0,0.8)",
    zIndex: 2,
  },
  radarCone: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "0",
    height: "0",
    borderLeft: "16px solid transparent",
    borderRight: "16px solid transparent",
    borderTop: "32px solid rgba(0, 230, 118, 0.4)",
    transformOrigin: "bottom center",
    pointerEvents: "none",
  },
  fullscreenOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    backdropFilter: "blur(6px)",
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  fullscreenModal: {
    width: "90vw",
    height: "85vh",
    backgroundColor: "#0f172a",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  fullscreenHeader: {
    height: "40px",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 16px",
    fontFamily: "sans-serif",
    fontWeight: "bold",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "20px",
    cursor: "pointer",
  },
  travelModalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 10000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  travelCard: {
    backgroundColor: "#1e293b",
    padding: "24px 32px",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    textAlign: "center",
    fontFamily: "sans-serif",
  },
  travelActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
  },
  cancelBtn: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#475569",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  },
  confirmBtn: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
