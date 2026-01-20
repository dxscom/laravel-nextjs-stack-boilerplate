/**
 * Omnify Configuration (Herd Setup)
 */

import type { OmnifyConfig } from "@famgia/omnify";
import japanPlugin from "@famgia/omnify-japan";
import laravelPlugin from "@famgia/omnify-laravel/plugin";
import typescriptPlugin from "@famgia/omnify-typescript/plugin";
import { existsSync, readFileSync } from "fs";

function getDbDriver(): "mysql" | "postgres" | "sqlite" {
  if (existsSync("./backend/.env")) {
    const envContent = readFileSync("./backend/.env", "utf8");
    const match = envContent.match(/^DB_CONNECTION=(.+)$/m);
    if (match) return match[1] as "mysql" | "postgres" | "sqlite";
  }
  return "mysql";
}

function getDbUrl(): string {
  if (existsSync("./backend/.env")) {
    const envContent = readFileSync("./backend/.env", "utf8");
    const host = envContent.match(/^DB_HOST=(.+)$/m)?.[1] || "127.0.0.1";
    const port = envContent.match(/^DB_PORT=(.+)$/m)?.[1] || "3306";
    const database = envContent.match(/^DB_DATABASE=(.+)$/m)?.[1] || "laravel";
    const username = envContent.match(/^DB_USERNAME=(.+)$/m)?.[1] || "root";
    const password = envContent.match(/^DB_PASSWORD=(.*)$/m)?.[1] || "";
    const driver = getDbDriver();
    if (password) {
      return `${driver}://${username}:${password}@${host}:${port}/${database}`;
    }
    return `${driver}://${username}@${host}:${port}/${database}`;
  }
  return "mysql://root@127.0.0.1:3306/laravel";
}

const config: OmnifyConfig = {
  schemasDir: "./.omnify/schemas",
  plugins: [
    japanPlugin,
    laravelPlugin({ base: "./backend/" }),
    typescriptPlugin({
      modelsPath: "./frontend/src/omnify/schemas",
    }),
  ],
  locale: {
    locales: ["ja", "en", "vi"],
    defaultLocale: "ja",
  },
  database: {
    driver: getDbDriver(),
    devUrl: getDbUrl(),
  },
  output: {
    typescript: {
      path: "./frontend/src/omnify/schemas",
    },
  },
};

export default config;
