import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("@aws-sdk/client-dynamodb", () => {
    class DynamoDBClient {
        send = sendMock;
    }

    class ScanCommand {
        constructor(input) {
            this.input = input;
        }
    }

    class PutItemCommand {
        constructor(input) {
            this.input = input;
        }
    }

    class UpdateItemCommand {
        constructor(input) {
            this.input = input;
        }
    }

    return {
        DynamoDBClient,
        ScanCommand,
        PutItemCommand,
        UpdateItemCommand,
    };
});

vi.mock("@aws-sdk/lib-dynamodb", () => {
    class DeleteCommand {
        constructor(input) {
            this.input = input;
        }
    }

    return { DeleteCommand };
});

import type { handler as HandlerType } from "./index.js";
let handler: typeof HandlerType;

beforeAll(async () => {
    vi.stubEnv("TASKS_TABLE_NAME", "test-tasks");
    vi.stubEnv("EMAIL_FROM", "from@example.com");
    vi.stubEnv("EMAIL_TO", "to@example.com");
    ({ handler } = await import("./index.js"));
});

beforeEach(() => {
    sendMock.mockReset();
});

describe("tasks lambda handler", () => {
    it("returns 400 for invalid JSON in POST requests", async () => {
        const response = await handler({
            httpMethod: "POST",
            body: "{not valid json",
        });

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toEqual({
            message: "Request body must be valid JSON",
        });
        expect(sendMock).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid POST payloads", async () => {
        const response = await handler({
            httpMethod: "POST",
            body: JSON.stringify({
                title: "",
                frequency: {
                    unit: "day",
                    value: 0,
                },
            }),
        });

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toMatchObject({
            message: "Invalid request body",
        });
        expect(sendMock).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid PUT payloads", async () => {
        const response = await handler({
            httpMethod: "PUT",
            body: JSON.stringify({
                id: "task-1",
                checkedAt: "not-a-date",
            }),
        });

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toMatchObject({
            message: "Invalid request body",
        });
        expect(sendMock).not.toHaveBeenCalled();
    });

    it("returns 400 for missing path param on DELETE requests", async () => {
        const response = await handler({
            httpMethod: "DELETE",
        });

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toMatchObject({
            message: "Invalid request path",
            errors: {
                fieldErrors: {
                    id: ["Path parameter 'id' is required"],
                },
            },
        });
        expect(sendMock).not.toHaveBeenCalled();
    });

    it("deletes the task identified by the path parameter", async () => {
        sendMock.mockResolvedValue({});

        const response = await handler({
            httpMethod: "DELETE",
            pathParameters: {
                id: "task-1",
            },
        });

        expect(response.statusCode).toBe(204);
        expect(JSON.parse(response.body)).toEqual({ message: "Task deleted" });
        expect(sendMock).toHaveBeenCalledTimes(1);
    });

    it("maps GET results into API tasks", async () => {
        sendMock.mockResolvedValue({
            Items: [
                {
                    id: { S: "task-1" },
                    title: { S: "Arroser les plantes" },
                    checkedAt: { S: "2026-03-29T10:00:00.000Z" },
                    frequency: {
                        M: {
                            value: { N: "2" },
                            unit: { S: "week" },
                        },
                    },
                    tags: {
                        L: [{ S: "jardin" }],
                    },
                },
            ],
        });

        const response = await handler({
            requestContext: {
                http: {
                    method: "GET",
                },
            },
        });

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual([
            {
                id: "task-1",
                title: "Arroser les plantes",
                checkedAt: "2026-03-29T10:00:00.000Z",
                frequency: {
                    value: 2,
                    unit: "week",
                },
                tags: ["jardin"],
            },
        ]);
        expect(sendMock).toHaveBeenCalledTimes(1);
    });
});
