(function () {
  function normalizeArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function defaultStatus(templateKey, status) {
    if (status) return status;
    return "pending";
  }

  function createEmailQueue(supabaseClient) {
    async function queueEmail(input) {
      if (!supabaseClient) {
        return { ok: false, message: "Supabase indisponível" };
      }

      const row = {
        app_name: input.appName || "recursos_humanos",
        module_name: input.moduleName || null,
        event_type: input.eventType,
        related_table: input.relatedTable || null,
        related_record_id: input.relatedRecordId ? String(input.relatedRecordId) : null,
        employee_id: input.employeeId ? String(input.employeeId) : null,
        employee_name: input.employeeName || null,
        manager_id: input.managerId ? String(input.managerId) : null,
        manager_name: input.managerName || null,
        recipient_email: input.recipientEmail,
        recipient_name: input.recipientName || null,
        recipient_type: input.recipientType || "interno",
        cc: normalizeArray(input.cc),
        bcc: normalizeArray(input.bcc),
        subject: input.subject || null,
        template_key: input.templateKey,
        payload: input.payload || {},
        status: defaultStatus(input.templateKey, input.status),
        created_by: input.createdBy || null,
        scheduled_for: input.scheduledFor || new Date().toISOString(),
      };

      const { data, error } = await supabaseClient.from("email_events").insert(row).select("id,status").single();
      if (error) return { ok: false, message: error.message };
      return { ok: true, id: data.id, status: data.status };
    }

    return { queueEmail };
  }

  window.createEmailQueue = createEmailQueue;
})();
