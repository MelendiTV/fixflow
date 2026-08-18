"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();

  const [busqueda, setBusqueda] =
    useState("");

  function buscarServicio() {
    const texto =
      busqueda.trim();

    if (!texto) {
      router.push("/servicios");
      return;
    }

    router.push(
      `/servicios?buscar=${encodeURIComponent(
        texto
      )}`
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">

      {/* HEADER */}

      <header className="bg-blue-600 p-5 text-white shadow-lg">

        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            className="text-3xl font-bold"
          >
            RELYDO
          </button>

          <nav className="flex items-center gap-6">

            <button
              type="button"
              onClick={() =>
                router.push("/")
              }
              className="hover:underline"
            >
              Inicio
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/servicios"
                )
              }
              className="hover:underline"
            >
              Servicios
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/profesionales"
                )
              }
              className="hover:underline"
            >
              Profesionales
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/#contacto"
                )
              }
              className="hover:underline"
            >
              Contacto
            </button>

          </nav>

        </div>

      </header>

      {/* PRINCIPAL */}

      <section className="px-4 py-24 text-center">

        <h1 className="text-5xl font-extrabold text-blue-600 md:text-6xl">
          Encuentra el profesional perfecto
        </h1>

        <p className="mt-6 text-xl text-gray-600 md:text-2xl">
          Plomeros • Electricistas • Pintores • Jardineros • Limpieza
        </p>

        <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-4 sm:flex-row">

          <input
            type="text"
            value={busqueda}
            onChange={(e) =>
              setBusqueda(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter"
              ) {
                buscarServicio();
              }
            }}
            placeholder="¿Qué servicio necesitas?"
            className="w-full rounded-xl border border-slate-300 bg-white p-4 text-lg text-slate-900 outline-none focus:border-blue-600"
          />

          <button
            type="button"
            onClick={
              buscarServicio
            }
            className="rounded-xl bg-blue-600 px-8 py-4 font-bold text-white hover:bg-blue-700"
          >
            Buscar
          </button>

        </div>

        {/* ACCIONES */}

        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">

          <button
            type="button"
            onClick={() =>
              router.push(
                "/solicitar-trabajo"
              )
            }
            className="rounded-xl bg-blue-700 px-6 py-4 font-extrabold text-white hover:bg-blue-800"
          >
            Solicitar un trabajo
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/mis-solicitudes"
              )
            }
            className="rounded-xl border-2 border-blue-700 bg-white px-6 py-4 font-extrabold text-blue-700 hover:bg-blue-50"
          >
            Mis solicitudes
          </button>

        </div>

      </section>

      {/* CONTACTO */}

      <section
        id="contacto"
        className="mx-auto max-w-5xl px-4 pb-20"
      >

        <div className="rounded-3xl bg-white p-8 text-center shadow-lg">

          <h2 className="text-3xl font-extrabold text-slate-900">
            ¿Necesitas ayuda?
          </h2>

          <p className="mt-3 text-slate-600">
            Encuentra profesionales verificados y solicita el servicio que necesitas.
          </p>

        </div>

      </section>

    </main>
  );
}
