import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { config } from "@src/config"
import { createSignedUploadUrl } from "@src/lib/signing"
import { z } from "zod"

export function registerRequestUploadTool(server: McpServer) {
  server.registerTool(
    "request_upload_url",
    {
      description: `Request a signed URL for uploading a file (image or PDF, max 10MB).
The returned URL is valid for 5 minutes. Upload the file with:
  curl -X POST -F file=@/path/to/file '<upload_url>'
The response JSON contains an upload_id. Then use attach_upload to link it to an entry.`,
      inputSchema: {
        filename: z
          .string()
          .optional()
          .describe("Original filename (for reference only, not required)"),
      },
    },
    async ({ filename }) => {
      const baseUrl = config.publicUrl
      if (!baseUrl) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Upload not available: PUBLIC_URL is not configured on the server.",
            },
          ],
          isError: true,
        }
      }

      const { url, expires_at } = createSignedUploadUrl(baseUrl)
      return {
        content: [
          {
            type: "text" as const,
            text: [
              `Upload URL (expires ${expires_at}):`,
              url,
              "",
              "Usage:",
              `  curl -X POST -F file=@${filename || "/path/to/file"} '${url}'`,
              "",
              "The response JSON will contain an upload_id.",
              "Then use attach_upload to link it to an entry.",
            ].join("\n"),
          },
        ],
      }
    }
  )
}
