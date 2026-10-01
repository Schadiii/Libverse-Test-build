import React, { useMemo, useState } from "react";
import {
  Building2,
  ChevronDown,
  Compass,
  Info,
  Map,
  Maximize2,
  Search,
  X,
} from "lucide-react";
import LibverseTourViewer from "./components/LibverseTourViewer.jsx";
import LibverseDirectory from "./components/LibverseDirectory.jsx";
import LibverseFloorMap from "./components/LibverseFloorMap.jsx";
import LibverseDestinationPanel from "./components/LibverseDestinationPanel.jsx";
import { useLibverseFloorData } from "./hooks/useLibverseFloorData.js";
import { useLibverseDirectoryData } from "./hooks/useLibverseDirectoryData.js";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const FLOORS = [
  { id: "eliboutside", label: "Outside", short: "OUT" },
  { id: "f1", label: "Floor 1", short: "F1" },
];

function floorLabel(floorId) {
  return FLOORS.find((f) => f.id === floorId)?.label || floorId;
}

export default function LibverseApp() {
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [floorOpen, setFloorOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [kioskMode, setKioskMode] = useState(false);

  const {
    currentFloor,
    currentNode,
    nodesData,
    isLoading,
    error,
    handleNodeTransition,
    setCurrentFloor,
  } = useLibverseFloorData("eliboutside", API_BASE_URL);

  const {
    allNodesByFloor,
    allNodes,
    searchResults,
    route,
    routeDistance,
    routeNodeCount,
  } = useLibverseDirectoryData({
    apiBaseUrl: API_BASE_URL,
    currentFloor,
    currentNode,
    query: search,
    selectedDestination,
    floors: FLOORS.map((f) => f.id),
  });

  const floorMapUrl = `${API_BASE_URL}/assets/maps/${currentFloor}.jpg`;

  const navigateToNode = (node) => {
    if (!node) return;
    setSelectedDestination(null);
    setSearch("");
    setDirectoryOpen(false);
    handleNodeTransition(node.id, node.floor || currentFloor);
  };

  const selectSearchResult = (node) => {
    setSelectedDestination(node);
    setSearch("");
    setDirectoryOpen(false);
  };

  const changeFloor = (floorId) => {
    setFloorOpen(false);
    setSelectedDestination(null);
    if (floorId !== currentFloor) {
      setCurrentFloor(floorId);
    }
  };

  const activeRoute = useMemo(
    () => route.map((item) => item.node),
    [route]
  );

  return (
    <main className={`libverse-app ${kioskMode ? "libverse-kiosk" : ""}`}>
      <section className="libverse-viewer">
        <LibverseTourViewer
          currentNode={currentNode}
          allNodes={nodesData}
          onNavigate={handleNodeTransition}
          apiBaseUrl={API_BASE_URL}
          routeNodeIds={activeRoute.map((n) => n.id)}
        />
      </section>

      <header className="libverse-topbar">
        <div className="libverse-brand">
          <div className="libverse-brand-mark">L</div>
          <div>
            <strong>LIBVERSE</strong>
            <small>360 DIRECTORY</small>
          </div>
        </div>

        <div className="libverse-search">
          <Search size={19} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onFocus={() => setDirectoryOpen(true)}
            placeholder="Search rooms, facilities, exits..."
            aria-label="Search destinations"
          />
          {search && (
            <button
              className="libverse-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={17} />
            </button>
          )}

          {search && searchResults.length > 0 && (
            <div className="libverse-search-results">
              {searchResults.slice(0, 8).map((node) => (
                <button
                  key={`${node.floor}:${node.id}`}
                  className="libverse-search-result"
                  onClick={() => selectSearchResult(node)}
                >
                  <span className="libverse-search-result-icon">
                    <Building2 size={18} />
                  </span>
                  <span>
                    <strong>{node.displayName}</strong>
                    <span>
                      {floorLabel(node.floor)} · {node.categoryLabel}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="libverse-top-actions">
          <button
            className="libverse-floor-button"
            onClick={() => {
              setFloorOpen((value) => !value);
              setDirectoryOpen(false);
            }}
            aria-label="Select floor"
          >
            <Map size={18} />
            {floorLabel(currentFloor)}
            <ChevronDown size={15} />
          </button>

          <button
            className="libverse-icon-button"
            onClick={() => setDirectoryOpen((value) => !value)}
            aria-label="Open directory"
            title="Directory"
          >
            <Search size={19} />
          </button>

          <button
            className="libverse-icon-button"
            onClick={() => setMapOpen(true)}
            aria-label="Open floor map"
            title="Floor map"
          >
            <Maximize2 size={18} />
          </button>
        </div>

        {floorOpen && (
          <div className="libverse-floor-menu">
            {FLOORS.map((floor) => (
              <button
                key={floor.id}
                className={`libverse-floor-option ${
                  floor.id === currentFloor ? "active" : ""
                }`}
                onClick={() => changeFloor(floor.id)}
              >
                <strong>{floor.label}</strong>
                <span>{floor.short}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {directoryOpen && (
        <LibverseDirectory
          currentFloor={currentFloor}
          currentNode={currentNode}
          nodes={allNodes}
          onClose={() => setDirectoryOpen(false)}
          onSelect={setSelectedDestination}
          onNavigate={navigateToNode}
        />
      )}

      <LibverseFloorMap
        currentFloor={currentFloor}
        currentNode={currentNode}
        nodes={nodesData}
        routeNodes={activeRoute.filter((n) => n.floor === currentFloor)}
        floorMapUrl={floorMapUrl}
        onNavigate={(node) => setSelectedDestination(node)}
        onExpand={() => setMapOpen(true)}
      />

      {mapOpen && (
        <div className="libverse-map-fullscreen">
          <div className="libverse-map-fullscreen-inner">
            <div className="libverse-map-fullscreen-header">
              <div className="libverse-map-fullscreen-title">
                <strong>Directory Map</strong>
                <span>{floorLabel(currentFloor)}</span>
              </div>
              <button
                className="libverse-map-close"
                onClick={() => setMapOpen(false)}
                aria-label="Close map"
              >
                <X size={19} />
              </button>
            </div>

            <LibverseFloorMap
              fullscreen
              currentFloor={currentFloor}
              currentNode={currentNode}
              nodes={nodesData}
              routeNodes={activeRoute.filter(
                (n) => n.floor === currentFloor
              )}
              floorMapUrl={floorMapUrl}
              onNavigate={(node) => setSelectedDestination(node)}
              onExpand={() => setMapOpen(false)}
            />
          </div>
        </div>
      )}

      {selectedDestination && (
        <LibverseDestinationPanel
          destination={selectedDestination}
          currentNode={currentNode}
          currentFloor={currentFloor}
          routeDistance={routeDistance}
          routeNodeCount={routeNodeCount}
          route={route}
          onNavigate={() => navigateToNode(selectedDestination)}
          onClose={() => setSelectedDestination(null)}
        />
      )}

      <div className="libverse-viewer-hint">
        Drag to look around · Click navigation arrows to move · Scroll to zoom
      </div>

      <button
        className="libverse-kiosk-toggle"
        onClick={() => setKioskMode((value) => !value)}
      >
        <Compass size={17} />
        {kioskMode ? "Exit kiosk mode" : "Kiosk mode"}
      </button>

      {(isLoading || !currentNode) && (
        <div className="libverse-status">
          <div className="libverse-status-card">
            {isLoading ? (
              <>
                <div className="libverse-spinner" />
                <h2>Loading Libverse</h2>
                <p>Preparing the 360 view and directory.</p>
              </>
            ) : (
              <>
                <h2>No panorama available</h2>
                <p>Select another floor or check the node dataset.</p>
              </>
            )}
          </div>
        </div>
      )}

      {error && !isLoading && (
        <div className="libverse-status">
          <div className="libverse-status-card">
            <h2>Unable to load Libverse</h2>
            <p>{error}</p>
            <button
              className="libverse-secondary"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      )}
    </main>
  );
}