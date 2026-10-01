import React, { useMemo, useState } from "react";
import {
  Accessibility,
  Building2,
  DoorOpen,
  Search,
  X,
} from "lucide-react";

const StairsIcon = ({ size = 24, ...props }) => (
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

const CATEGORIES = [
  { id: "all", label: "All", icon: Building2 },
  { id: "standard", label: "Destinations", icon: Building2 },
  { id: "door", label: "Entrances", icon: DoorOpen },
  { id: "stair", label: "Stairs", icon: StairsIcon },
  { id: "pwd", label: "Accessible", icon: Accessibility },
];

export default function LibverseDirectory({
  currentFloor,
  nodes,
  onClose,
  onSelect,
  onNavigate,
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const floorNodes = useMemo(
    () => nodes.filter((node) => node.floor === currentFloor),
    [nodes, currentFloor]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return floorNodes
      .filter((node) => category === "all" || node.type === category)
      .filter((node) => {
        if (!term) return true;
        return [
          node.displayName,
          node.title,
          node.name,
          node.zone,
          node.type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .slice(0, 50);
  }, [floorNodes, query, category]);

  return (
    <aside className="libverse-directory-panel">
      <div className="libverse-panel-header">
        <div>
          <h2>Directory</h2>
          <p>Find a destination on {currentFloor}.</p>
        </div>
        <button className="libverse-panel-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div className="libverse-directory-search">
        <Search size={17} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search this floor..."
          autoFocus
        />
      </div>

      <div className="libverse-category-grid">
        {CATEGORIES.map(({ id, label, icon: Icon }) => {
          const count =
            id === "all"
              ? floorNodes.length
              : floorNodes.filter((node) => node.type === id).length;

          return (
            <button
              key={id}
              className={`libverse-category ${
                category === id ? "active" : ""
              }`}
              onClick={() => setCategory(id)}
            >
              <span className="libverse-directory-category-icon">
                <Icon size={17} />
              </span>
              <strong>{label}</strong>
              <span>{count} locations</span>
            </button>
          );
        })}
      </div>

      <div className="libverse-destination-list">
        {filtered.map((node) => (
          <button
            key={node.id}
            className="libverse-destination"
            onClick={() => {
              onSelect(node);
            }}
          >
            <div className="libverse-destination-top">
              <span className="libverse-destination-icon">
                {node.type === "stair" ? (
                  <StairsIcon size={18} />
                ) : node.type === "pwd" ? (
                  <Accessibility size={18} />
                ) : node.type === "door" ? (
                  <DoorOpen size={18} />
                ) : (
                  <Building2 size={18} />
                )}
              </span>
              <span>
                <strong>{node.displayName}</strong>
                <small>{node.categoryLabel || node.type}</small>
              </span>
            </div>

            <div className="libverse-destination-meta">
              <span>{node.zone || "Main area"}</span>
              <span>·</span>
              <span>{node.id}</span>
            </div>
          </button>
        ))}

        {!filtered.length && (
          <p style={{ color: "var(--lv-muted)", fontSize: 12 }}>
            No destinations match this search.
          </p>
        )}
      </div>
    </aside>
  );
}