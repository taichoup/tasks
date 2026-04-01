const UNIT_TO_DAYS = {
    day: 1,
    week: 7,
    month: 30,
    year: 365,
};

/**
 * Convert a raw DynamoDB item to a Task object.
 * @param {import("@aws-sdk/client-dynamodb").AttributeValue & Record<string, any>} item
 */
export function normalizeTask(item) {
    return {
        id: item.id.S,
        title: item.title.S,
        checkedAt: item.checkedAt?.S || "",
        frequency: {
            value: parseInt(item.frequency.M.value.N, 10),
            unit: item.frequency.M.unit.S,
        },
        tags: item.tags?.L?.map((tag) => tag.S) || [],
    };
}

/**
 * Return the number of days equivalent to a task's frequency.
 * @param {{ frequency: { value: number, unit: string } }} task
 */
export function convertFrequencyToDays(task) {
    return task.frequency.value * UNIT_TO_DAYS[task.frequency.unit];
}
