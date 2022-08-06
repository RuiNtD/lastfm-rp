import { batchFind } from "@cumcord/modules/webpack";

export const [
  Button,
  Card,
  FormText,
  FormTitle,
  { SingleSelect },
  { showToast },
] = batchFind(({ findByProps, findByDisplayName }) => {
  findByProps("Sizes", "Colors", "Looks", "DropdownSizes");
  findByDisplayName("Card");
  findByDisplayName("FormText");
  findByDisplayName("FormTitle");
  findByDisplayName("Select", false);
  findByProps("showToast");
});
