"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
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

const UpdateProfileFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(200, { message: "Name must be 200 characters or fewer" }),
});

type UpdateProfileFormValues = z.infer<typeof UpdateProfileFormSchema>;

type Props = {
  user: {
    name: string;
    email: string;
  };
};

export function UpdateProfileForm({ user }: Props) {
  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(UpdateProfileFormSchema),
    defaultValues: {
      name: user.name,
    },
  });

  async function onSubmit(values: UpdateProfileFormValues) {
    try {
      await apiFetch("/api/v1/settings/profile", {
        method: "PATCH",
        body: { name: values.name },
      });
      toast.success("Profile updated");
    } catch (err) {
      if (err instanceof ApiError) {
        form.setError("root", { message: err.message });
      } else {
        form.setError("root", { message: "Something went wrong. Please try again." });
      }
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Account Information</h2>
        <p className="text-sm text-muted-foreground">Update your display name.</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Email</p>
        <p className="text-sm text-muted-foreground rounded-md border bg-muted/30 px-3 py-2">
          {user.email}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Your name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root && (
            <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
          )}

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
