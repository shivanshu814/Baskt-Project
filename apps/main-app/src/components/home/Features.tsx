import React from 'react';
import { BarChart3, LineChart, ShieldCheck } from 'lucide-react';

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Data-Driven Insights',
    description:
      'Leverage cutting-edge AI analytics to make informed decisions about market trends and opportunities.',
  },
  {
    icon: ShieldCheck,
    title: 'Risk Management',
    description:
      'Mitigate risk through diversified exposure while participating in high-growth sectors.',
  },
  {
    icon: LineChart,
    title: 'Active Management',
    description:
      'Stay ahead with expertly rebalanced indexes that adapt to evolving market narratives.',
  },
] as const;

export function Features() {
  const renderFeatureCard = ({ icon: Icon, title, description }: (typeof FEATURES)[number]) => (
    <div className="bg-card rounded-xl p-6 text-center">
      <div className="bg-primary/10 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Baskt?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((feature) => (
            <React.Fragment key={feature.title}>{renderFeatureCard(feature)}</React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
