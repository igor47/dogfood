import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { getUpload, linkUploadToEntry, listUploadsForEntry } from "@src/db/uploads"
import { z } from "zod"

export function registerAttachUploadTool(server: McpServer) {
  server.registerTool(
    "attach_upload",
    {
      description:
        "Attach a previously uploaded file to an entry. First upload the file via POST /api/uploads to get an upload_id, then use this tool to link it to an entry. Use the entry_id and entry_type returned by the logging tools (log_meal, log_treat, log_bowel_movement, log_symptom, log_event).",
      inputSchema: {
        entry_type: z
          .enum(["food", "bowel", "symptom", "event"])
          .describe("The type of entry to attach to"),
        entry_id: z.string().describe("The ID of the entry (from the logging tool response)"),
        upload_id: z.string().describe("The ID of the upload (from POST /api/uploads response)"),
      },
      outputSchema: {
        entry_type: z.string(),
        entry_id: z.string(),
        upload_id: z.string(),
        total_attachments: z.number().describe("Total number of attachments on this entry"),
      },
    },
    async ({ entry_type, entry_id, upload_id }) => {
      const upload = getUpload(upload_id)
      if (!upload) {
        return {
          content: [{ type: "text" as const, text: `Upload not found: ${upload_id}` }],
          isError: true,
        }
      }

      linkUploadToEntry(entry_type, entry_id, upload_id)
      const uploads = listUploadsForEntry(entry_type, entry_id)

      return {
        content: [],
        structuredContent: {
          entry_type,
          entry_id,
          upload_id,
          total_attachments: uploads.length,
        },
      }
    }
  )
}
