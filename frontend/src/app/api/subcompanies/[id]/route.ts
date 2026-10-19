import { NextResponse } from "next/server";
import { getSession, sameOrigin } from "@/lib/auth";
import {
  dataSource,
  MissingParentCompanyError,
  demoSubCompanies,
  demoSubCompanyWrite,
  subCompanySchema,
  subCompanyUpstream,
} from "@/lib/subcompanies";

type Context = { params: Promise<{ id: string }> };
async function change(
  request: Request,
  context: Context,
  method: "PUT" | "DELETE",
) {
  if (!(await getSession()))
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  const id = Number((await context.params).id);
  if (!Number.isSafeInteger(id) || id <= 0)
    return NextResponse.json(
      { error: "Subcompany not found." },
      { status: 404 },
    );
  let input;
  if (method === "PUT") {
    try {
      const parsed = subCompanySchema.safeParse(await request.json());
      if (!parsed.success)
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 },
        );
      input = parsed.data;
    } catch {
      return NextResponse.json(
        { error: "Enter valid subcompany data." },
        { status: 400 },
      );
    }
  }
  try {
    if (dataSource() === "api") {
      const response = await subCompanyUpstream(`/${id}`, {
        method,
        ...(input && { body: JSON.stringify(input) }),
      });
      if (response.status === 204) return new Response(null, { status: 204 });
      return new Response(await response.text(), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    const result = await demoSubCompanyWrite(
      method === "PUT" ? "update" : "delete",
      id,
      input,
    );
    return result
      ? new Response(null, { status: 204 })
      : NextResponse.json({ error: "Subcompany not found." }, { status: 404 });
  } catch (error) {
    if (error instanceof MissingParentCompanyError)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(
      { error: "The change could not be saved. Please try again." },
      { status: 503 },
    );
  }
}
export const PUT = (request: Request, context: Context) =>
  change(request, context, "PUT");
export const DELETE = (request: Request, context: Context) =>
  change(request, context, "DELETE");

export async function GET(_request: Request, context: Context) {
  if (!(await getSession()))
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const id = Number((await context.params).id);
  if (!Number.isSafeInteger(id) || id <= 0)
    return NextResponse.json(
      { error: "Subcompany not found." },
      { status: 404 },
    );
  try {
    if (dataSource() === "api") {
      const result = await subCompanyUpstream(`/${id}`);
      return new Response(await result.text(), {
        status: result.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    const company = (await demoSubCompanies()).find((item) => item.id === id);
    return company
      ? NextResponse.json(company)
      : NextResponse.json({ error: "Subcompany not found." }, { status: 404 });
  } catch {
    return NextResponse.json(
      { error: "Unable to load the company." },
      { status: 503 },
    );
  }
}
