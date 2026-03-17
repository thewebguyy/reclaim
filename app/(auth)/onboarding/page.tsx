"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Industry } from "@prisma/client";
import { ShieldCheck, Zap, Briefcase, Phone, CreditCard, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, title: "Branding", icon: Briefcase },
  { id: 2, title: "Follow-Up", icon: Zap },
  { id: 3, title: "Integration", icon: ShieldCheck },
  { id: 4, title: "Communcation", icon: Phone },
  { id: 5, title: "Billing", icon: CreditCard },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: "",
    industry: "hvac" as Industry,
    followUpHours: 2,
    jobberKey: "",
  });

  const next = () => setCurrentStep(s => Math.min(s + 1, steps.length));
  const back = () => setCurrentStep(s => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between mb-8 px-4">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div 
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                  currentStep >= step.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <step.icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider">{step.title}</span>
            </div>
          ))}
        </div>

        <Card className="shadow-lg">
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle>Welcome to Reclaim</CardTitle>
                <CardDescription>Let's start with your business basics.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Name</label>
                  <Input 
                    placeholder="e.g. Acme HVAC" 
                    value={formData.businessName}
                    onChange={e => setFormData({...formData, businessName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Industry</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.industry}
                    onChange={e => setFormData({...formData, industry: e.target.value as Industry})}
                  >
                    <option value="hvac">HVAC</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                    <option value="landscaping">Landscaping</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 2 && (
            <>
              <CardHeader>
                <CardTitle>Follow-Up Strategy</CardTitle>
                <CardDescription>When should we start following up after a quote is sent?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First follow-up (hours after send)</label>
                  <Input 
                    type="number" 
                    value={formData.followUpHours}
                    onChange={e => setFormData({...formData, followUpHours: parseInt(e.target.value)})}
                  />
                  <p className="text-xs text-muted-foreground">We recommend 2-4 hours for maximum conversion.</p>
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 3 && (
            <>
              <CardHeader>
                <CardTitle>Connect your CRM</CardTitle>
                <CardDescription>We'll automatically pull in your quotes and customers.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full py-8 text-lg" onClick={next}>
                  <img src="/jobber-logo.png" className="h-6 mr-3" alt="Jobber" />
                  Connect Jobber
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or use HCP</span></div>
                </div>
                <Button variant="outline" className="w-full py-8 text-lg" onClick={next}>
                  Connect Housecall Pro
                </Button>
              </CardContent>
            </>
          )}

          {currentStep === 4 && (
            <>
              <CardHeader>
                <CardTitle>Your Communication Hub</CardTitle>
                <CardDescription>We're provisioning your dedicated local Twilio number.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 flex flex-col items-center">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <Phone className="h-10 w-10 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-xl">Creating your number...</p>
                  <p className="text-sm text-muted-foreground">This number will be yours forever.</p>
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 5 && (
            <>
              <CardHeader>
                <CardTitle>Select a Plan</CardTitle>
                <CardDescription>Choose the growth path for your business.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
                  <h3 className="font-bold">Starter</h3>
                  <p className="text-2xl font-bold">$49<span className="text-sm font-normal">/mo</span></p>
                  <ul className="text-xs mt-4 space-y-1 text-muted-foreground">
                    <li>• Up to 50 quotes/mo</li>
                    <li>• Basic SMS follow-ups</li>
                  </ul>
                </div>
                <div className="border-2 border-primary rounded-lg p-4 cursor-pointer relative">
                  <Badge className="absolute -top-2 right-4">Popular</Badge>
                  <h3 className="font-bold">Growth</h3>
                  <p className="text-2xl font-bold">$149<span className="text-sm font-normal">/mo</span></p>
                  <ul className="text-xs mt-4 space-y-1 text-muted-foreground">
                    <li>• Unlimited quotes</li>
                    <li>• AI Personalised messages</li>
                    <li>• Multi-step sequences</li>
                  </ul>
                </div>
              </CardContent>
            </>
          )}

          <div className="p-6 border-t flex justify-between bg-muted/5">
            <Button 
              variant="ghost" 
              onClick={back} 
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={next}>
              {currentStep === steps.length ? "Launch Dashboard" : "Next"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
