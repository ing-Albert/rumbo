import { access, readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const prompt = createInterface({ input, output });

function required(name, value) {
  const normalized = value.trim();
  if (!normalized) throw new Error(`Falta ${name}.`);
  return normalized;
}

function env(value) {
  return JSON.stringify(value);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readEnv(path) {
  if (!(await exists(path))) return null;

  const values = {};
  const contents = await readFile(path, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const separator = line.indexOf("=");
    if (separator < 1) continue;

    const name = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    try {
      values[name] = JSON.parse(rawValue);
    } catch {
      values[name] = rawValue;
    }
  }
  return values;
}

function setEnvValue(contents, name, value) {
  const nextLine = `${name}=${env(value)}`;
  const currentLine = new RegExp(`^${name}=.*$`, "m");
  if (currentLine.test(contents)) return contents.replace(currentLine, nextLine);
  return `${contents.trimEnd()}\n${nextLine}\n`;
}

try {
  console.log("Configuracion local de Supabase para Rumbo");
  console.log("No introduzcas la clave service_role.\n");

  const webConfig = await readEnv("apps/web/.env.local");
  const apiConfig = await readEnv("apps/api/.env");
  const publicConfig = webConfig ?? apiConfig;

  const projectUrl = publicConfig
    ? required("Supabase URL", publicConfig.VITE_SUPABASE_URL ?? publicConfig.SUPABASE_URL ?? "")
    : required("Project URL", await prompt.question("Project URL: "));
  const publishableKey = publicConfig
    ? required(
        "Supabase publishable key",
        publicConfig.VITE_SUPABASE_PUBLISHABLE_KEY ?? publicConfig.SUPABASE_PUBLISHABLE_KEY ?? ""
      )
    : required("Publishable key", await prompt.question("Publishable key: "));

  if (publicConfig) console.log("Se reutilizara la configuracion publica existente.");

  const databaseUrl = required(
    "Database URL",
    await prompt.question("Database connection string: ")
  );

  new URL(projectUrl);
  if (!projectUrl.startsWith("https://")) throw new Error("Project URL debe usar HTTPS.");
  const databaseConnection = new URL(databaseUrl);
  if (databaseConnection.protocol !== "postgresql:") {
    throw new Error("Database connection string debe comenzar con postgresql://");
  }
  if (!databaseConnection.hostname.endsWith(".pooler.supabase.com")) {
    throw new Error("La conexion debe ser Session pooler, no Direct.");
  }
  if (!webConfig) {
    await writeFile(
      "apps/web/.env.local",
      `VITE_SUPABASE_URL=${env(projectUrl)}\nVITE_SUPABASE_PUBLISHABLE_KEY=${env(publishableKey)}\n`,
      { encoding: "utf8", flag: "wx" }
    );
  }
  if (apiConfig) {
    const apiContents = await readFile("apps/api/.env", "utf8");
    await writeFile("apps/api/.env", setEnvValue(apiContents, "DATABASE_URL", databaseUrl), "utf8");
  } else {
    await writeFile(
      "apps/api/.env",
      `SUPABASE_URL=${env(projectUrl)}\nSUPABASE_PUBLISHABLE_KEY=${env(publishableKey)}\nDATABASE_URL=${env(databaseUrl)}\nCORS_ORIGIN=${env("http://localhost:5173")}\n`,
      { encoding: "utf8", flag: "wx" }
    );
  }

  console.log(
    `\nConfiguracion ${apiConfig ? "actualizada" : "creada"} sin exponer secretos en el chat.`
  );
  console.log("Siguiente verificacion: npm run db:check -w @ahorra/api");
} catch (error) {
  console.error(
    `\nNo se completo la configuracion: ${error instanceof Error ? error.message : error}`
  );
  process.exitCode = 1;
} finally {
  prompt.close();
}
