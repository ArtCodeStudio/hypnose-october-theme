import mysqldump from "mysqldump";
import type { OctoberCMSConfig } from "./get-config";

export const dump = (
  config: OctoberCMSConfig["database"],
  dumpToFile: string
) => {
  if (
    config.default !== "mysql" ||
    config.connections.mysql.driver !== "mysql"
  ) {
    throw new Error(
      `The backup script supports only mysql as database but you are using "${config.default}" in OctoberCMS.`
    );
  }

  const mysqlConf = config.connections.mysql;

  return mysqldump({
    connection: {
      host: mysqlConf.host,
      user: mysqlConf.username,
      password: mysqlConf.password,
      database: mysqlConf.database,
      charset: mysqlConf.charset,
      port: mysqlConf.port || 3306,
    },
    dumpToFile,
  });
};
