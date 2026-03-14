import type { NextRequest } from "next/server";
import { handleApiRoute } from "@/lib/api/router";

type Params = {
  path?: string[];
};

type Context = {
  params: Promise<Params>;
};

async function getSegments(context: Context) {
  const resolved = await context.params;
  return resolved.path ?? [];
}

export async function GET(request: NextRequest, context: Context) {
  return handleApiRoute(request, await getSegments(context), "GET");
}

export async function POST(request: NextRequest, context: Context) {
  return handleApiRoute(request, await getSegments(context), "POST");
}

export async function PUT(request: NextRequest, context: Context) {
  return handleApiRoute(request, await getSegments(context), "PUT");
}

export async function DELETE(request: NextRequest, context: Context) {
  return handleApiRoute(request, await getSegments(context), "DELETE");
}

export async function PATCH(request: NextRequest, context: Context) {
  return handleApiRoute(request, await getSegments(context), "PATCH");
}
