import React, { useEffect, useRef } from "react";
import { calculateHotspots } from "../utils/LibverseHotspotCalculator.js";

export default function LibverseTourViewer({
  currentNode,
  allNodes,
  onNavigate,
  apiBaseUrl = "http://localhost:8000",
}) {
  const viewerRef = useRef(null);
  const pannellumInstance = useRef(null);

  // 1. Initialize or rebuild Pannellum viewer graph when allNodes floor dataset changes
  useEffect(() => {
    if (!Array.isArray(allNodes) || allNodes.length === 0 || !window.pannellum) return;

    // Build scene graph for Pannellum from all nodes in current floor
    const scenesConfig = {};

    allNodes.forEach((node) => {
      const hotspots = calculateHotspots(node, allNodes);

      scenesConfig[node.id] = {
        title: node.title,
        type: "equirectangular",
        panorama: `${apiBaseUrl}${node.panorama}`,
        autoLoad: true,
        hotSpots: hotspots.map((hs) => ({
          pitch: hs.pitch,
          yaw: hs.yaw,
          type: "scene",
          text: hs.label,
          sceneId: hs.targetNodeId,
          clickHandlerArgs: {
            targetNodeId: hs.targetNodeId,
            targetFloor: hs.targetFloor,
          },
          clickHandlerFunc: (evt, args) => {
            if (onNavigate) onNavigate(args.targetNodeId, args.targetFloor);
          },
        })),
      };
    });

    // Destroy existing instance before re-initializing for a new floor dataset
    if (pannellumInstance.current) {
      pannellumInstance.current.destroy();
      pannellumInstance.current = null;
    }

    const initialSceneId = currentNode ? currentNode.id : allNodes[0].id;

    // Initialize Pannellum Viewer
    pannellumInstance.current = window.pannellum.viewer(viewerRef.current, {
      default: {
        firstScene: initialSceneId,
        sceneFadeDuration: 1000,
        autoLoad: true,
      },
      scenes: scenesConfig,
    });

    return () => {
      if (pannellumInstance.current) {
        pannellumInstance.current.destroy();
        pannellumInstance.current = null;
      }
    };
  }, [allNodes, apiBaseUrl]);

  // 2. Perform smooth scene loading when transitioning between nodes on the same floor
  useEffect(() => {
    if (!currentNode || !pannellumInstance.current) return;

    try {
      const activeScene = pannellumInstance.current.getScene();
      if (activeScene !== currentNode.id) {
        pannellumInstance.current.loadScene(currentNode.id);
      }
    } catch (err) {
      console.warn("Pannellum scene transition error:", err);
    }
  }, [currentNode]);

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div ref={viewerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}