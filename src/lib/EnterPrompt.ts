import {
  createPrompt,
  useState,
  useKeypress,
  isEnterKey,
  usePrefix,
  makeTheme,
  type Theme,
  type Status,
} from "@inquirer/core";
import type { PartialDeep } from "@inquirer/type";
import chalk from "chalk";
import figures from "@inquirer/figures";

type ConfirmConfig = {
  message?: string;
  theme?: PartialDeep<Theme>;
};

export default createPrompt<boolean, ConfirmConfig>((config, done) => {
  const [status, setStatus] = useState<Status>("idle");
  const theme = makeTheme(
    {
      prefix: {
        idle: chalk.blue(figures.info),
        done: chalk.green(figures.tick),
      },
    },
    config.theme,
  );
  const prefix = usePrefix({ status, theme });

  useKeypress((key) => {
    if (isEnterKey(key)) {
      setStatus("done");
      done(true);
    }
  });

  const message = theme.style.message(
    config.message ?? "Press Enter to continue...",
    status,
  );
  return `${prefix} ${message}`;
});
