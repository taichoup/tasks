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

    class UpdateItemCommand {
        input;

        constructor(input) {
            this.input = input;
        }
    }

    return {
        DynamoDBClient,
        ScanCommand,
        UpdateItemCommand,
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

beforeAll(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-11T12:00:00.000Z"));
    vi.stubEnv("AWS_REGION", "eu-west-3");
    vi.stubEnv("TASKS_TABLE_NAME", "test-tasks");
    vi.stubEnv("EMAIL_FROM", "from@example.com");
    vi.stubEnv("EMAIL_TO", "to@example.com");
    ({ handler } = await import("./index.js"));
});

beforeEach(() => {
    dbSendMock.mockReset();
    mailSendMock.mockReset();
});

describe("task auto-uncheck lambda", () => {
    it("continues scanning later pages and unchecks expired tasks found there", async () => {
        dbSendMock
            .mockResolvedValueOnce({
                Items: [
                    {
                        id: { S: "task-1" },
                        title: { S: "Recent task" },
                        checkedAt: { S: "2026-04-10T12:00:00.000Z" },
                        frequency: {
                            M: {
                                value: { N: "7" },
                                unit: { S: "day" },
                            },
                        },
                    },
                ],
                LastEvaluatedKey: {
                    id: { S: "task-1" },
                },
            })
            .mockResolvedValueOnce({
                Items: [
                    {
                        id: { S: "task-2" },
                        title: { S: "Expired task" },
                        checkedAt: { S: "2026-04-09T11:00:00.000Z" },
                        frequency: {
                            M: {
                                value: { N: "1" },
                                unit: { S: "day" },
                            },
                        },
                    },
                ],
            })
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({});
        mailSendMock.mockResolvedValueOnce({});

        const response = await handler();

        expect(response).toEqual({ status: "ok", unchecked: 1 });
        expect(dbSendMock).toHaveBeenCalledTimes(3);
        expect(dbSendMock.mock.calls[0][0].input).toEqual({
            TableName: "test-tasks",
        });
        expect(dbSendMock.mock.calls[1][0].input).toEqual({
            TableName: "test-tasks",
            ExclusiveStartKey: {
                id: { S: "task-1" },
            },
        });
        expect(mailSendMock).toHaveBeenCalledTimes(1);
        expect(mailSendMock.mock.calls[0][0].input.Message.Subject.Data).toBe("Task unchecked");
        expect(dbSendMock.mock.calls[2][0].input).toMatchObject({
            TableName: "test-tasks",
            Key: { id: { S: "task-2" } },
            ExpressionAttributeValues: {
                ":checkedAt": { S: "" },
            },
        });
    });

    it("still unchecks tasks when sending the email fails", async () => {
        dbSendMock
            .mockResolvedValueOnce({
                Items: [
                    {
                        id: { S: "task-3" },
                        title: { S: "Expired with SES failure" },
                        checkedAt: { S: "2026-04-08T12:00:00.000Z" },
                        frequency: {
                            M: {
                                value: { N: "1" },
                                unit: { S: "day" },
                            },
                        },
                    },
                ],
            })
            .mockResolvedValueOnce({});
        mailSendMock.mockRejectedValueOnce(new Error("SES unavailable"));

        const response = await handler();

        expect(response).toEqual({ status: "ok", unchecked: 1 });
        expect(dbSendMock).toHaveBeenCalledTimes(2);
        expect(dbSendMock.mock.calls[1][0].input).toMatchObject({
            TableName: "test-tasks",
            Key: { id: { S: "task-3" } },
            ExpressionAttributeValues: {
                ":checkedAt": { S: "" },
            },
        });
        expect(mailSendMock).toHaveBeenCalledTimes(1);
    });
});
