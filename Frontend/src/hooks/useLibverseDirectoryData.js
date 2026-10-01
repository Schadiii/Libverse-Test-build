import { useEffect, useMemo, useState } from "react";
import { getConnectedNodes } from "../utils/LibverseHotspotCalculator.js";

function normalizeNode(node) {
  const displayName =
    node.name ||
    node.label ||
    (node.title || "").replace(/\s*\((standard|door|stair|pwd)\)\s*$/i, "") ||
    node.id;

  const categoryMap = {
    standard: "Destination",
    door: "Entrance / Door",
    stair: "Stairs",
    pwd: "Accessible / PWD",
  };

  const categoryLabel =
    node.category ||
    node.typeLabel ||
    categoryMap[node.type] ||
    "Destination";

  return {
    ...node,
    displayName,
    categoryLabel,
    searchText: [
      displayName,
      node.id,
      node.title,
      node.zone,
      node.type,
      node.category,
      categoryLabel,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

function getTargets(node) {
  if (!node) return [];

  if (Array.isArray(node.targetNodes)) {
    return node.targetNodes
      .map((target) => {
        if (typeof target === "string") {
          return { id: target, floor: node.floor };
        }
        return {
          id: target?.targetNodeId,
          floor: target?.targetFloor || node.floor,
        };
      })
      .filter((target) => target.id);
  }

  if (node.targetNodeId) {
    return [{ id: node.targetNodeId, floor: node.targetFloor || node.floor }];
  }

  return [];
}

function buildGraph(allNodesByFloor) {
  const graph = new Map();

  Object.entries(allNodesByFloor).forEach(([floor, nodes]) => {
    nodes.forEach((node) => {
      const key = `${floor}:${node.id}`;
      graph.set(key, []);
    });
  });

  Object.entries(allNodesByFloor).forEach(([floor, nodes]) => {
    nodes.forEach((node) => {
      const sourceKey = `${floor}:${node.id}`;

      getTargets(node).forEach((target) => {
        const targetKey = `${target.floor}:${target.id}`;
        if (!graph.has(targetKey)) return;

        graph.get(sourceKey).push(targetKey);

        // Make ordinary node links navigable both directions even if the
        // exported JSON only contains one side of the connection.
        if (!graph.get(targetKey).includes(sourceKey)) {
          graph.get(targetKey).push(sourceKey);
        }
      });
    });
  });

  return graph;
}

function shortestPath(allNodesByFloor, start, destination) {
  if (!start || !destination) return [];

  const startKey = `${start.floor}:${start.id}`;
  const destinationKey = `${destination.floor}:${destination.id}`;

  if (startKey === destinationKey) {
    return [{ node: start, edgeFromPrevious: null }];
  }

  const graph = buildGraph(allNodesByFloor);
  const queue = [startKey];
  const visited = new Set([startKey]);
  const previous = new Map();

  while (queue.length) {
    const currentKey = queue.shift();

    if (currentKey === destinationKey) break;

    for (const nextKey of graph.get(currentKey) || []) {
      if (visited.has(nextKey)) continue;

      visited.add(nextKey);
      previous.set(nextKey, currentKey);
      queue.push(nextKey);
    }
  }

  if (!visited.has(destinationKey)) return [];

  const pathKeys = [];
  let cursor = destinationKey;

  while (cursor) {
    pathKeys.unshift(cursor);
    cursor = previous.get(cursor);
  }

  const nodeLookup = new Map();

  Object.entries(allNodesByFloor).forEach(([floor, nodes]) => {
    nodes.forEach((node) => {
      nodeLookup.set(`${floor}:${node.id}`, node);
    });
  });

  return pathKeys.map((key, index) => ({
    node: nodeLookup.get(key),
    edgeFromPrevious: index === 0 ? null : pathKeys[index - 1],
  }));
}

function nodeDistance(a, b) {
  if (!a || !b) return 0;

  const dx = Number(a.x || 0) - Number(b.x || 0);
  const dy = Number(a.y || 0) - Number(b.y || 0);

  return Math.sqrt(dx * dx + dy * dy);
}

export function useLibverseDirectoryData({
  apiBaseUrl,
  currentFloor,
  currentNode,
  query,
  selectedDestination,
  floors,
}) {
  const [allNodesByFloor, setAllNodesByFloor] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadDirectoryData() {
      setLoading(true);

      const entries = await Promise.all(
        floors.map(async (floor) => {
          try {
            const response = await fetch(
              `${apiBaseUrl}/api/floors/${floor}/nodes`
            );

            if (!response.ok) return [floor, []];

            const data = await response.json();
            return [
              floor,
              (Array.isArray(data.nodes) ? data.nodes : []).map(normalizeNode),
            ];
          } catch {
            return [floor, []];
          }
        })
      );

      if (mounted) {
        setAllNodesByFloor(Object.fromEntries(entries));
        setLoading(false);
      }
    }

    loadDirectoryData();

    return () => {
      mounted = false;
    };
  }, [apiBaseUrl, floors.join("|")]);

  const allNodes = useMemo(
    () => Object.values(allNodesByFloor).flat(),
    [allNodesByFloor]
  );

  const searchResults = useMemo(() => {
    const term = (query || "").trim().toLowerCase();

    if (!term) return [];

    return allNodes
      .filter((node) => node.searchText.includes(term))
      .slice(0, 12);
  }, [allNodes, query]);

  const route = useMemo(() => {
    if (!selectedDestination || !currentNode) return [];

    return shortestPath(allNodesByFloor, currentNode, selectedDestination);
  }, [allNodesByFloor, currentNode, selectedDestination]);

  const routeDistance = useMemo(() => {
    if (route.length < 2) return 0;

    let total = 0;

    for (let index = 1; index < route.length; index += 1) {
      const from = route[index - 1].node;
      const to = route[index].node;

      if (from.floor === to.floor) {
        total += nodeDistance(from, to);
      }
    }

    return total;
  }, [route]);

  const routeNodeCount = Math.max(route.length - 1, 0);

  return {
    allNodesByFloor,
    allNodes,
    searchResults,
    route,
    routeDistance,
    routeNodeCount,
    loading,
  };
}

export { nodeDistance };