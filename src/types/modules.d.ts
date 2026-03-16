declare module "@/github" {
  interface ContributionDay {
    contributionCount: number;
    date: string;
    color: string;
  }

  interface ContributionWeek {
    contributionDays: ContributionDay[];
  }

  interface ContributionCalendar {
    totalContributions: number;
    weeks: ContributionWeek[];
  }

  export function fetchContributions(username: string): Promise<ContributionCalendar>;
}

declare module "@/render" {
  export function renderWallpaper(
    calendar: import("@/github").ContributionCalendar,
    options?: {
      theme?: string;
      device?: string;
      stats?: boolean;
      user?: string;
    }
  ): Buffer;
}

declare module "@/themes" {
  interface Theme {
    name: string;
    background: string;
    empty: string;
    levels: string[];
    text: string;
    subtext: string;
  }

  export const THEMES: Record<string, Theme>;
  export function getTheme(name: string): Theme;
}

declare module "@/devices" {
  interface Device {
    width: number;
    height: number;
    name: string;
  }

  export const DEVICES: Record<string, Device>;
  export function getDevice(name: string): Device;
}
