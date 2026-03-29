export function validationErrorResponse(error) {
    return {
        statusCode: 400,
        body: JSON.stringify({
            message: "Invalid request body",
            errors: error.flatten(),
        }),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    };
}

export function invalidJsonResponse() {
    return {
        statusCode: 400,
        body: JSON.stringify({ message: "Request body must be valid JSON" }),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    };
}

export function parseJsonBody(event) {
    try {
        return {
            success: true,
            data: JSON.parse(event.body || "{}"),
        };
    } catch {
        return {
            success: false,
            response: invalidJsonResponse(),
        };
    }
}

export function badRequestResponse(message, fieldErrors = {}) {
    return {
        statusCode: 400,
        body: JSON.stringify({
            message,
            errors: {
                formErrors: [],
                fieldErrors,
            },
        }),
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    };
}

