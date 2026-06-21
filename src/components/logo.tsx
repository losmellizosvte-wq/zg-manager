import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center font-bold text-lg", className)}>
      <div className="bg-primary text-primary-foreground rounded-md p-2 flex items-center justify-center aspect-square">
        ZG
      </div>
    </div>
  );
}

export function FullLogo({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Logo />
            <div className="flex flex-col">
                <span className="font-bold text-primary tracking-wide leading-tight">ZAWADZKI</span>
                <span className="font-semibold text-sm text-muted-foreground leading-tight">GROUP</span>
            </div>
        </div>
    )
}
