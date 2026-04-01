/**
 * Reads a required environment variable and throws if it is not set.
 * @param {string} name
 */
function required(name) {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}

export const AWS_REGION = process.env.AWS_REGION;
export const TASKS_TABLE_NAME = required("TASKS_TABLE_NAME");
export const EMAIL_FROM = required("EMAIL_FROM");
export const EMAIL_TO = required("EMAIL_TO");
export const DIGEST_MAX_TASKS = Number(process.env.DIGEST_MAX_TASKS || 10);
