export interface Server {
  pid: number;
  port: number;
  project_name: string;
  framework: string;
  uptime_seconds: number;
  process_name: string;
  category: "dev" | "app" | "system";
  description: string;
}
