import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    registrationData?: {
      username: string;
      phone: string;
      password: string;
    };
    wwid?: string;
  }
}
