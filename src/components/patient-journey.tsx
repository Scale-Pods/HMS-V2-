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
      <h3 className="text-sm font-bold text-gray-500 mb-8 uppercase tracking-wider">Patient Journey</h3>
      <div className="flex items-center justify-between relative max-w-4xl mx-auto px-4">
        {/* Connector Line Background */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-100 -translate-y-1/2 -z-10" />
        
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          
          return (
            <div key={step.id} className="flex flex-col items-center relative z-10 group">
              {/* Step Circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2",
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
              <div className="absolute -bottom-8 w-max">
                <span 
                  className={cn(
                    "text-[10px] font-bold uppercase transition-colors duration-300",
                    isCurrent ? "text-[#0d47a1]" : isCompleted ? "text-gray-600" : "text-gray-300"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector between circles (the blue segments) */}
              {index < steps.length - 1 && (
                <div 
                  className={cn(
                    "absolute left-[calc(100%+8px)] top-1/2 w-[calc(100%-8px)] h-[3px] -translate-y-1/2 transition-all duration-700",
                    step.id < currentStep ? "bg-[#0d47a1]" : "bg-transparent"
                  )} 
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
