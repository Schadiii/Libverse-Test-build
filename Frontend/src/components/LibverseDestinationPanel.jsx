import React from "react";
import { ArrowRight, MapPin, Route, X } from "lucide-react";

export default function LibverseDestinationPanel({
  destination,
  currentNode,
  routeDistance,
  routeNodeCount,
  route,
  onNavigate,
  onClose,
}) {
  const sameNode = currentNode?.id === destination?.id;

  return (
    <section className="libverse-destination-sheet">
      <div className="libverse-panel-header">
        <div>
          <h3>{destination.displayName || destination.title || destination.id}</h3>
          <p>
            {destination.floor} ·{" "}
            {destination.categoryLabel || destination.type || "Destination"}
          </p>
        </div>
        <button className="libverse-panel-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="libverse-route-summary">
        <span className="libverse-route-chip">
          <MapPin size={11} /> {destination.zone || "Main area"}
        </span>

        {sameNode ? (
          <span className="libverse-route-chip">You are here</span>
        ) : route.length ? (
          <>
            <span className="libverse-route-chip">
              <Route size={11} /> {routeNodeCount} nodes
            </span>
            <span className="libverse-route-chip">
              ~{routeDistance.toFixed(0)} m
            </span>
          </>
        ) : (
          <span className="libverse-route-chip">Route unavailable</span>
        )}
      </div>

      {!sameNode && route.length > 0 && (
        <button className="libverse-primary" onClick={onNavigate}>
          Start navigation
          <ArrowRight size={17} />
        </button>
      )}

      {sameNode && (
        <button className="libverse-primary" onClick={onClose}>
          You are here
        </button>
      )}

      {!sameNode && route.length === 0 && (
        <button className="libverse-secondary" onClick={onClose}>
          Close
        </button>
      )}
    </section>
  );
}