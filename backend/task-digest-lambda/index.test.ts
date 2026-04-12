import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const dbSendMock = vi.fn();
const mailSendMock = vi.fn();

vi.mock("@aws-sdk/client-dynamodb", () => {
  class DynamoDBClient {
    send = dbSendMock;
  }

  class ScanCommand {
    input;

    constructor(input) {
      this.input = input;
    }
  }

  return {
    DynamoDBClient,
    ScanCommand,
  };
});

vi.mock("@aws-sdk/client-ses", () => {
  class SESClient {
    send = mailSendMock;
  }

  class SendEmailCommand {
    input;

    constructor(input) {
      this.input = input;
    }
  }

  return {
    SESClient,
    SendEmailCommand,
  };
});

import type { handler as HandlerType } from "./index.js";

let handler: typeof HandlerType;

function rawTask({
  id,
  title,
  checkedAt = "",
  value,
  unit,
}: {
  id: string;
  title: string;
  checkedAt?: string;
  value: number;
  unit: "day" | "week" | "month" | "year";
}) {
  return {
    id: { S: id },
    title: { S: title },
    checkedAt: { S: checkedAt },
    frequency: {
      M: {
        value: { N: String(value) },
        unit: { S: unit },
      },
    },
  };
}

beforeAll(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-12T12:00:00.000Z"));
  vi.stubEnv("AWS_REGION", "eu-west-3");
  vi.stubEnv("TASKS_TABLE_NAME", "test-tasks");
  vi.stubEnv("EMAIL_FROM", "from@example.com");
  vi.stubEnv("EMAIL_TO", "to@example.com");
  vi.stubEnv("DIGEST_MAX_TASKS", "2");
  ({ handler } = await import("./index.js"));
});

beforeEach(() => {
  dbSendMock.mockReset();
  mailSendMock.mockReset();
});

function normalizeFormatting(value: string) {
  return value.replace(/\u00a0/g, " ");
}

describe("task digest lambda", () => {
  it("continues scanning later pages and prioritizes due tasks before upcoming ones", async () => {
    dbSendMock
      .mockResolvedValueOnce({
        Items: [
          rawTask({
            id: "upcoming-late",
            title: "Long cycle tomorrow",
            checkedAt: "2026-03-14T12:00:00.000Z",
            value: 30,
            unit: "day",
          }),
        ],
        LastEvaluatedKey: {
          id: { S: "upcoming-late" },
        },
      })
      .mockResolvedValueOnce({
        Items: [
          rawTask({
            id: "due-now",
            title: "Due now",
            value: 1,
            unit: "week",
          }),
          rawTask({
            id: "upcoming-soon",
            title: "Short cycle today",
            checkedAt: "2026-04-11T12:00:00.000Z",
            value: 2,
            unit: "day",
          }),
        ],
      });
    mailSendMock.mockResolvedValueOnce({});

    const response = await handler();

    expect(response).toEqual({
      status: "ok",
      sentTo: "to@example.com",
      taskCount: 2,
    });
    expect(dbSendMock).toHaveBeenCalledTimes(2);
    expect(dbSendMock.mock.calls[0][0].input).toEqual({
      TableName: "test-tasks",
    });
    expect(dbSendMock.mock.calls[1][0].input).toEqual({
      TableName: "test-tasks",
      ExclusiveStartKey: {
        id: { S: "upcoming-late" },
      },
    });
    expect(mailSendMock).toHaveBeenCalledTimes(1);

    const email = mailSendMock.mock.calls[0][0].input;
    const body = normalizeFormatting(email.Message.Body.Text.Data);
    expect(email.Message.Subject.Data).toBe("Tasks digest - 12/04/2026");
    expect(body).toContain("1 tâche(s) disponible(s) :");
    expect(body).toContain("Non commencées :");
    expect(body).toContain("- Due now, tous les 1 semaine");
    expect(body).toContain("À refaire bientôt :");
    expect(body).toContain("- Short cycle today, tous les 2 jours");
    expect(body).not.toContain("Long cycle tomorrow");
  });

  it("orders upcoming tasks by nearest due date before recurrence length", async () => {
    dbSendMock.mockResolvedValueOnce({
      Items: [
        rawTask({
          id: "later",
          title: "Due in six days",
          checkedAt: "2026-04-11T12:00:00.000Z",
          value: 7,
          unit: "day",
        }),
        rawTask({
          id: "sooner",
          title: "Due tomorrow",
          checkedAt: "2026-03-14T12:00:00.000Z",
          value: 30,
          unit: "day",
        }),
      ],
    });
    mailSendMock.mockResolvedValueOnce({});

    await handler();

    const body = normalizeFormatting(
      mailSendMock.mock.calls[0][0].input.Message.Body.Text.Data,
    );
    expect(body.indexOf("Due tomorrow")).toBeLessThan(
      body.indexOf("Due in six days"),
    );
    expect(body).toContain("- Due tomorrow, tous les 30 jours");
    expect(body).toContain("- Due in six days, tous les 7 jours");
  });
});
