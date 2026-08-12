import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { readJson } from "../lib/format";

export type Space = { id: string; name: string; type: "PERSONAL" | "BUSINESS" };

export function useSpaces(accessToken: string | undefined, userId: string | undefined) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spaceId, setSpaceId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setSpaces([]);
    setSpaceId("");
  }, [userId]);

  useEffect(() => {
    if (!accessToken) return;
    const controller = new AbortController();
    void apiFetch(accessToken, "/api/spaces", { signal: controller.signal })
      .then((response) => readJson<Space[]>(response))
      .then((nextSpaces) => {
        setSpaces(nextSpaces);
        setSpaceId((current) => {
          if (nextSpaces.some((space) => space.id === current)) return current;
          return (
            nextSpaces.find((space) => space.type === "PERSONAL")?.id ?? nextSpaces[0]?.id ?? ""
          );
        });
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          setError("No pudimos cargar tus espacios.");
        }
      });
    return () => controller.abort();
  }, [accessToken]);

  return { spaces, spaceId, setSpaceId, error };
}
