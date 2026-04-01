import {
    DynamoDBClient,
    ScanCommand,
    UpdateItemCommand
} from "@aws-sdk/client-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { normalizeTask, convertFrequencyToDays } from "../shared/taskUtils.mjs";
import { AWS_REGION, TASKS_TABLE_NAME, EMAIL_FROM, EMAIL_TO } from "../shared/config.mjs";

const DBClient = new DynamoDBClient({ region: AWS_REGION });
const mailClient = new SESClient({ region: AWS_REGION });

async function sendEmail(to, subject, body) {
    const params = {
        Destination: {
            ToAddresses: [to],
        },
        Message: {
            Body: {
                Text: {
                    Data: body,
                },
            },
            Subject: {
                Data: subject,
            },
        },
        Source: EMAIL_FROM,
    };

    try {
        console.log("Attempting to send email...");
        const data = await mailClient.send(new SendEmailCommand(params));
        console.log("Email sent successfully:", data);
        return data;
    } catch (err) {
        console.error("Error sending email:", err);
        throw err;
    }
}

export const handler = async () => {
    const data = await DBClient.send(new ScanCommand({ TableName: TASKS_TABLE_NAME }));
    const now = new Date();

    const tasks = data.Items?.map(normalizeTask) || [];

    console.log("DEBUG: Tasks: %o", tasks);

    const tasksToUpdate = [];

    for (const task of tasks) {
        if (!task.checkedAt) continue;

        const last = new Date(task.checkedAt);
        const diffDaysEffective = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
        const diffDaysAllowed = convertFrequencyToDays(task);
        const shouldUncheck = Math.floor(diffDaysEffective) >= diffDaysAllowed;

        console.log(
            "DEBUG: Task %s: diffDaysEffective: %s, diffDaysAllowed: %s, shouldUncheck: %s",
            task.title,
            diffDaysEffective,
            diffDaysAllowed,
            shouldUncheck
        );

        if (!shouldUncheck) continue;

        console.log("DEBUG: Unchecking task %s", task.title);
        task.checkedAt = "";
        tasksToUpdate.push(task);
        await sendEmail(EMAIL_TO, "Task unchecked", `Task unchecked: ${task.title}`);
    }

    for (const task of tasksToUpdate) {
        console.log("DEBUG: Updating task %s", task.title);

        await DBClient.send(
            new UpdateItemCommand({
                TableName: TASKS_TABLE_NAME,
                Key: { id: { S: task.id } },
                UpdateExpression: "SET checkedAt = :checkedAt",
                ExpressionAttributeValues: {
                    ":checkedAt": { S: "" }
                }
            })
        );
    }

    return { status: "ok", unchecked: tasksToUpdate.length };
};
