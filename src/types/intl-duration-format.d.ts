// Local typing shim for Intl.DurationFormat.
// TypeScript 5.8 in this repo does not expose these typings yet, even though
// the runtime API exists in modern browsers. This is currently used by
// src/components/Task.tsx to format the remaining time until a task is unchecked.
declare namespace Intl {
  interface DurationFormatOptions {
    localeMatcher?: "best fit" | "lookup";
    style?: "long" | "short" | "narrow" | "digital";
  }

  interface DurationInput {
    years?: number;
    months?: number;
    weeks?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
    microseconds?: number;
    nanoseconds?: number;
  }

  class DurationFormat {
    constructor(
      locales?: string | readonly string[],
      options?: DurationFormatOptions,
    );
    format(duration: DurationInput): string;
  }
}
