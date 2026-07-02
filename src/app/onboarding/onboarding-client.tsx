"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FarmForm } from "@/features/farms/components/farm-form";
import type { Farm } from "@/features/farms/schema";
import { apiFetch } from "@/lib/api/client";

const NameSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
});
type NameInput = z.infer<typeof NameSchema>;

const FARM_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function writeSelectedFarmCookie(farmId: string) {
  document.cookie = `selected_farm_id=${farmId};path=/;max-age=${FARM_COOKIE_MAX_AGE};SameSite=Lax`;
}

function NameStep({ initialName, onNext }: { initialName: string; onNext: () => void }) {
  const form = useForm<NameInput>({
    resolver: zodResolver(NameSchema),
    defaultValues: { name: initialName },
  });

  async function onSubmit(values: NameInput) {
    try {
      await apiFetch("/api/v1/settings/profile", {
        method: "PATCH",
        body: { name: values.name },
      });
      onNext();
    } catch {
      toast.error("Failed to save name. Please try again.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">What&apos;s your name?</h2>
        <p className="text-sm text-muted-foreground">
          This is how you&apos;ll appear to your team.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Full name" autoFocus />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Continue"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

function FarmStep({ onDone, onBack }: { onDone: (farm?: Farm) => void; onBack: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Set up your farm</h2>
          <p className="text-sm text-muted-foreground">
            Create your first farm, pin its location, and draw the farm boundary if you have it.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <FarmForm onSuccess={onDone} layout="split" />
    </div>
  );
}

export function OnboardingClient({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(initialName.trim() ? 2 : 1);
  const isWideStep = step === 2;

  function handleFarmCreated(farm?: Farm) {
    if (farm?.id) writeSelectedFarmCookie(farm.id);
    toast.success("Farm created. Welcome to Crop Management.");
    router.refresh();
    router.replace("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Crop Management</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Step {step} of 2</span>
            <div className="flex gap-1.5">
              {[1, 2].map((currentStep) => (
                <div
                  key={currentStep}
                  className={`h-1.5 w-6 rounded-full ${currentStep <= step ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <main
        className={`flex flex-1 ${
          isWideStep
            ? "items-start justify-center px-6 py-8 lg:px-10"
            : "items-center justify-center px-6 py-12"
        }`}
      >
        <div
          className={
            isWideStep
              ? "w-full max-w-7xl space-y-8"
              : "w-full max-w-md rounded-lg border bg-card p-8 shadow-sm"
          }
        >
          {step === 1 ? (
            <NameStep initialName={initialName} onNext={() => setStep(2)} />
          ) : (
            <FarmStep onDone={handleFarmCreated} onBack={() => setStep(1)} />
          )}
        </div>
      </main>
    </div>
  );
}
