import { useEffect, useState } from "react";

export function useLibverseFloorData(
  initialFloor = "eliboutside",
  apiBaseUrl = "http://localhost:8000"
) {
  const [currentFloor, setCurrentFloor] = useState(initialFloor);
  const [nodesData, setNodesData] = useState([]);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    setIsLoading(true);
    setError(null);

    fetch(`${apiBaseUrl}/api/floors/${currentFloor}/nodes`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: Failed to load ${currentFloor}`
          );
        }
        return response.json();
      })
      .then((data) => {
        if (!mounted) return;

        const nodes = Array.isArray(data.nodes) ? data.nodes : [];
        setNodesData(nodes);

        setCurrentNodeId((previous) => {
          if (previous && nodes.some((node) => node.id === previous)) {
            return previous;
          }
          return nodes[0]?.id || null;
        });

        setIsLoading(false);
      })
      .catch((loadError) => {
        if (!mounted) return;
        console.error(loadError);
        setError(loadError.message);
        setNodesData([]);
        setCurrentNodeId(null);
        setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [currentFloor, apiBaseUrl]);

  const handleNodeTransition = (targetNodeId, targetFloor = null) => {
    if (!targetNodeId) return;

    if (targetFloor && targetFloor !== currentFloor) {
      setCurrentFloor(targetFloor);
      setCurrentNodeId(targetNodeId);
      return;
    }

    setCurrentNodeId(targetNodeId);
  };

  const currentNode =
    nodesData.find((node) => node.id === currentNodeId) || null;

  return {
    currentFloor,
    setCurrentFloor,
    currentNode,
    currentNodeId,
    nodesData,
    isLoading,
    error,
    handleNodeTransition,
  };
}