import { NextResponse } from "next/server";
import { getSession, sameOrigin } from "@/lib/auth";
import {
  dataSource,
  demoProducts,
  demoWrite,
  productSchema,
  upstream,
} from "@/lib/products";

export async function GET() {
  if (!(await getSession()))
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  try {
    if (dataSource() === "api") {
      const products = [];
      for (let page = 1; ; page++) {
        const result = await upstream(`?page=${page}&pageSize=100`);
        if (!result.ok)
          return NextResponse.json(
            { error: "The API could not load your products." },
            { status: result.status },
          );
        const batch = await result.json();
        products.push(...batch);
        if (batch.length < 100) break;
        if (page >= 100)
          return NextResponse.json(
            { error: "This overview supports up to 10,000 products." },
            { status: 422 },
          );
      }
      return NextResponse.json(products);
    }
    return NextResponse.json(await demoProducts());
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
    input = productSchema.safeParse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Enter valid product data." },
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
      const result = await upstream("", {
        method: "POST",
        body: JSON.stringify(input.data),
      });
      return new Response(await result.text(), {
        status: result.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    return NextResponse.json(await demoWrite("create", undefined, input.data), {
      status: 201,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to save the product. Please try again." },
      { status: 503 },
    );
  }
}
