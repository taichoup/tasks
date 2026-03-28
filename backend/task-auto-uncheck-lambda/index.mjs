import {
    DynamoDBClient,
    ScanCommand,
    UpdateItemCommand
} from "@aws-sdk/client-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const AWS_REGION = process.env.AWS_REGION || "eu-north-1";
const TASKS_TABLE_NAME = process.env.TASKS_TABLE_NAME || "tasks";
const EMAIL_FROM = process.env.EMAIL_FROM || "tasks@moulindelingoult.fr";
const EMAIL_TO = process.env.EMAIL_TO || "dallemanuel@gmail.com";

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

    console.log("DEBUG: Tasks: %o", tasks);

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
            const diffDaysEffective = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
            const diffDaysAllowed = task.frequency.value * unitToDaysMap[task.frequency.unit];
            const shouldUncheck = Math.floor(diffDaysEffective) >= diffDaysAllowed;

            console.log(
                "DEBUG: Task %s: diffDaysEffective: %s, diffDaysAllowed: %s, shouldUncheck: %s",
                task.title,
                diffDaysEffective,
                diffDaysAllowed,
                shouldUncheck
            );

            if (shouldUncheck) {
                console.log("DEBUG: Unchecking task %s", task.title);
                task.checked = false;
                tasksToUpdate.push(task);
                sendEmail(EMAIL_TO, "Task unchecked", `Task unchecked: ${task.title}`);
            }
        }
        return task;
    });

    for (const task of tasksToUpdate) {
        console.log("DEBUG: Updating task %s", task.title);

        await DBClient.send(
            new UpdateItemCommand({
                TableName: TASKS_TABLE_NAME,
                Key: { id: { S: task.id } },
                UpdateExpression: "SET checked = :checked, lastChecked = :lastChecked",
                ExpressionAttributeValues: {
                    ":checked": { BOOL: false },
                    ":lastChecked": { S: "" }
                }
            })
        );
    }

    return { status: "ok", unchecked: tasksToUpdate.length };
};
