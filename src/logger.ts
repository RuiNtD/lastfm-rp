import { colors } from "@cliffy/ansi/colors";

enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR,
}

const levelPrefixes: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: colors.gray("DEBUG"),
  [LogLevel.INFO]: "",
  [LogLevel.WARN]: colors.brightYellow("WARN"),
  [LogLevel.ERROR]: colors.brightRed("ERROR"),
};

const currentLevel = LogLevel.INFO;

export function getLogger(prefix?: string) {
  return {
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
