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

export async function GET(request: Request) {
  if (!(await getSession()))
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const filter = new URL(request.url).searchParams.get("companyId");
  const companyId = filter === null ? undefined : Number(filter);
  if (
    companyId !== undefined &&
    (!Number.isSafeInteger(companyId) ||
      companyId < 1 ||
      companyId > 2147483647)
  )
    return NextResponse.json(
      { error: "Company ID must be a positive record ID." },
      { status: 400 },
    );
  try {
    if (dataSource() === "api") {
      const companies = [];
      for (let page = 1; ; page++) {
        const result = await subCompanyUpstream(
          `?page=${page}&pageSize=100${companyId ? `&companyId=${companyId}` : ""}`,
        );
        if (!result.ok)
          return NextResponse.json(
            { error: "The API could not load your subcompanies." },
            { status: result.status },
          );
        const batch = await result.json();
        companies.push(...batch);
        if (batch.length < 100) break;
        if (page >= 100)
          return NextResponse.json(
            { error: "This overview supports up to 10,000 subcompanies." },
            { status: 422 },
          );
      }
      return NextResponse.json(companies);
    }
    return NextResponse.json(
      (await demoSubCompanies()).filter(
        (item) => companyId === undefined || item.companyId === companyId,
      ),
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Unable to connect to your API. Check that the .NET service is running.",
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await getSession()))
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  let input;
  try {
    input = subCompanySchema.safeParse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Enter valid subcompany data." },
      { status: 400 },
    );
  }
  if (!input.success)
    return NextResponse.json(
      { error: input.error.issues[0].message },
      { status: 400 },
    );
  try {
    if (dataSource() === "api") {
      const result = await subCompanyUpstream("", {
        method: "POST",
        body: JSON.stringify(input.data),
      });
      return new Response(await result.text(), {
        status: result.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    return NextResponse.json(
      await demoSubCompanyWrite("create", undefined, input.data),
      {
        status: 201,
      },
    );
  } catch (error) {
    if (error instanceof MissingParentCompanyError)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(
      { error: "Unable to save the subcompany. Please try again." },
      { status: 503 },
    );
  }
}
