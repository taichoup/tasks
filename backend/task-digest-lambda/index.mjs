// This Lambda is meant to be triggered on a schedule (e.g. weekly) to send an email digest of upcoming tasks.
// It's a draft by Codex, I've set it up in AWS (TaskDigest) but the priority logic needs work.

import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const AWS_REGION = process.env.AWS_REGION || "eu-north-1";
const TASKS_TABLE_NAME = process.env.TASKS_TABLE_NAME || "tasks";
const EMAIL_FROM = process.env.EMAIL_FROM || "tasks@moulindelingoult.fr";
const EMAIL_TO = process.env.EMAIL_TO || "dallemanuel@gmail.com";
const DIGEST_MAX_TASKS = Number(process.env.DIGEST_MAX_TASKS || 10);

const DBClient = new DynamoDBClient({ region: AWS_REGION });
const mailClient = new SESClient({ region: AWS_REGION });

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function convertFrequencyToDays(task) {
    const unitToDaysMap = {
        day: 1,
        week: 7,
        month: 30,
        year: 365,
    };

    return task.frequency.value * unitToDaysMap[task.frequency.unit];
}

function normalizeTask(item) {
    return {
        id: item.id.S,
        title: item.title.S,
        checkedAt: item.checkedAt?.S || item.lastChecked?.S || "",
        frequency: {
            value: parseInt(item.frequency.M.value.N, 10),
            unit: item.frequency.M.unit.S,
        },
        tags: item.tags?.L?.map((tag) => tag.S) || [],
    };
}

function buildPriorityView(task, now) {
    const recurrenceDays = convertFrequencyToDays(task);
    const isDueNow = !task.checkedAt;

    if (isDueNow) {
        return {
            ...task,
            recurrenceDays,
            urgencyBucket: 0,
            urgencyLabel: "A faire",
        };
    }

    const checkedAt = new Date(task.checkedAt);
    const nextDueAt = new Date(checkedAt.getTime() + recurrenceDays * DAY_IN_MS);
    const msUntilDue = nextDueAt.getTime() - now.getTime();
    const daysUntilDue = Math.ceil(msUntilDue / DAY_IN_MS);

    return {
        ...task,
        recurrenceDays,
        nextDueAt,
        daysUntilDue,
        urgencyBucket: 1,
        urgencyLabel: daysUntilDue <= 0
            ? "En retard"
            : `Dans ${daysUntilDue} jour${daysUntilDue > 1 ? "s" : ""}`,
    };
}

function comparePriority(a, b) {
    if (a.urgencyBucket !== b.urgencyBucket) {
        return a.urgencyBucket - b.urgencyBucket;
    }

    if (a.recurrenceDays !== b.recurrenceDays) {
        return a.recurrenceDays - b.recurrenceDays;
    }

    return a.title.localeCompare(b.title, "fr");
}

function formatTaskLine(task) {
    const tagsSuffix = task.tags.length > 0 ? ` [${task.tags.join(", ")}]` : "";
    const cadence = `tous les ${task.frequency.value} ${task.frequency.unit}${task.frequency.value > 1 ? "s" : ""}`;
    return `- ${task.title} (${task.urgencyLabel}, ${cadence})${tagsSuffix}`;
}

function buildEmailBody(tasks, now) {
    const dueTasks = tasks.filter((task) => task.urgencyBucket === 0);
    const upcomingTasks = tasks.filter((task) => task.urgencyBucket === 1);
    const lines = [
        `Digest du ${new Intl.DateTimeFormat("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        }).format(now)}`,
        "",
        `${dueTasks.length} tache(s) a faire maintenant.`,
    ];

    if (dueTasks.length > 0) {
        lines.push("");
        lines.push("Priorites de la semaine :");
        lines.push(...dueTasks.map(formatTaskLine));
    }

    if (upcomingTasks.length > 0) {
        lines.push("");
        lines.push("A surveiller ensuite :");
        lines.push(...upcomingTasks.map(formatTaskLine));
    }

    return lines.join("\n");
}

async function sendEmail(subject, body) {
    const command = new SendEmailCommand({
        Destination: {
            ToAddresses: [EMAIL_TO],
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
    });

    return mailClient.send(command);
}

export const handler = async () => {
    const now = new Date();
    const data = await DBClient.send(new ScanCommand({ TableName: TASKS_TABLE_NAME }));
    const tasks = (data.Items || []).map(normalizeTask);

    const prioritizedTasks = tasks
        .map((task) => buildPriorityView(task, now))
        .sort(comparePriority)
        .slice(0, DIGEST_MAX_TASKS);

    const subject = `Tasks digest - ${new Intl.DateTimeFormat("fr-FR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now)}`;
    const body = buildEmailBody(prioritizedTasks, now);

    await sendEmail(subject, body);

    return {
        status: "ok",
        sentTo: EMAIL_TO,
        taskCount: prioritizedTasks.length,
    };
};
