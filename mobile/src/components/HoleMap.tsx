// Metro resolves HoleMap.native.tsx / HoleMap.web.tsx per-platform at bundle time.
// This file exists only so non-Metro tools (tsc, editors) can resolve the import.
export { HoleMap } from "./HoleMap.native";
