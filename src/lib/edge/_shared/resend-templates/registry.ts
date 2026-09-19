import * as welcome from "./welcome";
import * as announcement from "./announcement";
import * as orderUpdate from "./order-update";
import * as promo from "./promo";
import * as newsletter from "./newsletter";
import * as generic from "./generic";

export interface ResendTemplate {
  subject: (data: any) => string;
  html: (data: any) => string;
}

export const TEMPLATES: Record<string, ResendTemplate> = {
  welcome,
  announcement,
  "order-update": orderUpdate,
  promo,
  newsletter,
  generic,
};

export type TemplateName = keyof typeof TEMPLATES;
