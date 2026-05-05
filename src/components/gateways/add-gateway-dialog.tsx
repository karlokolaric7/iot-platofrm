"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAddGateway } from "@/hooks/use-iot-data";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  type: z.string().min(1, "Please select a gateway type"),
  eui: z.string().optional(),
  description: z.string().optional(),
});

interface AddGatewayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddGatewayDialog({ open, onOpenChange }: AddGatewayDialogProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const addGateway = useAddGateway();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "lorawan",
      eui: "",
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);
      await addGateway.mutateAsync({
        workspace_id: workspaceId,
        name: values.name,
        type: values.type,
        eui: values.eui || null,
        description: values.description || null,
        status: "unknown",
        settings: {},
      } as any);
      toast.success("Gateway added successfully");
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Gateway Add Error:", error.message, error.details, error.hint, error);
      toast.error(`Failed to add gateway: ${error.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Gateway</DialogTitle>
          <DialogDescription>
            Register a new gateway to connect your devices to the platform.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Gateway Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Factory North Gateway" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gateway type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="lorawan">LoRaWAN</SelectItem>
                      <SelectItem value="mqtt">MQTT Broker</SelectItem>
                      <SelectItem value="ttn">The Things Network</SelectItem>
                      <SelectItem value="custom">Custom Implementation</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Located on the roof of Building A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="eui"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Gateway EUI (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. AA0B0C0D0E0F0001" {...field} />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for LoRaWAN gateways.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Gateway
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
