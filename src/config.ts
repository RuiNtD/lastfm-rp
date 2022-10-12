import { readFileSync } from "fs";

const config = JSON.parse(readFileSync("config.json", { encoding: "utf8" }));
export default config;
