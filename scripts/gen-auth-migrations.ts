import { getAuthTables } from "@better-auth/core/db";

import { auth } from "../src/auth";
import { readSnapshot, writeSnapshot, diffSchemas } from "./snapshot";

const current = getAuthTables(auth.options);
const prev = readSnapshot(); // JSON file in git
const { toBeCreated, toBeAdded } = diffSchemas(prev, current);

const code = emitKyselyMigration(toBeCreated, toBeAdded); // your emitter
writeFile(`migrations/${timestamp()}_auth.ts`, code);
writeSnapshot(current);
