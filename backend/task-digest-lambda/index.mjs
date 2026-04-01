// This Lambda is meant to be triggered on a schedule (e.g. weekly) to send an email digest of upcoming tasks.
// It's a draft by Codex, I've set it up in AWS (TaskDigest) but the priority logic needs work.

import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { normalizeTask, convertFrequencyToDays } from "../shared/taskUtils.mjs";

const AWS_REGION = process.env.AWS_REGION || "eu-north-1";
const TASKS_TABLE_NAME = process.env.TASKS_TABLE_NAME || "tasks";
const EMAIL_FROM = process.env.EMAIL_FROM || "tasks@moulindelingoult.fr";
const EMAIL_TO = process.env.EMAIL_TO || "dallemanuel@gmail.com";
const DIGEST_MAX_TASKS = Number(process.env.DIGEST_MAX_TASKS || 10);

const DBClient = new DynamoDBClient({ region: AWS_REGION });
const mailClient = new SESClient({ region: AWS_REGION });

const DAY_IN_MS = 24 * 60 * 60 * 1000;

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
    const duration = {
        years: task.frequency.unit === "year" ? task.frequency.value : 0,
        months: task.frequency.unit === "month" ? task.frequency.value : 0,
        weeks: task.frequency.unit === "week" ? task.frequency.value : 0,
        days: task.frequency.unit === "day" ? task.frequency.value : 0,
    };
    const cadence = new Intl.DurationFormat("fr-FR", { style: "long", units: task.frequency.unit }).format(duration);
    const formattedCadence = `tous les ${cadence}`;
    return `- ${task.title}, ${formattedCadence}`;
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
        `${dueTasks.length} tâche(s) disponible(s) :`,
    ];

    if (dueTasks.length > 0) {
        lines.push("");
        lines.push("Non commencées :");
        lines.push(...dueTasks.map(formatTaskLine));
    }

    if (upcomingTasks.length > 0) {
        lines.push("");
        lines.push("À refaire bientôt :");
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
