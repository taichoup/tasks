// Intl.DurationFormat is not yet included in TypeScript's built-in lib files.
declare namespace Intl {
  interface DurationFormatOptions {
    style?: "long" | "short" | "narrow" | "digital";
  }

  interface Duration {
    years?: number;
    months?: number;
    weeks?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
  }

  class DurationFormat {
    constructor(locale?: string | string[], options?: DurationFormatOptions);
    format(duration: Duration): string;
  }
}
