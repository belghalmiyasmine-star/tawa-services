"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Bell, Send, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { sendSystemNotificationAction } from "../actions/system-notification-actions";
import type { SystemNotificationHistoryItem } from "../actions/system-notification-actions";

// ============================================================
// SCHEMA
// ============================================================

const formSchema = z.object({
  segment: z.enum(["all", "clients", "providers"]),
  title: z.string().min(5, "Le titre doit contenir au moins 5 caracteres").max(200),
  body: z.string().min(10, "Le message doit contenir au moins 10 caracteres").max(2000),
});

type FormValues = z.infer<typeof formSchema>;

// ============================================================
// TYPES
// ============================================================

interface SystemNotificationFormProps {
  history: SystemNotificationHistoryItem[];
}

// ============================================================
// HELPERS
// ============================================================

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-TN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

// ============================================================
// COMPONENT
// ============================================================

export function SystemNotificationForm({ history }: SystemNotificationFormProps) {
  const t = useTranslations("admin.notifications");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyItems, setHistoryItems] = useState<SystemNotificationHistoryItem[]>(history);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      segment: "all",
      title: "",
      body: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const result = await sendSystemNotificationAction(values);

      if (result.success) {
        toast({
          title: t("sent_success"),
          description: `${result.data.sentCount} notification${result.data.sentCount > 1 ? "s" : ""} envoyee${result.data.sentCount > 1 ? "s" : ""}`,
        });

        // Add to local history
        const newEntry: SystemNotificationHistoryItem = {
          title: values.title,
          body: values.body,
          sentCount: result.data.sentCount,
          sentAt: new Date(),
        };
        setHistoryItems((prev) => [newEntry, ...prev]);

        // Reset form
        form.reset();
      } else {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Send form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {t("sendNotification")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Segment */}
              <FormField
                control={form.control}
                name="segment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("targetSegment")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">
                          <span className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {t("allUsers")}
                          </span>
                        </SelectItem>
                        <SelectItem value="clients">{t("allClients")}</SelectItem>
                        <SelectItem value="providers">{t("allProviders")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("notificationTitle")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Nouvelle fonctionnalite disponible"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Body */}
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("notificationBody")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Contenu de la notification..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                <Bell className="mr-2 h-4 w-4" />
                {isSubmitting ? "Envoi en cours..." : t("send")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>{t("history")}</CardTitle>
        </CardHeader>
        <CardContent>
          {historyItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune notification systeme envoyee
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead className="hidden sm:table-cell">Message</TableHead>
                  <TableHead>Destinataires</TableHead>
                  <TableHead className="hidden md:table-cell">Date d&apos;envoi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell className="hidden max-w-[300px] truncate sm:table-cell">
                      <span className="text-muted-foreground">{item.body}</span>
                    </TableCell>
                    <TableCell>
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-sm font-medium text-primary">
                        {item.sentCount}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {formatDate(item.sentAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
