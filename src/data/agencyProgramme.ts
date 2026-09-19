/** Shared navigation and content for the Agency & VA public area. */

export const agencyNavLinks = [
  { key: 'agency.nav.programme', to: '/agency' },
  { key: 'agency.nav.howItWorks', to: '/agency/how-it-works' },
  { key: 'agency.nav.commission', to: '/agency/commission' },
  { key: 'agency.nav.whoCanJoin', to: '/agency/who-can-join' },
  { key: 'agency.nav.faq', to: '/agency/faq' },
] as const;

export const agencyApplyPath = '/agency/apply';
export const agencySignInPath = '/agency/signin';
