// @ts-check
import {
    DynamoDBClient,
    ScanCommand,
    PutItemCommand,
    UpdateItemCommand
} from "@aws-sdk/client-dynamodb";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
/**
 * @typedef {import("../shared/types").Task} Task
 */

const client = new DynamoDBClient({ region: "eu-north-1" });

async function deleteTask(taskId) {
    try {
        const command = new DeleteCommand({
            TableName: "tasks",
            Key: {
                id: taskId,
            },
            // only delete if it exists
            ConditionExpression: "attribute_exists(id)",
        });

        const result = await client.send(command);
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
        const data = await client.send(new ScanCommand({ TableName: "tasks" }));
        const now = new Date();

        // Convert raw DynamoDB items to Task[]
        let tasks = data.Items?.map((item) => ({
            id: item.id.S,
            title: item.title.S,
            checked: item.checked.BOOL,
            lastChecked: item.lastChecked?.S,
            frequency: {
                value: parseInt(item.frequency.M.value.N, 10),
                unit: item.frequency.M.unit.S
            },
            tags: item.tags?.L?.map((tag) => tag.S) || [],
        })) || [];

        // Auto-uncheck logic
        const tasksToUpdate = [];
        const DAYS_IN_WEEK = 7;
        const DAYS_IN_MONTH = 30;
        const DAYS_IN_YEAR = 365;
        const unitToDaysMap = {
            day: 1,
            week: DAYS_IN_WEEK,
            month: DAYS_IN_MONTH,
            year: DAYS_IN_YEAR,
        };
        tasks = tasks.map((task) => {
            if (task.checked && task.lastChecked) {
                const last = new Date(task.lastChecked);

                // TODO: switcher vers une logique où on calcule la date d'échéance, mais on tronque à minuit et 1s
                const diffDaysEffective = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
                const diffDaysAllowed = task.frequency.value * unitToDaysMap[task.frequency.unit];

                // const shouldUncheck = diffDaysEffective >= diffDaysAllowed;
                const shouldUncheck = Math.floor(diffDaysEffective) >= diffDaysAllowed; // test Aug 24: compare dates instead of comparing durations.

                if (shouldUncheck) {
                    console.log('Unchecking task %s', task.title);
                    task.checked = false;
                    tasksToUpdate.push(task);
                }
            }
            return task;
        });

        // Persist unchecked tasks
        for (const task of tasksToUpdate) {
            await client.send(
                new UpdateItemCommand({
                    TableName: "tasks",
                    Key: { id: { S: task.id } },
                    UpdateExpression: "SET checked = :checked, lastChecked = :lastChecked",
                    ExpressionAttributeValues: {
                        ":checked": { BOOL: false },
                        ":lastChecked": { S: "" }
                    }
                })
            );
        }

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
        const body = JSON.parse(event.body);
        console.log("DEBUG: body", body);
        await client.send(
            new PutItemCommand({
                TableName: "tasks",
                Item: {
                    id: { S: randomUUID() },
                    title: { S: body.title },
                    checked: { BOOL: false },
                    lastChecked: { S: "" },
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
            }
        };
    }

    if (method === "PUT") {
        const body = JSON.parse(event.body);
        await client.send(
            new UpdateItemCommand({
                TableName: "tasks",
                Key: { id: { S: body.id } },
                UpdateExpression: "SET checked = :checked, lastChecked = :lastChecked",
                ExpressionAttributeValues: {
                    ":checked": { BOOL: body.checked },
                    ":lastChecked": { S: body.lastChecked || "" }
                }
            })
        );
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Task updated" }),
            headers: {
                "Access-Control-Allow-Origin": "*",
            }
        };
    }

    if (method === "DELETE") {
        const body = JSON.parse(event.body);
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
