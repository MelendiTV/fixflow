import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return NextResponse.json(
        {
          error: "Email is required.",
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const emailValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!emailValido) {
      return NextResponse.json(
        {
          error: "Invalid email.",
        },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    /*
      IMPORTANTE:
      Esta búsqueda ocurre solamente en el servidor.

      SUPABASE_SECRET_KEY jamás debe utilizarse
      dentro de un componente con "use client".
    */

    const perPage = 1000;
    let page = 1;
    let encontrado = false;

    while (true) {
      const {
        data,
        error,
      } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        console.error(
          "Error comprobando email:",
          error
        );

        return NextResponse.json(
          {
            error:
              "Unable to verify the email.",
          },
          {
            status: 500,
            headers: {
              "Cache-Control": "no-store",
            },
          }
        );
      }

      encontrado = data.users.some(
        (user) =>
          user.email?.trim().toLowerCase() ===
          email
      );

      if (encontrado) {
        break;
      }

      if (data.users.length < perPage) {
        break;
      }

      page += 1;
    }

    return NextResponse.json(
      {
        exists: encontrado,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Error inesperado comprobando email:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to verify the email.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}