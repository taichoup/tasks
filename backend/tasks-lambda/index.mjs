// @ts-check
import {
    DynamoDBClient,
    ScanCommand,
    PutItemCommand,
    UpdateItemCommand
} from "@aws-sdk/client-dynamodb";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { AWS_REGION, TASKS_TABLE_NAME } from "./config.mjs";
import { parseJsonBody, validationErrorResponse } from "./http.mjs";
import { deleteTaskSchema, newTaskSchema, updateTaskSchema } from "./schemas.mjs";
/**
 * @typedef {import("../shared/types").Task} Task
 */

const DBClient = new DynamoDBClient({ region: AWS_REGION });

async function deleteTask(taskId) {
    try {
        const command = new DeleteCommand({
            TableName: TASKS_TABLE_NAME,
            Key: {
                id: taskId,
            },
            // only delete if it exists
            ConditionExpression: "attribute_exists(id)",
        });

        const result = await DBClient.send(command);
        console.log("DEBUG: Deleted task:", taskId, result);
        return result;
    } catch (err) {
        if (err.name === "ConditionalCheckFailedException") {
            console.error(`Task with ID ${taskId} does not exist.`);
        } else {
            console.error("Error deleting task:", err);
        }
        throw err;
    }
}

export const handler = async (event) => {
    const method = event.requestContext?.http?.method || event.httpMethod;

    if (method === "GET") {
        const data = await DBClient.send(new ScanCommand({ TableName: TASKS_TABLE_NAME }));

        // Convert raw DynamoDB items to Task[]
        const tasks = data.Items?.map((item) => ({
            id: item.id.S,
            title: item.title.S,
            checkedAt: item.checkedAt?.S || "",
            frequency: {
                value: parseInt(item.frequency.M.value.N, 10),
                unit: item.frequency.M.unit.S
            },
            tags: item.tags?.L?.map((tag) => tag.S) || [],
        })) || [];

        return {
            statusCode: 200,
            body: JSON.stringify(tasks),
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        };
    }

    if (method === "POST") {
        const parsedBody = parseJsonBody(event);
        if (!parsedBody.success) return parsedBody.response;
        const validatedBody = newTaskSchema.safeParse(parsedBody.data);
        if (!validatedBody.success) return validationErrorResponse(validatedBody.error);
        const body = validatedBody.data;
        console.log("DEBUG: body", body);
        await DBClient.send(
            new PutItemCommand({
                TableName: TASKS_TABLE_NAME,
                Item: {
                    id: { S: randomUUID() },
                    title: { S: body.title },
                    checkedAt: { S: "" },
                    frequency: {
                        M: {
                            unit: { S: body.frequency.unit },
                            value: { N: body.frequency.value.toString() }
                        }
                    },
                    tags: { L: body.tags.map((tag) => ({ S: tag })) }
                }
            })
        );
        return {
            statusCode: 201,
            body: JSON.stringify({ message: "Task added" }),
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
        };
    }

    if (method === "PUT") {
        const parsedBody = parseJsonBody(event);
        if (!parsedBody.success) return parsedBody.response;
        const validatedBody = updateTaskSchema.safeParse(parsedBody.data);
        if (!validatedBody.success) return validationErrorResponse(validatedBody.error);
        const body = validatedBody.data;
        const checkedAt = body.checkedAt ?? "";
        await DBClient.send(
            new UpdateItemCommand({
                TableName: TASKS_TABLE_NAME,
                Key: { id: { S: body.id } },
                UpdateExpression: "SET checkedAt = :checkedAt",
                ExpressionAttributeValues: {
                    ":checkedAt": { S: checkedAt }
                }
            })
        );
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Task updated" }),
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        };
    }

    if (method === "DELETE") {
        const parsedBody = parseJsonBody(event);
        if (!parsedBody.success) return parsedBody.response;
        const validatedBody = deleteTaskSchema.safeParse(parsedBody.data);
        if (!validatedBody.success) return validationErrorResponse(validatedBody.error);
        const body = validatedBody.data;
        console.log("DEBUG: body", body);
        await deleteTask(body.id);
        return {
            statusCode: 204,
            body: JSON.stringify({ message: "Task deleted" }),
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
                "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
            }
        };
    };

    if (method === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        };
    }

    return { statusCode: 405, body: "Method not allowed" };
}
