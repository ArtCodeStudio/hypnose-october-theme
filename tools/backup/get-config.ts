import { exec } from "child_process";

export interface OctoberCMSConfig {
  database: {
    fetch: number;
    default: "mysql" | "sqlite" | "pgsql" | "sqlsrv";
    connections: {
      sqlite: any;
      mysql: {
        driver: "mysql";
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
        charset: string;
        collation: string;
        prefix: string;
      };
      pgsql: any;
      sqlsrv: any;
    };
    migrations: "migrations";
    redis: { cluster: false; default: any };
    useConfigForTesting: boolean;
  };
  app: any;
  cms: any;
}

export const getOctoberCmsConfig = async () => {
  const cmd = `php get-config.php`;

  return new Promise<OctoberCMSConfig>((resolve, reject) => {
    exec(cmd, function (error, stdout) {
      const config = JSON.parse(stdout);
      if (error) {
        reject(error);
      }
      resolve(config);
    });
  });
};
