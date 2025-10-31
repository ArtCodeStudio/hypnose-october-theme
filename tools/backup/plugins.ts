import { zip } from "./zip";

export const plugins = (zipToFile: string) => {
  return zip("../../plugins", zipToFile);
};
