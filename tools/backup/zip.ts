import { createWriteStream, existsSync } from "fs";
import { resolve } from "path";
import { create } from "archiver";

export const zip = (dirToZip: string, zipToFile: string) => {
  dirToZip = resolve(__dirname, "../..", dirToZip);
  const output = createWriteStream(resolve(__dirname, zipToFile));
  const archive = create("zip");

  if (!existsSync) {
    throw new Error(`Directory "${dirToZip}" not found!`);
  }
  archive.directory(dirToZip, false);

  console.log(`Append directory to zip: ${dirToZip}`);

  output.on("close", () => {
    // console.log(archive.pointer() + " total bytes");
    // console.log(
    //   "archiver has been finalized and the output file descriptor has closed."
    // );
  });
  archive.on("error", console.error);

  archive.on("warning", console.error);

  archive.pipe(output);

  return archive.finalize();
};
