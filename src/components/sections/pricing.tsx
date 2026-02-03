import React from 'react';
import { Check, Zap, Sparkles, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const PricingSection = () => {
  const plans = [
    {
      name: "Free",
      description: "Perfect for getting started",
      price: "0",
      features: [
        "5 AI Image generations/day",
        "Basic text tools",
        "Code formatter",
        "URL shortener",
        "Temp email",
        "Community support"
      ],
      buttonText: "Get Started",
      highlight: false,
      icon: Zap,
    },
    {
      name: "Pro",
      description: "For power users and creators",
      price: "5",
      features: [
        "Unlimited AI generations",
        "All AI tools access",
        "Priority processing",
        "Advanced video tools",
        "API access",
        "Priority support"
      ],
      buttonText: "Start Pro Trial",
      highlight: true,
      badge: "Most Popular",
      icon: Sparkles,
    },
    {
      name: "Enterprise",
      description: "For teams and businesses",
      price: "10",
      features: [
        "Everything in Pro",
        "Unlimited team members",
        "Custom integrations",
        "Dedicated support",
        "SLA guarantee",
        "Custom AI training"
      ],
      buttonText: "Contact Sales",
      highlight: false,
      icon: Crown,
    }
  ];

  return (
    <section id="pricing" className="relative py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-foreground/80">Pricing</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Simple, Transparent
            <span className="block mt-1 bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          
          <p className="max-w-xl mx-auto text-lg text-muted-foreground">
            Choose the plan that fits your needs. All plans include core features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative flex flex-col p-6 rounded-xl transition-all duration-300 ${
                plan.highlight 
                  ? 'bg-card border-2 border-primary/30 shadow-xl scale-[1.02] z-10' 
                  : 'bg-card border border-border/50'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-xs font-semibold text-primary-foreground whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-4 ${
                  plan.highlight ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <plan.icon className={`w-5 h-5 ${plan.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <ul className="flex-grow space-y-3 mb-6">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <div className={`p-0.5 rounded-full ${plan.highlight ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Check className="w-3 h-3" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href={plan.highlight ? "/dashboard" : "#"}>
                <Button 
                  variant={plan.highlight ? "default" : "outline"}
                  className="w-full"
                >
                  {plan.buttonText}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Need a custom plan?{' '}
            <a href="#" className="text-primary hover:underline">
              Talk to our experts.
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
