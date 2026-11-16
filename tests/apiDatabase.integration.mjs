import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { PrismaClient } from "@prisma/client";
import { createApiServer } from "../server/api.mjs";

const databaseUrl = process.env.DATABASE_URL_TEST;

if (!databaseUrl) {
  throw new Error("Set DATABASE_URL_TEST to a dedicated PostgreSQL test database.");
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

after(async () => {
  await prisma.$disconnect();
});

test("course API persists selections and validates database operations", async () => {
  const studentId = randomUUID();
  const email = `api-test-${studentId}@niner-skills-quest.local`;
  const courseId = "itcs-2214";
  let server;
  let baseUrl;

  async function startServer() {
    server = createApiServer({ prismaClient: prisma, studentId });
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    assert.ok(address && typeof address === "object");
    baseUrl = `http://127.0.0.1:${address.port}`;
  }

  async function stopServer() {
    if (!server?.listening) return;
    const runningServer = server;
    await new Promise((resolve, reject) => {
      runningServer.close((error) => (error ? reject(error) : resolve()));
      runningServer.closeAllConnections();
    });
  }

  await prisma.student.create({
    data: { id: studentId, email, displayName: "API Integration Test" },
  });

  try {
    await startServer();

    const initialResponse = await fetch(`${baseUrl}/api/courses/completed`);
    assert.equal(initialResponse.status, 200);
    assert.deepEqual(await initialResponse.json(), []);

    const addResponse = await fetch(`${baseUrl}/api/courses/completed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    assert.equal(addResponse.status, 201);
    assert.deepEqual(
      (await addResponse.json()).map((course) => course.id),
      [courseId],
    );

    const duplicateResponse = await fetch(`${baseUrl}/api/courses/completed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    assert.equal(duplicateResponse.status, 409);

    const invalidCourseResponse = await fetch(`${baseUrl}/api/courses/completed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: "unknown-course" }),
    });
    assert.equal(invalidCourseResponse.status, 400);

    await stopServer();
    await startServer();

    const restoredResponse = await fetch(`${baseUrl}/api/courses/completed`);
    assert.equal(restoredResponse.status, 200);
    assert.deepEqual(
      (await restoredResponse.json()).map((course) => course.id),
      [courseId],
    );

    const removeResponse = await fetch(
      `${baseUrl}/api/courses/completed/${encodeURIComponent(courseId)}`,
      { method: "DELETE" },
    );
    assert.equal(removeResponse.status, 200);
    assert.deepEqual(await removeResponse.json(), []);

    const missingRemovalResponse = await fetch(
      `${baseUrl}/api/courses/completed/${encodeURIComponent(courseId)}`,
      { method: "DELETE" },
    );
    assert.equal(missingRemovalResponse.status, 404);
  } finally {
    await stopServer();
    await prisma.student.delete({ where: { id: studentId } });
  }
});
