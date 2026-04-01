import type { ZodError } from "zod";

type LambdaResponse = {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
};

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

export function validationErrorResponse(error: ZodError): LambdaResponse {
    return {
        statusCode: 400,
        body: JSON.stringify({
            message: "Invalid request body",
            errors: error.flatten(),
        }),
        headers: CORS_HEADERS,
    };
}

export function invalidJsonResponse(): LambdaResponse {
    return {
        statusCode: 400,
        body: JSON.stringify({ message: "Request body must be valid JSON" }),
        headers: CORS_HEADERS,
    };
}

export function parseJsonBody(event: { body?: string | null }):
    | { success: true; data: unknown }
    | { success: false; response: LambdaResponse } {
    try {
        return {
            success: true,
            data: JSON.parse(event.body ?? "{}"),
        };
    } catch {
        return {
            success: false,
            response: invalidJsonResponse(),
        };
    }
}

export function badRequestResponse(
    message: string,
    fieldErrors: Record<string, string[]> = {}
): LambdaResponse {
    return {
        statusCode: 400,
        body: JSON.stringify({
            message,
            errors: {
                formErrors: [],
                fieldErrors,
            },
        }),
        headers: CORS_HEADERS,
    };
}
