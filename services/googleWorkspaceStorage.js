(function () {
  function createGoogleWorkspaceStorage(config = {}) {
    const mode = config.mode || "test";
    const rootFolderId = config.rootFolderId || "";
    const sharedDriveId = config.sharedDriveId || "";
    const edgeFunctionUrl = config.edgeFunctionUrl || "";
    const anonKey = config.anonKey || "";

    function buildMetadata(file = {}, context = {}) {
      return {
        storage_provider: "google_drive",
        storage_mode: mode,
        drive_file_id: file.driveFileId || "",
        drive_folder_id: context.driveFolderId || rootFolderId,
        drive_shared_drive_id: sharedDriveId,
        drive_view_url: file.viewUrl || "",
        drive_download_url: file.downloadUrl || "",
        original_filename: file.name || file.originalFilename || "",
        mime_type: file.type || file.mimeType || "",
        file_size: file.size || 0,
        sensitivity: context.sensitivity || "private",
        sharing_mode: context.sharingMode || "private",
      };
    }

    async function upload(file, context = {}) {
      if (mode === "production") {
        if (!edgeFunctionUrl || !anonKey) {
          return {
            ok: false,
            testMode: false,
            metadata: buildMetadata(file, context),
            message: "Google Drive em produção exige edgeFunctionUrl e anonKey.",
          };
        }

        const form = new FormData();
        form.append("file", file);
        form.append("context", JSON.stringify(context));

        const response = await fetch(edgeFunctionUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${anonKey}`,
            apikey: anonKey,
          },
          body: form,
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
          return {
            ok: false,
            testMode: false,
            metadata: buildMetadata(file, context),
            message: result.error || result.message || "Falha ao enviar arquivo para o Google Drive.",
          };
        }
        return {
          ok: true,
          testMode: false,
          metadata: buildMetadata({
            name: file.name,
            type: file.type,
            size: file.size,
            driveFileId: result.file?.id || "",
            viewUrl: result.file?.webViewLink || "",
            downloadUrl: result.file?.webContentLink || "",
          }, {
            ...context,
            driveFolderId: result.file?.folderId || context.driveFolderId || rootFolderId,
          }),
          message: "Arquivo enviado para o Google Drive.",
        };
      }

      return {
        ok: true,
        testMode: mode !== "production",
        metadata: buildMetadata(file, context),
        message: "Google Workspace preparado em modo teste. Nenhum arquivo foi enviado.",
      };
    }

    return {
      provider: "google_drive",
      mode,
      isProduction: mode === "production",
      buildMetadata,
      upload,
      requiredEnv: [
        "GOOGLE_PROJECT_ID",
        "GOOGLE_CLIENT_EMAIL",
        "GOOGLE_PRIVATE_KEY",
        "GOOGLE_DRIVE_SHARED_DRIVE_ID",
        "GOOGLE_DRIVE_ROOT_FOLDER_ID",
        "GOOGLE_WORKSPACE_DOMAIN",
        "GOOGLE_IMPERSONATE_EMAIL",
      ],
    };
  }

  window.createGoogleWorkspaceStorage = createGoogleWorkspaceStorage;
})();
