import { createApp } from "../src/app";

// Vercel serverless entrypoint: an Express app instance is itself a valid
// (req, res) handler, so we just export it. vercel.json rewrites every
// request here and Express's own router does the rest.
export default createApp();
