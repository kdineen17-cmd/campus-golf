import "dotenv/config";
import { createApp } from "./app";
import { PORT } from "./lib/env";

const app = createApp();

app.listen(PORT, () => {
  console.log(`Campus Golf API listening on http://localhost:${PORT}`);
});
