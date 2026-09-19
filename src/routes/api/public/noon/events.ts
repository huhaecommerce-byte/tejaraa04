import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

const payloadSchema = z.object({
  message_id: z.string().min(1).max(300).optional(),
  event_type: z.string().min(1).max(200).optional(),
  type: z.string().min(1).max(200).optional(),
  project_code: z.string().min(1).max(200).optional(),
  project: z.string().min(1).max(200).optional(),
  order_nr: z.union([z.string(), z.number()]).optional(),
  order_reference: z.union([z.string(), z.number()]).optional(),
}).passthrough();

export const Route = createFileRoute("/api/public/noon/events")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        let parsed: z.infer<typeof payloadSchema>;
        try {
          parsed = payloadSchema.parse(JSON.parse(rawBody));
        } catch {
          return Response.json({ error: "Invalid event" }, { status: 400 });
        }
        const projectCode = parsed.project_code ?? parsed.project ?? request.headers.get("x-project") ?? "";
        const token = new URL(request.url).searchParams.get("token") ?? "";
        if (!projectCode || !token) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: connection } = await supabaseAdmin.from("noon_connections").select("id,user_id,webhook_secret_hash").eq("project_code", projectCode).eq("status", "healthy").maybeSingle();
        if (!connection?.webhook_secret_hash) return Response.json({ error: "Unauthorized" }, { status: 401 });
        const expected = Buffer.from(connection.webhook_secret_hash, "hex");
        const supplied = createHash("sha256").update(token).digest();
        if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return Response.json({ error: "Unauthorized" }, { status: 401 });

        const eventType = parsed.event_type ?? parsed.type ?? "FBPI::ORDER_SYNC";
        const orderReference = String(parsed.order_nr ?? parsed.order_reference ?? "");
        if (eventType !== "FBPI::ORDER_SYNC" || !orderReference) return Response.json({ accepted: true });
        const messageId = parsed.message_id ?? createHash("sha256").update(rawBody).digest("hex");
        const { data: event, error } = await supabaseAdmin.from("noon_webhook_events").upsert({ message_id: messageId, project_code: projectCode, event_type: eventType, order_reference: orderReference, connection_id: connection.id, raw_payload: parsed as Json }, { onConflict: "message_id", ignoreDuplicates: true }).select("id").maybeSingle();
        if (error) return Response.json({ error: "Event could not be accepted" }, { status: 500 });
        if (event) await supabaseAdmin.from("noon_sync_jobs").insert({ user_id: connection.user_id, connection_id: connection.id, job_type: "fetch_order", entity_type: "order", entity_id: orderReference, payload: { order_reference: orderReference, webhook_event_id: event.id } });
        return Response.json({ accepted: true });
      },
    },
  },
});