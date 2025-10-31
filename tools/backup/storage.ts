import { zip } from "./zip";

export const storage = (zipToFile: string) => {
  return zip("../../storage", zipToFile);
};
