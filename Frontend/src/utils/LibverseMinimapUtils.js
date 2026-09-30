/**
 * LibverseMinimapUtils.js
 * Utilities for 2D map coordinate scaling and radar orientation.
 * Updated to support Node Maker v1.8 meter-based coordinate output.
 */

export const DEFAULT_PX_PER_METER = 50;

/**
 * Calculates bounding box in meters across all nodes on the current floor or accepts
 * explicit floorplan canvas pixel dimensions (e.g. from floor dataset metadata).
 *
 * @param {Array} allNodes - List of node objects with x, y coordinates (in meters)
 * @param {Object} [floorDimensions] - Optional explicit floor plan dimensions in pixels { width, height }
 * @param {number} [pxPerMeter=50] - Scale factor from Node Maker (pixels per meter)
 * @returns {Object} Bounds object containing minX, maxX, minY, maxY in meters
 */
export function getNodesBounds(allNodes, floorDimensions = null, pxPerMeter = DEFAULT_PX_PER_METER) {
  const scale = pxPerMeter || DEFAULT_PX_PER_METER;

  // 1. If explicit floorplan canvas dimensions (pixels) are passed directly, convert to meters
  if (floorDimensions && typeof floorDimensions.width === "number" && typeof floorDimensions.height === "number") {
    return {
      minX: 0,
      maxX: floorDimensions.width / scale,
      minY: 0,
      maxY: floorDimensions.height / scale,
    };
  }

  if (!Array.isArray(allNodes) || allNodes.length === 0) {
    return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  }

  // 2. Fallback: check if nodes carry canvas dimension properties from Node Maker and convert to meters
  const sampleNode = allNodes.find(
    (node) => typeof node.canvasWidth === "number" && typeof node.canvasHeight === "number"
  );
  if (sampleNode) {
    return {
      minX: 0,
      maxX: sampleNode.canvasWidth / scale,
      minY: 0,
      maxY: sampleNode.canvasHeight / scale,
    };
  }

  // 3. Fallback: anchor min at 0 and scale relative to outermost coordinate (already in meters)
  let maxX = -Infinity;
  let maxY = -Infinity;

  allNodes.forEach((node) => {
    if (typeof node.x === "number" && typeof node.y === "number") {
      if (node.x > maxX) maxX = node.x;
      if (node.y > maxY) maxY = node.y;
    }
  });

  return {
    minX: 0,
    maxX: maxX > 0 ? maxX : 1,
    minY: 0,
    maxY: maxY > 0 ? maxY : 1,
  };
}

/**
 * Projects raw graph node meter coordinates (x, y) to percentage positions relative to floor canvas.
 * Inverts Y-axis (Cartesian origin at bottom-left -> CSS layout origin at top-left).
 *
 * @param {Object} node - Current node with x, y properties (in meters)
 * @param {Object} bounds - Bounding box object { minX, maxX, minY, maxY } in meters
 * @returns {Object} CSS position style object { left: string, top: string }
 */
export function calculateMinimapPosition(node, bounds) {
  if (!node || !bounds) return { left: "0%", top: "0%" };

  const rangeX = bounds.maxX || 1;
  const rangeY = bounds.maxY || 1;

  // Horizontal position as percentage of total canvas width
  const leftPercent = (node.x / rangeX) * 100;

  // Inverted Y: Y=0 in Node Maker is canvas bottom -> CSS top: 100%
  const topPercent = ((rangeY - node.y) / rangeY) * 100;

  return {
    left: `${Math.max(0, Math.min(100, leftPercent))}%`,
    top: `${Math.max(0, Math.min(100, topPercent))}%`,
  };
}

/**
 * Computes rotation degrees for the minimap FOV radar cone.
 *
 * @param {Object} currentNode - Active scene node containing heading orientation
 * @returns {number} Angle in degrees
 */
export function calculateRadarRotation(currentNode) {
  if (!currentNode) return 0;
  return currentNode.heading || 0;
}
