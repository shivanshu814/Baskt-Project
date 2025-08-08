import { ArrowRight, CheckCircle } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Create Your Baskt',
    description:
      'Choose from 2+ assets with unlimited combinations. Design portfolios that match your investment strategy.',
    features: ['Minimum 2 assets', 'No maximum limit', 'Custom allocations'],
  },
  {
    step: '02',
    title: 'Deposit & Get BLP Tokens',
    description:
      'Deposit funds into our pool and receive BLP tokens for seamless trading on the platform.',
    features: ['Instant deposits', 'BLP token rewards', 'Liquidity access'],
  },
  {
    step: '03',
    title: 'Trade & Rebalance',
    description:
      'Trade existing baskets or your own creations. AI automatically rebalances to minimize losses.',
    features: ['AI-powered rebalancing', 'Loss minimization', 'Return optimization'],
  },
] as const;

export function HowItWorks() {
  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Get started in just three simple steps
        </p>
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 transform -translate-y-1/2 z-0"></div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {STEPS.map((step, index) => (
              <div key={step.step} className="relative">
                <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  {/* Step Number */}
                  <div className="absolute -top-4 left-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg">
                    {step.step}
                  </div>

                  {/* Content */}
                  <div className="mt-8">
                    <h3 className="text-2xl font-bold mb-4 text-center">{step.title}</h3>
                    <p className="text-muted-foreground mb-6 text-center leading-relaxed">
                      {step.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-3">
                      {step.features.map((feature) => (
                        <div
                          key={feature}
                          className="flex items-center gap-3 bg-muted/30 rounded-lg p-3"
                        >
                          <div className="bg-primary/20 rounded-full p-1">
                            <CheckCircle className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Arrow for next step */}
                  {index < STEPS.length - 1 && (
                    <div className="hidden lg:block absolute -right-4 top-1/2 transform -translate-y-1/2 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                      <ArrowRight className="mt-2 ml-2 h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
