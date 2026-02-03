import { promises as fs } from "node:fs";
import path from "node:path";

const BASE_DIR = path.resolve(process.cwd(), "src", "lib", "morphic-widgets");

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".md":
      return "text/markdown; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> },
) {
  const { file } = await context.params;
  const safeName = path.basename(file);
  const resolved = path.resolve(BASE_DIR, safeName);

  if (!resolved.startsWith(BASE_DIR + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const data = await fs.readFile(resolved);
    return new Response(data, {
      headers: {
        "content-type": contentTypeFor(resolved),
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
