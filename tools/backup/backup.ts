import { getOctoberCmsConfig } from "./get-config";
import { dump } from "./database";
import { storage } from "./storage";
import { plugins } from "./plugins";

const backup = async () => {
  const date = new Date().toISOString();
  const config = await getOctoberCmsConfig();

  console.log("\nDump database..");
  await dump(config.database, `../../backups/mysql_${date}.sql`);
  console.log("Dump database done.");

  console.log("\nZip storage..");
  await storage(`../../backups/storage_${date}.zip`);
  console.log("Zip storage done.");

  console.log("\nZip plugins..");
  await plugins(`../../backups/plugins_${date}.zip`);
  console.log("Zip plugins done.");
};

try {
  backup();
} catch (error) {
  throw error;
}
