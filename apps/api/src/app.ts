import {
  budgetLimitSchema,
  calculateSummary,
  createGoalSchema,
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
  createMovementSchema,
  createRecurringMovementSchema,
  dominicanDate,
  entityIdSchema,
  goalContributionSchema,
  monthSchema,
  openingBalanceSchema,
  updateRecurringMovementSchema
} from "@ahorra/domain";
import cors from "@fastify/cors";
import Fastify, { type FastifyRequest } from "fastify";
import {
  bearerToken,
  type AuthenticatedUser,
  type AuthVerifier
} from "./auth/supabase-verifier.js";
import type { FinancePersistence } from "./persistence.js";

interface BuildAppOptions {
  authVerifier?: AuthVerifier;
}

export function buildApp(persistence: FinancePersistence, options: BuildAppOptions = {}) {
  const app = Fastify({ logger: false });
  const authenticatedUsers = new WeakMap<FastifyRequest, AuthenticatedUser>();

  // Origenes de la app nativa (Capacitor): Android sirve el bundle desde
  // http://localhost y iOS desde capacitor://localhost. Van siempre permitidos
  // porque no son configurables por despliegue.
  const nativeOrigins = ["http://localhost", "https://localhost", "capacitor://localhost"];
  const allowedOrigins = [
    ...(process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()) ?? [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:4173"
    ]),
    ...nativeOrigins
  ];
  app.register(cors, { origin: allowedOrigins });

  app.addHook("preHandler", async (request, reply) => {
    if (!request.url.startsWith("/api/") || request.method === "OPTIONS") return;
    if (!options.authVerifier) {
      return reply.code(503).send({ message: "Supabase Auth todavia no esta configurado." });
    }
    const token = bearerToken(request.headers.authorization);
    if (!token) return reply.code(401).send({ message: "Necesitas iniciar sesion." });
    try {
      authenticatedUsers.set(request, await options.authVerifier.verify(token));
    } catch {
      return reply.code(401).send({ message: "La sesion no es valida o ha expirado." });
    }
  });

  function repositoryFor(request: FastifyRequest) {
    const user = authenticatedUsers.get(request);
    if (!user) throw new Error("La ruta financiera se ejecuto sin un usuario autenticado.");
    return persistence.forUser(user.id);
  }

  app.get("/health", async () => ({ status: "ok" }));

  app.get("/api/v1/me", async (request, reply) => {
    const user = authenticatedUsers.get(request);
    if (!user) return reply.code(401).send({ message: "Necesitas iniciar sesion." });
    return { id: user.id, email: user.email };
  });

  app.get("/api/spaces", async (request) => repositoryFor(request).listSpaces());

  app.get<{ Querystring: { spaceId?: string; month?: string } }>(
    "/api/movements",
    async (request, reply) => {
      const database = repositoryFor(request);
      const spaceId = request.query.spaceId;
      if (!spaceId || !entityIdSchema.safeParse(spaceId).success) {
        return reply.code(400).send({ message: "Selecciona un espacio valido." });
      }
      if (request.query.month && !monthSchema.safeParse(request.query.month).success) {
        return reply.code(400).send({ message: "Selecciona un periodo valido." });
      }
      if (!(await database.spaceExists(spaceId))) {
        return reply.code(404).send({ message: "El espacio no existe." });
      }
      await database.materializeDueRecurrences(spaceId, dominicanDate());
      return await database.listMovements(spaceId, request.query.month);
    }
  );

  app.get<{ Querystring: { spaceId?: string; month?: string } }>(
    "/api/summary",
    async (request, reply) => {
      const database = repositoryFor(request);
      const spaceId = request.query.spaceId;
      if (!spaceId || !entityIdSchema.safeParse(spaceId).success) {
        return reply.code(400).send({ message: "Selecciona un espacio valido." });
      }
      if (request.query.month && !monthSchema.safeParse(request.query.month).success) {
        return reply.code(400).send({ message: "Selecciona un periodo valido." });
      }
      if (!(await database.spaceExists(spaceId))) {
        return reply.code(404).send({ message: "El espacio no existe." });
      }
      // Las recurrencias se materializan al leer, porque el despliegue es
      // serverless y no hay proceso vivo que las despierte a medianoche. Va
      // antes del calculo para que el resumen incluya lo que vencio hoy.
      await database.materializeDueRecurrences(spaceId, dominicanDate());
      return calculateSummary(await database.listMovements(spaceId, request.query.month));
    }
  );

  app.post("/api/movements", async (request, reply) => {
    const database = repositoryFor(request);
    const parsed = createMovementSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        message: "Revisa los datos del movimiento.",
        issues: parsed.error.issues
      });
    }
    if (parsed.data.type === "CONTRIBUTION") {
      return reply.code(400).send({ message: "Los aportes se registran desde una meta." });
    }
    if (!(await database.spaceExists(parsed.data.spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }

    const movement = await database.createMovement(parsed.data);
    if (!movement) return reply.code(404).send({ message: "El espacio no existe." });
    return reply.code(201).send(movement);
  });

  app.put<{ Params: { id: string } }>("/api/movements/:id", async (request, reply) => {
    const database = repositoryFor(request);
    if (!entityIdSchema.safeParse(request.params.id).success) {
      return reply.code(400).send({ message: "El movimiento no es valido." });
    }
    const parsed = createMovementSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        message: "Revisa los datos del movimiento.",
        issues: parsed.error.issues
      });
    }
    if (parsed.data.type === "CONTRIBUTION") {
      return reply.code(400).send({ message: "Los aportes se editan desde una meta." });
    }
    if (!(await database.spaceExists(parsed.data.spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }

    const movement = await database.updateMovement(request.params.id, parsed.data);
    if (!movement) {
      return reply.code(404).send({ message: "El movimiento no existe." });
    }
    return movement;
  });

  app.get<{ Querystring: { spaceId?: string; month?: string } }>(
    "/api/budget",
    async (request, reply) => {
      const database = repositoryFor(request);
      const spaceId = request.query.spaceId;
      const month = request.query.month;
      if (!spaceId || !entityIdSchema.safeParse(spaceId).success) {
        return reply.code(400).send({ message: "Selecciona un espacio valido." });
      }
      if (!month || !monthSchema.safeParse(month).success) {
        return reply.code(400).send({ message: "Selecciona un periodo valido." });
      }
      if (!(await database.spaceExists(spaceId))) {
        return reply.code(404).send({ message: "El espacio no existe." });
      }
      return await database.listBudgetLimits(spaceId, month);
    }
  );

  app.put("/api/budget", async (request, reply) => {
    const database = repositoryFor(request);
    const parsed = budgetLimitSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: "Revisa el limite." });
    if (!(await database.spaceExists(parsed.data.spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }
    const limit = await database.upsertBudgetLimit(parsed.data);
    if (!limit) return reply.code(404).send({ message: "El espacio no existe." });
    return limit;
  });

  app.get<{ Querystring: { spaceId?: string } }>("/api/goals", async (request, reply) => {
    const spaceId = request.query.spaceId;
    if (!spaceId || !entityIdSchema.safeParse(spaceId).success) {
      return reply.code(400).send({ message: "Selecciona un espacio valido." });
    }
    const database = repositoryFor(request);
    if (!(await database.spaceExists(spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }
    return await database.listGoals(spaceId);
  });

  app.post("/api/goals", async (request, reply) => {
    const database = repositoryFor(request);
    const parsed = createGoalSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: "Revisa los datos de la meta." });
    if (!(await database.spaceExists(parsed.data.spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }
    const goal = await database.createGoal(parsed.data);
    if (!goal) return reply.code(404).send({ message: "El espacio no existe." });
    return reply.code(201).send(goal);
  });

  app.post<{ Params: { id: string } }>("/api/goals/:id/contributions", async (request, reply) => {
    const database = repositoryFor(request);
    if (!entityIdSchema.safeParse(request.params.id).success) {
      return reply.code(400).send({ message: "La meta no es valida." });
    }
    const parsed = goalContributionSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: "Revisa el aporte." });
    const goal = await database.addGoalContribution(request.params.id, parsed.data);
    if (!goal) return reply.code(404).send({ message: "La meta no existe." });
    return reply.code(201).send(goal);
  });

  app.get<{ Params: { id: string } }>("/api/goals/:id/contributions", async (request, reply) => {
    if (!entityIdSchema.safeParse(request.params.id).success) {
      return reply.code(400).send({ message: "La meta no es valida." });
    }
    return await repositoryFor(request).listGoalContributions(request.params.id);
  });

  app.put<{ Params: { goalId: string; contributionId: string } }>(
    "/api/goals/:goalId/contributions/:contributionId",
    async (request, reply) => {
      const database = repositoryFor(request);
      if (
        !entityIdSchema.safeParse(request.params.goalId).success ||
        !entityIdSchema.safeParse(request.params.contributionId).success
      ) {
        return reply.code(400).send({ message: "El aporte no es valido." });
      }
      const parsed = goalContributionSchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ message: "Revisa el aporte." });
      const contribution = await database.updateGoalContribution(
        request.params.goalId,
        request.params.contributionId,
        parsed.data
      );
      if (!contribution) return reply.code(404).send({ message: "El aporte no existe." });
      return contribution;
    }
  );

  app.get<{ Querystring: { spaceId?: string } }>("/api/categories", async (request, reply) => {
    const spaceId = request.query.spaceId;
    if (!spaceId || !entityIdSchema.safeParse(spaceId).success) {
      return reply.code(400).send({ message: "Selecciona un espacio valido." });
    }
    const database = repositoryFor(request);
    if (!(await database.spaceExists(spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }
    return await database.listExpenseCategories(spaceId);
  });

  app.post("/api/categories", async (request, reply) => {
    const database = repositoryFor(request);
    const parsed = createExpenseCategorySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: "Escribe un nombre valido." });
    if (!(await database.spaceExists(parsed.data.spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }
    const category = await database.createExpenseCategory(parsed.data);
    if (!category)
      return reply.code(409).send({ message: "Ya existe una categoria con ese nombre." });
    return reply.code(201).send(category);
  });

  app.put<{ Params: { id: string } }>("/api/categories/:id", async (request, reply) => {
    const idResult = entityIdSchema.safeParse(request.params.id);
    if (!idResult.success) return reply.code(400).send({ message: "ID de categoria invalido." });
    const parsed = updateExpenseCategorySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: "Escribe un nombre valido." });
    const database = repositoryFor(request);
    const updated = await database.updateExpenseCategory(idResult.data, parsed.data.name);
    if (!updated)
      return reply.code(404).send({ message: "Categoria no encontrada o nombre duplicado." });
    return updated;
  });

  app.delete<{ Params: { id: string } }>("/api/categories/:id", async (request, reply) => {
    const idResult = entityIdSchema.safeParse(request.params.id);
    if (!idResult.success) return reply.code(400).send({ message: "ID de categoria invalido." });
    const database = repositoryFor(request);
    const deleted = await database.deleteExpenseCategory(idResult.data);
    if (!deleted) return reply.code(404).send({ message: "Categoria no encontrada." });
    return reply.code(204).send();
  });

  app.get<{ Querystring: { spaceId?: string } }>("/api/balance", async (request, reply) => {
    const spaceId = request.query.spaceId;
    if (!spaceId || !entityIdSchema.safeParse(spaceId).success) {
      return reply.code(400).send({ message: "Selecciona un espacio valido." });
    }
    const database = repositoryFor(request);
    // El saldo suma todo lo registrado, asi que lo recurrente vencido tiene que
    // estar ya materializado o la cifra saldria corta.
    await database.materializeDueRecurrences(spaceId, dominicanDate());
    const balance = await database.getBalance(spaceId);
    if (!balance) return reply.code(404).send({ message: "El espacio no existe." });
    return balance;
  });

  app.put<{ Params: { id: string } }>("/api/spaces/:id/opening-balance", async (request, reply) => {
    const idResult = entityIdSchema.safeParse(request.params.id);
    if (!idResult.success) return reply.code(400).send({ message: "ID de espacio invalido." });
    const parsed = openingBalanceSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: "Escribe un saldo valido." });
    const database = repositoryFor(request);
    const balance = await database.setOpeningBalance(
      idResult.data,
      parsed.data.openingBalanceCents
    );
    if (!balance) return reply.code(404).send({ message: "El espacio no existe." });
    return balance;
  });

  app.get<{ Querystring: { spaceId?: string } }>("/api/recurrences", async (request, reply) => {
    const spaceId = request.query.spaceId;
    if (!spaceId || !entityIdSchema.safeParse(spaceId).success) {
      return reply.code(400).send({ message: "Selecciona un espacio valido." });
    }
    const database = repositoryFor(request);
    if (!(await database.spaceExists(spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }
    await database.materializeDueRecurrences(spaceId, dominicanDate());
    return await database.listRecurringMovements(spaceId);
  });

  app.post("/api/recurrences", async (request, reply) => {
    const database = repositoryFor(request);
    const parsed = createRecurringMovementSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ message: "Revisa los datos de la recurrencia.", issues: parsed.error.issues });
    }
    if (!(await database.spaceExists(parsed.data.spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }
    const created = await database.createRecurringMovement(parsed.data);
    if (!created) return reply.code(400).send({ message: "No pudimos crear la recurrencia." });
    // Una regla que arranca hoy o antes ya tiene ocurrencias que registrar:
    // sin esto no apareceria nada hasta la siguiente lectura.
    await database.materializeDueRecurrences(parsed.data.spaceId, dominicanDate());
    return reply.code(201).send(created);
  });

  app.put<{ Params: { id: string } }>("/api/recurrences/:id", async (request, reply) => {
    const idResult = entityIdSchema.safeParse(request.params.id);
    if (!idResult.success) return reply.code(400).send({ message: "ID de recurrencia invalido." });
    const parsed = updateRecurringMovementSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ message: "Revisa los datos de la recurrencia.", issues: parsed.error.issues });
    }
    const database = repositoryFor(request);
    const updated = await database.updateRecurringMovement(idResult.data, parsed.data);
    if (!updated) return reply.code(404).send({ message: "Recurrencia no encontrada." });
    return updated;
  });

  app.delete<{ Params: { id: string } }>("/api/recurrences/:id", async (request, reply) => {
    const idResult = entityIdSchema.safeParse(request.params.id);
    if (!idResult.success) return reply.code(400).send({ message: "ID de recurrencia invalido." });
    const database = repositoryFor(request);
    const deleted = await database.deleteRecurringMovement(idResult.data);
    if (!deleted) return reply.code(404).send({ message: "Recurrencia no encontrada." });
    return reply.code(204).send();
  });

  app.addHook("onClose", async () => persistence.close());
  return app;
}
