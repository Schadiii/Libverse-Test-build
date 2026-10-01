import React, { useEffect, useRef } from "react";
import {
  Expand,
  LocateFixed,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import { calculateHotspots } from "../utils/LibverseHotspotCalculator.js";

export default function LibverseTourViewer({
  currentNode,
  allNodes,
  onNavigate,
  apiBaseUrl = "http://localhost:8000",
}) {
  const viewerRef = useRef(null);
  const pannellumInstance = useRef(null);

  useEffect(() => {
    if (
      !Array.isArray(allNodes) ||
      allNodes.length === 0 ||
      !window.pannellum ||
      !viewerRef.current
    ) {
      return undefined;
    }

    const scenes = {};

    allNodes.forEach((node) => {
      const hotspots = calculateHotspots(node, allNodes);

      scenes[node.id] = {
        title: node.name || node.title || node.id,
        type: "equirectangular",
        panorama: `${apiBaseUrl}${node.panorama}`,
        autoLoad: true,
        hotSpots: hotspots.map((hotspot) => ({
          pitch: hotspot.pitch,
          yaw: hotspot.yaw,
          type: "scene",
          text: hotspot.label,
          sceneId: hotspot.targetNodeId,
          cssClass: hotspot.isPortal
            ? "libverse-portal"
            : "libverse-navigation",
          clickHandlerArgs: {
            targetNodeId: hotspot.targetNodeId,
            targetFloor: hotspot.targetFloor,
          },
          clickHandlerFunc: (_event, args) => {
            onNavigate?.(args.targetNodeId, args.targetFloor);
          },
        })),
      };
    });

    if (pannellumInstance.current) {
      pannellumInstance.current.destroy();
    }

    pannellumInstance.current = window.pannellum.viewer(viewerRef.current, {
      default: {
        firstScene: currentNode?.id || allNodes[0].id,
        sceneFadeDuration: 700,
        autoLoad: true,
        compass: false,
        showControls: false,
        hfov: 100,
      },
      scenes,
      // Explicitly keep direct mouse/touch navigation enabled.
      draggable: true,
      mouseZoom: true,
      keyboardZoom: true,
      doubleClickZoom: true,
    });

    return () => {
      if (pannellumInstance.current) {
        pannellumInstance.current.destroy();
        pannellumInstance.current = null;
      }
    };
  }, [allNodes, apiBaseUrl, onNavigate, currentNode?.id]);

  useEffect(() => {
    if (!currentNode || !pannellumInstance.current) return;

    try {
      if (pannellumInstance.current.getScene() !== currentNode.id) {
        pannellumInstance.current.loadScene(currentNode.id);
      }
    } catch (error) {
      console.warn("Pannellum scene transition failed:", error);
    }
  }, [currentNode]);

  const viewerAction = (action) => {
    const viewer = pannellumInstance.current;
    if (!viewer) return;

    try {
      if (action === "zoomIn") viewer.setHfov(Math.max(45, viewer.getHfov() - 10));
      if (action === "zoomOut") viewer.setHfov(Math.min(120, viewer.getHfov() + 10));
      if (action === "reset") {
        viewer.setYaw(currentNode?.heading || 0);
        viewer.setPitch(0);
        viewer.setHfov(100);
      }
      if (action === "center") {
        viewer.setYaw(currentNode?.heading || 0);
        viewer.setPitch(0);
      }
      if (action === "fullscreen") {
        viewer.toggleFullscreen();
      }
    } catch (error) {
      console.warn("Viewer control failed:", error);
    }
  };

  return (
    <div className="libverse-tour-viewer">
      <div
        ref={viewerRef}
        className="libverse-pannellum-host"
        aria-label="Libverse 360 panorama"
      />

      <div className="libverse-viewer-toolbar">
        <button onClick={() => viewerAction("zoomIn")} title="Zoom in">
          <Plus size={18} />
        </button>
        <button onClick={() => viewerAction("zoomOut")} title="Zoom out">
          <Minus size={18} />
        </button>
        <button onClick={() => viewerAction("center")} title="Face forward">
          <LocateFixed size={18} />
        </button>
        <button onClick={() => viewerAction("reset")} title="Reset view">
          <RotateCcw size={18} />
        </button>
        <button onClick={() => viewerAction("fullscreen")} title="Fullscreen">
          <Expand size={18} />
        </button>
      </div>
    </div>
  );
}
