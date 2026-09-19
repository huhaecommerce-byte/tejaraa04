export interface PricingPlan {
  name: string;
  price: string;
  desc: string;
  features: string[];
  cta: string;
  popular: boolean;
}

export const defaultPlans: PricingPlan[] = [
  {
    name: 'Starter',
    price: 'Free',
    desc: 'Perfect for testing the waters',
    features: ['Browse full catalog', 'Dropship up to 50 orders/mo', 'Basic labelling service', 'Standard delivery', 'Email support'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Growth',
    price: 'SAR 299/mo',
    desc: 'For growing Amazon & Noon sellers',
    features: ['Everything in Starter', 'Unlimited dropship orders', 'Priority labelling queue', 'Bulk order discounts (5%)', 'Express delivery option', 'Dedicated account manager', 'Wallet with credit terms'],
    cta: 'Start Growing',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    desc: 'For high-volume sellers',
    features: ['Everything in Growth', 'Custom sourcing requests', 'Bulk discounts up to 15%', 'White-label packaging', 'API access', 'Priority support 24/7', 'Custom payment terms'],
    cta: 'Contact Sales',
    popular: false,
  },
];
