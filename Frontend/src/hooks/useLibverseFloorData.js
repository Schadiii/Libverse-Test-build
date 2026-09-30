import { useState, useEffect } from "react";

export function useLibverseFloorData(initialFloor = "eliboutside", apiBaseUrl = "http://localhost:8000") {
  const [currentFloor, setCurrentFloor] = useState(initialFloor);
  const [nodesData, setNodesData] = useState([]);
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch(`${apiBaseUrl}/api/floors/${currentFloor}/nodes`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch floor dataset`);
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;

        const nodesArray = data.nodes || [];
        setNodesData(nodesArray);

        setCurrentNodeId((prevNodeId) => {
          const targetExistsInNewFloor = nodesArray.some((n) => n.id === prevNodeId);
          if (prevNodeId && targetExistsInNewFloor) {
            return prevNodeId;
          }
          return nodesArray.length > 0 ? nodesArray[0].id : null;
        });

        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Dataset load error:", err);
        setError(err.message);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentFloor, apiBaseUrl]);

  const handleNodeTransition = (targetNodeId, targetFloor = null) => {
    if (!targetNodeId) return;

    if (targetFloor && targetFloor !== currentFloor) {
      setCurrentFloor(targetFloor);
      setCurrentNodeId(targetNodeId);
    } else {
      setCurrentNodeId(targetNodeId);
    }
  };

  const currentNode = nodesData.find((n) => n.id === currentNodeId);

  return {
    currentFloor,
    currentNode,
    currentNodeId,
    nodesData,
    isLoading,
    error,
    handleNodeTransition,
  };
}