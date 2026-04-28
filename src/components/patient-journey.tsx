"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type JourneyStep = 1 | 2 | 3 | 4 | 5 | 6;

interface PatientJourneyProps {
  currentStep: JourneyStep;
}

const steps = [
  { id: 1, label: "Registered" },
  { id: 2, label: "Checked In" },
  { id: 3, label: "In Consultation" },
  { id: 4, label: "Prescription Issued" },
  { id: 5, label: "Dispensed" },
  { id: 6, label: "Visit Closed" },
];

export function PatientJourney({ currentStep }: PatientJourneyProps) {
  return (
    <div className="w-full py-6">
      <h3 className="text-xs font-black text-gray-400 mb-10 uppercase tracking-widest text-center">Patient Journey Status</h3>
      <div className="flex items-center relative max-w-4xl mx-auto">
        {/* Continuous Connector Line Background */}
        <div className="absolute top-[20px] left-[10%] right-[10%] h-[2px] bg-gray-100 -z-0" />
        
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          
          return (
            <div key={step.id} className="flex-1 flex flex-col items-center relative z-10">
              {/* Step Circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 z-20",
                  isCompleted ? "bg-[#0d47a1] border-[#0d47a1] text-white" : 
                  isCurrent ? "bg-white border-[#0d47a1] text-[#0d47a1] ring-4 ring-blue-50 shadow-lg scale-110" : 
                  "bg-white border-gray-200 text-gray-300"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[3px]" />
                ) : (
                  <span className="text-sm font-black">{step.id}</span>
                )}
              </div>
              
              {/* Label */}
              <div className="absolute top-12 w-16 text-center">
                <span 
                  className={cn(
                    "text-[8px] font-black uppercase transition-colors duration-300 block leading-[1.1]",
                    isCurrent ? "text-[#0d47a1]" : isCompleted ? "text-gray-600" : "text-gray-300"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Active Connector Segment */}
              {index < steps.length - 1 && step.id < currentStep && (
                <div 
                  className="absolute left-1/2 top-[20px] w-full h-[2px] bg-[#0d47a1] -z-10"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
