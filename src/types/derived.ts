import type { components } from "../../shared/generated-types";

export type Task = components["schemas"]["Task"];
export type NonNullishTag = NonNullable<components["schemas"]["Task"]["tags"]>[number];
export type TagList = NonNullable<components["schemas"]["Task"]["tags"]> | [];