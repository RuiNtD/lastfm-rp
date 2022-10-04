import { readFileSync } from "fs";
import { exit } from "process";

const config = JSON.parse(readFileSync("config.json", { encoding: "utf8" }));
export default config;
