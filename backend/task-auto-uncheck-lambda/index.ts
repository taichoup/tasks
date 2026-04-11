import {
    DynamoDBClient,
    ScanCommand,
    type ScanCommandOutput,
    UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { normalizeTask, convertFrequencyToDays } from "../shared/taskUtils.js";
import type { DynamoDBRawTask } from "../shared/taskUtils.js";
import { AWS_REGION, TASKS_TABLE_NAME, EMAIL_FROM, EMAIL_TO } from "../shared/config.js";

const DBClient = new DynamoDBClient({ region: AWS_REGION });
const mailClient = new SESClient({ region: AWS_REGION });

async function sendEmail(to: string, subject: string, body: string) {
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
    const now = new Date();
    const items: DynamoDBRawTask[] = [];
    let lastEvaluatedKey: ScanCommandOutput["LastEvaluatedKey"];

    do {
        const data = await DBClient.send(
            new ScanCommand({
                TableName: TASKS_TABLE_NAME,
                ...(lastEvaluatedKey ? { ExclusiveStartKey: lastEvaluatedKey } : {}),
            })
        );

        items.push(...((data.Items as DynamoDBRawTask[] | undefined) ?? []));
        lastEvaluatedKey = data.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    const tasks = items.map((item) => normalizeTask(item));

    console.log("DEBUG: Tasks: %o", tasks);

    let uncheckedCount = 0;

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

        await DBClient.send(
            new UpdateItemCommand({
                TableName: TASKS_TABLE_NAME,
                Key: { id: { S: task.id } },
                UpdateExpression: "SET checkedAt = :checkedAt",
                ExpressionAttributeValues: {
                    ":checkedAt": { S: "" },
                },
            })
        );

        uncheckedCount += 1;

        try {
            await sendEmail(EMAIL_TO, "Task unchecked", `Task unchecked: ${task.title}`);
        } catch (error) {
            console.error("Failed to send uncheck email for task %s:", task.title, error);
        }
    }

    return { status: "ok", unchecked: uncheckedCount };
};
