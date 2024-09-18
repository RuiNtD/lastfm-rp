import chalk from "chalk";

enum LogLevel {
  TRACE,
  DEBUG,
  INFO,
  WARN,
  ERROR,
}

const levelPrefixes: Record<LogLevel, string> = {
  [LogLevel.TRACE]: chalk.gray("TRACE"),
  [LogLevel.DEBUG]: chalk.gray("DEBUG"),
  [LogLevel.INFO]: "",
  [LogLevel.WARN]: chalk.yellowBright("WARN"),
  [LogLevel.ERROR]: chalk.redBright("ERROR"),
};

const currentLevel = LogLevel.INFO;

type Logger = Record<
  Lowercase<keyof typeof LogLevel>,
  (...data: unknown[]) => void
>;

export function getLogger(prefix?: string): Logger {
  return {
    trace: (...data: unknown[]) => log(LogLevel.DEBUG, prefix, ...data),
    debug: (...data: unknown[]) => log(LogLevel.DEBUG, prefix, ...data),
    info: (...data: unknown[]) => log(LogLevel.INFO, prefix, ...data),
    warn: (...data: unknown[]) => log(LogLevel.WARN, prefix, ...data),
    error: (...data: unknown[]) => log(LogLevel.ERROR, prefix, ...data),
  };
}

function log(level: LogLevel, prefix?: string, ...data: unknown[]) {
  if (prefix) data.unshift(prefix);

  const levelPrefix = levelPrefixes[level];
  if (levelPrefix) data.unshift(levelPrefix);

  if (level >= currentLevel) console.log(...data);
}
