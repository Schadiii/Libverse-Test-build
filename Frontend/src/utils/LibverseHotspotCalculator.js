/**
 * LibverseHotspotCalculator.js
 * Utility for parsing graph node datasets, calculating spatial adjacency,
 * and generating dynamic hotspot configurations for 360 viewer layers.
 */

/**
 * Calculates connected targets for a given node based strictly on explicit
 * connections in targetNodes.
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
          yaw: null,
          pitch: null,
        });
      } else if (
        typeof target === "object" &&
        target &&
        target.targetNodeId
      ) {
        explicitTargets.push({
          targetNodeId: target.targetNodeId,
          targetFloor:
            target.targetFloor || currentNode.targetFloor || null,
          label: target.label || null,

          // Preserve explicitly defined panorama orientation if present
          yaw:
            typeof target.yaw === "number"
              ? target.yaw
              : null,

          pitch:
            typeof target.pitch === "number"
              ? target.pitch
              : null,
        });
      }
    });
  } else if (currentNode.targetNodeId) {
    // Support legacy single string format
    explicitTargets.push({
      targetNodeId: currentNode.targetNodeId,
      targetFloor: currentNode.targetFloor || null,
      label: null,
      yaw: null,
      pitch: null,
    });
  }

  // Resolve target nodes from explicit target entries only
  explicitTargets.forEach((targetObj) => {
    const matchedNode = allNodes.find(
      (n) => n.id === targetObj.targetNodeId
    );

    const isInterFloor = Boolean(
      targetObj.targetFloor &&
        targetObj.targetFloor !== currentNode.floor
    );

    connected.push({
      node: matchedNode || null,
      isPortal:
        isInterFloor ||
        currentNode.type === "stair" ||
        currentNode.type === "pwd",

      targetFloor: targetObj.targetFloor,
      targetNodeId: targetObj.targetNodeId,

      label:
        targetObj.label ||
        (matchedNode
          ? matchedNode.title
          : `Go to ${targetObj.targetNodeId}`),

      yaw: targetObj.yaw,
      pitch: targetObj.pitch,
    });
  });

  return connected;
}

/**
 * Normalizes an angle to Pannellum's conventional [-180, 180) range.
 */
function normalizeYaw(degrees) {
  return ((degrees + 180) % 360 + 360) % 360 - 180;
}

/**
 * Transforms connected node entries into hotspot render targets
 * for the 360 viewer.
 *
 * Same-floor connections:
 *   Uses the actual x/y position of the target node to determine
 *   the physical direction, then compensates for the current node's heading.
 *
 * Explicit transition yaw/pitch:
 *   If a transition contains yaw/pitch values, those values are preserved.
 */
export function calculateHotspots(currentNode, allNodes) {
  const connections = getConnectedNodes(currentNode, allNodes);

  const headingOffset =
    Number(currentNode?.heading) || 0;

  return connections.map((conn) => {
    let yaw = 0;

    /*
     * 1. If the JSON explicitly specifies a yaw,
     *    trust that value.
     */
    if (
      typeof conn.yaw === "number" &&
      Number.isFinite(conn.yaw)
    ) {
      yaw = conn.yaw;
    }

    /*
     * 2. Otherwise calculate the direction from the
     *    current node to the target node using map coordinates.
     */
    else if (
      conn.node &&
      Number.isFinite(Number(currentNode.x)) &&
      Number.isFinite(Number(currentNode.y)) &&
      Number.isFinite(Number(conn.node.x)) &&
      Number.isFinite(Number(conn.node.y))
    ) {
      const dx =
        Number(conn.node.x) -
        Number(currentNode.x);

      const dy =
        Number(conn.node.y) -
        Number(currentNode.y);

      /*
       * Node Maker coordinates:
       * +Y = forward/up
       * +X = right
       *
       * atan2(dx, dy) gives the direction of the
       * target relative to the map.
       */
      const rawMapAngle =
        Math.atan2(dx, dy) *
        (180 / Math.PI);

      /*
       * Convert map direction into panorama-relative
       * yaw using the current node's heading.
       */
      yaw = rawMapAngle - headingOffset;
    }

    return {
      id:
        `hotspot_${currentNode.id}_to_${conn.targetNodeId}`,

      targetNodeId:
        conn.targetNodeId,

      targetFloor:
        conn.targetFloor,

      isPortal:
        conn.isPortal,

      label:
        conn.label,

      /*
       * Preserve explicit pitch if supplied.
       * Otherwise retain the existing portal behavior.
       */
      pitch:
        typeof conn.pitch === "number" &&
        Number.isFinite(conn.pitch)
          ? conn.pitch
          : conn.isPortal
            ? -10
            : 0,

      /*
       * Normalize the calculated yaw so Pannellum
       * receives a clean value between -180 and 180.
       */
      yaw: normalizeYaw(yaw),
    };
  });
}
