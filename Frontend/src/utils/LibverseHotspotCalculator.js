/**
 * LibverseHotspotCalculator.js
 * Utility for parsing graph node datasets, calculating spatial adjacency,
 * and generating dynamic hotspot configurations for 360 viewer layers.
 */

/**
 * Calculates connected targets for a given node based strictly on explicit connections in targetNodes.
 */
export function getConnectedNodes(currentNode, allNodes) {
  if (!currentNode || !Array.isArray(allNodes)) return [];

  const connected = [];
  const explicitTargets = [];

  // Collect target IDs from targetNodes array OR legacy targetNodeId string
  if (Array.isArray(currentNode.targetNodes)) {
    currentNode.targetNodes.forEach((target) => {
      if (typeof target === "string") {
        explicitTargets.push({
          targetNodeId: target,
          targetFloor: currentNode.targetFloor || null,
          label: null,
        });
      } else if (typeof target === "object" && target && target.targetNodeId) {
        explicitTargets.push({
          targetNodeId: target.targetNodeId,
          targetFloor: target.targetFloor || currentNode.targetFloor || null,
          label: target.label || null,
        });
      }
    });
  } else if (currentNode.targetNodeId) {
    // Support legacy single string format
    explicitTargets.push({
      targetNodeId: currentNode.targetNodeId,
      targetFloor: currentNode.targetFloor || null,
      label: null,
    });
  }

  // Resolve target nodes from explicit target entries only
  explicitTargets.forEach((targetObj) => {
    const matchedNode = allNodes.find((n) => n.id === targetObj.targetNodeId);
    const isInterFloor = Boolean(targetObj.targetFloor && targetObj.targetFloor !== currentNode.floor);

    connected.push({
      node: matchedNode || null,
      isPortal: isInterFloor || (currentNode.type === "stair" || currentNode.type === "pwd"),
      targetFloor: targetObj.targetFloor,
      targetNodeId: targetObj.targetNodeId,
      label: targetObj.label || (matchedNode ? matchedNode.title : `Go to ${targetObj.targetNodeId}`),
    });
  });

  return connected;
}

/**
 * Transforms connected node entries into hotspot render targets for 360 viewer.
 */
export function calculateHotspots(currentNode, allNodes) {
  const connections = getConnectedNodes(currentNode, allNodes);
  const headingOffset = currentNode.heading || 0;

  return connections.map((conn) => {
    let yaw = 0;

    if (conn.node) {
      // 1. Calculate raw map angle relative to 2D blueprint grid
      const dx = conn.node.x - currentNode.x;
      const dy = conn.node.y - currentNode.y;
      const rawMapAngle = Math.atan2(dx, dy) * (180 / Math.PI);

      // 2. Adjust raw angle by camera orientation heading offset
      yaw = rawMapAngle - headingOffset;
    }

    return {
      id: `hotspot_${currentNode.id}_to_${conn.targetNodeId}`,
      targetNodeId: conn.targetNodeId,
      targetFloor: conn.targetFloor,
      isPortal: conn.isPortal,
      label: conn.label,
      pitch: conn.isPortal ? -10 : 0,
      yaw: yaw,
    };
  });
}