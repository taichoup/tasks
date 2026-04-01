// Raw DynamoDB attribute shape returned by a Scan on the tasks table.
export type DynamoDBRawTask = {
    id: { S: string };
    title: { S: string };
    checkedAt?: { S?: string };
    frequency: { M: { value: { N: string }; unit: { S: string } } };
    tags?: { L?: Array<{ S: string }> };
};

export type FrequencyUnit = "day" | "week" | "month" | "year";

export type Task = {
    id: string;
    title: string;
    checkedAt: string;
    frequency: { value: number; unit: FrequencyUnit };
    tags: string[];
};

const UNIT_TO_DAYS: Record<FrequencyUnit, number> = {
    day: 1,
    week: 7,
    month: 30,
    year: 365,
};

export function normalizeTask(item: DynamoDBRawTask): Task {
    return {
        id: item.id.S,
        title: item.title.S,
        checkedAt: item.checkedAt?.S ?? "",
        frequency: {
            value: parseInt(item.frequency.M.value.N, 10),
            unit: item.frequency.M.unit.S as FrequencyUnit,
        },
        tags: item.tags?.L?.map((tag) => tag.S) ?? [],
    };
}

export function convertFrequencyToDays(task: Pick<Task, "frequency">): number {
    return task.frequency.value * UNIT_TO_DAYS[task.frequency.unit];
}
