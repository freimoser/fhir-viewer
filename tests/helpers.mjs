globalThis.WebSocket ??= class { static CLOSING = 2; static CLOSED = 3; };
import fs from "node:fs";
import path from "node:path";
export const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
export const sample = (id) => JSON.parse(fs.readFileSync(path.join(root, "samples/orig", id + ".json"), "utf8"));
