import chalk from "chalk";
import * as util from "node:util";

enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
  LOG,
}

type LogFn = (...data: unknown[]) => void;
type Logger = Record<Lowercase<keyof typeof LogLevel>, LogFn>;

const levelPrefixes: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: chalk.gray("DEBUG"),
  [LogLevel.INFO]: chalk.cyan("INFO "),
  [LogLevel.WARN]: chalk.yellow("WARN "),
  [LogLevel.ERROR]: chalk.red("ERROR"),
  [LogLevel.LOG]: "",
};

const levelFns: Record<LogLevel, LogFn> = {
  [LogLevel.DEBUG]: console.debug,
  [LogLevel.INFO]: console.info,
  [LogLevel.WARN]: console.warn,
  [LogLevel.ERROR]: console.error,
  [LogLevel.LOG]: console.log,
};

const currentLevel = (() => {
  const level = process.env.LOG_LEVEL?.toUpperCase() || "";
  if (level in LogLevel) return LogLevel[level as keyof typeof LogLevel];
  return LogLevel.INFO;
})();

export function getLogger(prefix?: string): Logger {
  return {
    debug: (...data: unknown[]) => log(LogLevel.DEBUG, prefix, ...data),
    info: (...data: unknown[]) => log(LogLevel.INFO, prefix, ...data),
    warn: (...data: unknown[]) => log(LogLevel.WARN, prefix, ...data),
    error: (...data: unknown[]) => log(LogLevel.ERROR, prefix, ...data),
    log: (...data: unknown[]) => log(LogLevel.LOG, prefix, ...data),
  };
}

function log(level?: LogLevel, prefix?: string, ...data: unknown[]) {
  const prefixes: string[] = [];
  let logFn: LogFn = console.log;

  if (level != undefined) {
    if (level < currentLevel) return;
    logFn = levelFns[level];

    const levelPrefix = levelPrefixes[level];
    if (levelPrefix) prefixes.push(chalk.bold(levelPrefix));
  }
  if (prefix) prefixes.push(chalk.gray.bold(`[${prefix}]`));

  logFn("%s", ...prefixes, util.format(...data));
}
