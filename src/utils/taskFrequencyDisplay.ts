import type { Task } from "../types/derived";

type TaskFrequencyUnit = Task["frequency"]["unit"];

export const formatTaskFrequency = (
  unitInEnglish: TaskFrequencyUnit,
  value: number,
): string => {
  const translations: Record<TaskFrequencyUnit, string> = {
    day: "jour",
    week: "semaine",
    month: "mois",
    year: "an",
  };
  const prefix =
    unitInEnglish === "week"
      ? "Fréquence: toutes les "
      : "Fréquence: tous les ";

  if (value === 1) {
    return `${prefix}${translations[unitInEnglish]}${unitInEnglish === "month" ? "" : "s"}`;
  }

  if (value > 1 && unitInEnglish !== "month") {
    return `${prefix}${value} ${translations[unitInEnglish]}s`;
  }

  return `${prefix}${value} ${translations[unitInEnglish]}`;
};
