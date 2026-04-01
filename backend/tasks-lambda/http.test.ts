import { describe, expect, it } from "vitest";
import { invalidJsonResponse, parseJsonBody, validationErrorResponse } from "./http.js";
import { newTaskSchema } from "./schemas.js";

describe("parseJsonBody", () => {
    it("parses valid JSON bodies", () => {
        const result = parseJsonBody({
            body: JSON.stringify({ id: "task-1" }),
        });

        expect(result).toEqual({
            success: true,
            data: { id: "task-1" },
        });
    });

    it("returns a formatted error response for invalid JSON", () => {
        const result = parseJsonBody({
            body: "{invalid json",
        });

        expect(result.success).toBe(false);
        expect(result.response).toEqual(invalidJsonResponse());
    });
});

describe("validationErrorResponse", () => {
    it("returns a 400 response with flattened zod errors", () => {
        const parsed = newTaskSchema.safeParse({
            title: "",
            frequency: {
                unit: "day",
                value: 0,
            },
        });

        expect(parsed.success).toBe(false);

        const response = validationErrorResponse(parsed.error);

        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toMatchObject({
            message: "Invalid request body",
        });
        expect(response.headers["Access-Control-Allow-Origin"]).toBe("*");
    });
});
