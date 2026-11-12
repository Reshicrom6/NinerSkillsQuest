import { createServer } from "node:http";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const port = Number(process.env.API_PORT ?? 3001);
const demoStudentId = "00000000-0000-0000-0000-000000000001";

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "http://localhost:5173",
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) body += chunk;
  return body ? JSON.parse(body) : {};
}

async function getSelections() {
  const selections = await prisma.studentCourse.findMany({
    where: { studentId: demoStudentId },
    include: { course: { include: { skillMappings: { include: { skill: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  return selections.map(({ course }) => ({
    ...course,
    skillIds: course.skillMappings.map(({ skillId }) => skillId),
  }));
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "http://localhost:5173",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    });
    response.end();
    return;
  }

  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname === "/api/courses/completed" && request.method === "GET") {
      sendJson(response, 200, await getSelections());
      return;
    }

    if (url.pathname === "/api/courses/completed" && request.method === "POST") {
      const { courseId } = await readJson(request);
      if (typeof courseId !== "string" || !courseId) {
        sendJson(response, 400, { error: "courseId is required." });
        return;
      }
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        sendJson(response, 400, { error: "That course does not exist." });
        return;
      }
      await prisma.studentCourse.create({
        data: { studentId: demoStudentId, courseId, completedAt: new Date() },
      });
      sendJson(response, 201, await getSelections());
      return;
    }

    const match = url.pathname.match(/^\/api\/courses\/completed\/([^/]+)$/);
    if (match && request.method === "DELETE") {
      await prisma.studentCourse.delete({
        where: { studentId_courseId: { studentId: demoStudentId, courseId: match[1] } },
      });
      sendJson(response, 200, await getSelections());
      return;
    }

    sendJson(response, 404, { error: "Not found." });
  } catch (error) {
    if (error?.code === "P2002") {
      sendJson(response, 409, { error: "That course is already selected." });
      return;
    }
    if (error?.code === "P2025") {
      sendJson(response, 404, { error: "That course selection was not found." });
      return;
    }
    console.error("API request failed.", error);
    sendJson(response, 500, { error: "The database request failed." });
  }
});

server.listen(port, () => {
  console.log(`Course API listening on http://localhost:${port}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  server.close();
});
