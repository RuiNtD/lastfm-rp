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
    trace: (...data: unknown[]) =>
      log(LogLevel.TRACE, console.trace, prefix, ...data),
    debug: (...data: unknown[]) =>
      log(LogLevel.DEBUG, console.debug, prefix, ...data),
    info: (...data: unknown[]) =>
      log(LogLevel.INFO, console.info, prefix, ...data),
    warn: (...data: unknown[]) =>
      log(LogLevel.WARN, console.warn, prefix, ...data),
    error: (...data: unknown[]) =>
      log(LogLevel.ERROR, console.error, prefix, ...data),
  };
}

function log(
  level: LogLevel,
  fn: (...data: unknown[]) => void = console.log,
  prefix?: string,
  ...data: unknown[]
) {
  if (prefix) data.unshift(chalk.bold(`[${prefix}]`));

  const levelPrefix = levelPrefixes[level];
  if (levelPrefix) data.unshift(chalk.bold(levelPrefix));

  if (level >= currentLevel) fn(...data);
}
