'use client';

import * as React from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export type PropuestaStatus = 'Confirmada' | 'Facturada' | 'Pago Enviado' | 'Picking' | 'En Viaje' | 'Recibida';

const PIPELINE_STEPS: PropuestaStatus[] = [
  'Confirmada',
  'Facturada',
  'Pago Enviado',
  'Picking',
  'En Viaje',
  'Recibida'
];

interface PropuestaTimelineProps {
  currentStatus: string;
  history?: { status: string; date: string; user?: string }[];
}

export function PropuestaTimeline({ currentStatus, history = [] }: PropuestaTimelineProps) {
  const currentIndex = PIPELINE_STEPS.indexOf(currentStatus as PropuestaStatus);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex; // Fallback to Confirmada

  return (
    <div className="py-2">
      <div className="flex justify-between items-center relative">
        {/* Background line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0"></div>
        
        {/* Active line */}
        <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full z-0 transition-all duration-500 ease-in-out"
            style={{ width: `${(activeIndex / (PIPELINE_STEPS.length - 1)) * 100}%` }}
        ></div>

        {PIPELINE_STEPS.map((step, index) => {
          const isCompleted = index <= activeIndex;
          const isCurrent = index === activeIndex;
          const historyEntry = history.find(h => h.status === step);

          return (
            <div key={step} className="relative z-10 flex flex-col items-center group">
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 transition-colors duration-300
                  ${isCompleted ? 'border-blue-500 text-blue-500' : 'border-slate-200 text-slate-300'}
                  ${isCurrent ? 'ring-4 ring-blue-100' : ''}
                `}
                title={historyEntry ? `Actualizado el ${format(new Date(historyEntry.date), "dd/MM 'a las' HH:mm")} por ${historyEntry.user}` : step}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              </div>
              
              <div className="absolute -bottom-6 text-[9px] font-medium whitespace-nowrap opacity-70">
                <span className={isCompleted ? 'text-blue-700' : 'text-slate-400'}>
                    {step}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
