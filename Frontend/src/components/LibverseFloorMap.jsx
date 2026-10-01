import React, { useEffect, useMemo, useRef, useState } from "react";
import { Expand, MapPin, Accessibility, DoorOpen, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

function StairsIcon({ size = 24, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 20h4v-4h4v-4h4V8h4" />
      <path d="M4 16h4" />
      <path d="M8 12h4" />
      <path d="M12 8h4" />
    </svg>
  );
}

const PX_PER_METER = 50;

function imageBounds(imageSize) {
  if (!imageSize?.width || !imageSize?.height) {
    return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  }

  return {
    minX: 0,
    maxX: imageSize.width / PX_PER_METER,
    minY: 0,
    maxY: imageSize.height / PX_PER_METER,
  };
}

function fallbackBounds(nodes) {
  if (!nodes.length) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };

  const xs = nodes.map((node) => Number(node.x) || 0);
  const ys = nodes.map((node) => Number(node.y) || 0);
  return {
    minX: 0,
    maxX: Math.max(...xs, 1),
    minY: 0,
    maxY: Math.max(...ys, 1),
  };
}

function position(node, bounds) {
  const x = Number(node?.x) || 0;
  const y = Number(node?.y) || 0;
  const rangeX = Math.max(bounds.maxX - bounds.minX, 1e-6);
  const rangeY = Math.max(bounds.maxY - bounds.minY, 1e-6);

  return {
    left: `${Math.max(0, Math.min(100, ((x - bounds.minX) / rangeX) * 100))}%`,
    top: `${Math.max(0, Math.min(100, 100 - ((y - bounds.minY) / rangeY) * 100))}%`,
  };
}

export default function LibverseFloorMap({
  currentFloor,
  currentNode,
  nodes,
  routeNodes = [],
  floorMapUrl,
  onNavigate,
  onExpand,
  fullscreen = false,
}) {
  const [imageSize, setImageSize] = useState(null);
  const [mapTransform, setMapTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef(null);
  const viewportRef = useRef(null);

  useEffect(() => {
    setImageSize(null);
    setMapTransform({ x: 0, y: 0, scale: 1 });
  }, [floorMapUrl]);

  const bounds = useMemo(
    () => imageSize ? imageBounds(imageSize) : fallbackBounds(nodes),
    [imageSize, nodes]
  );

  const routePoints = routeNodes.map((node) => {
    const p = position(node, bounds);
    return { x: parseFloat(p.left), y: parseFloat(p.top) };
  });

  const updateZoom = (delta) => {
    setMapTransform((current) => ({
      ...current,
      scale: Math.max(0.75, Math.min(3, current.scale + delta)),
    }));
  };

  const resetMap = () => setMapTransform({ x: 0, y: 0, scale: 1 });

  const onPointerDown = (event) => {
    if (!fullscreen || event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: mapTransform.x,
      originY: mapTransform.y,
    };
  };

  const onPointerMove = (event) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    setMapTransform((current) => ({
      ...current,
      x: dragRef.current.originX + dx,
      y: dragRef.current.originY + dy,
    }));
  };

  const endDrag = (event) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  };

  const onWheel = (event) => {
    if (!fullscreen) return;
    event.preventDefault();
    updateZoom(event.deltaY < 0 ? 0.12 : -0.12);
  };

  const mapContentStyle = {
    aspectRatio: imageSize ? `${imageSize.width} / ${imageSize.height}` : "auto",
    transform: fullscreen
      ? `translate3d(${mapTransform.x}px, ${mapTransform.y}px, 0) scale(${mapTransform.scale})`
      : undefined,
  };

  return (
    <div className={fullscreen ? "libverse-map-canvas libverse-map-canvas-fullscreen" : "libverse-map-card"}>
      {!fullscreen && (
        <div className="libverse-map-card-header">
          <div className="libverse-map-title">
            <strong>Directory Map</strong>
            <span>{currentFloor}</span>
          </div>
          <button className="libverse-map-expand" onClick={onExpand} aria-label="Expand map">
            <Expand size={16} />
          </button>
        </div>
      )}

      <div
        ref={viewportRef}
        className="libverse-map-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
      >
        <div className="libverse-map-content" style={mapContentStyle}>
          <img
            src={floorMapUrl}
            alt={`${currentFloor} floor map`}
            draggable={false}
            onLoad={(event) => {
              const { naturalWidth, naturalHeight } = event.currentTarget;
              if (naturalWidth && naturalHeight) {
                setImageSize({ width: naturalWidth, height: naturalHeight });
              }
            }}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />

          {routePoints.length > 1 && (
            <div className="libverse-map-route">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline points={routePoints.map((p) => `${p.x},${p.y}`).join(" ")} />
              </svg>
            </div>
          )}

          {nodes.map((node) => {
            const p = position(node, bounds);
            const isCurrent = node.id === currentNode?.id;
            const isPortal = ["stair", "pwd"].includes(node.type);

            return (
              <button
                key={node.id}
                className={`libverse-node-marker ${isCurrent ? "selected" : ""} ${isPortal ? "portal" : ""}`}
                style={p}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                  event.stopPropagation();
                  onNavigate?.(node);
                }}
                title={node.name || node.title || node.id}
                aria-label={node.name || node.title || node.id}
              />
            );
          })}

          {currentNode && (
            <div className="libverse-you-are-here" style={position(currentNode, bounds)} title="You are here" />
          )}
        </div>

        <div className="libverse-map-legend">
          <span><MapPin size={9} /> You</span>
          <span><StairsIcon size={9} /> Stairs</span>
          <span><Accessibility size={9} /> PWD</span>
          <span><DoorOpen size={9} /> Door</span>
        </div>

        {fullscreen && (
          <div className="libverse-map-zoom-controls">
            <button onClick={() => updateZoom(0.15)} aria-label="Zoom in"><ZoomIn size={17} /></button>
            <button onClick={() => updateZoom(-0.15)} aria-label="Zoom out"><ZoomOut size={17} /></button>
            <button onClick={resetMap} aria-label="Reset map"><RotateCcw size={17} /></button>
          </div>
        )}
      </div>
    </div>
  );
}
