"use client";

import { Suspense } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useLanguage } from "@/app/components/LanguageProvider";

type Servicio = {
  nombre: string;
  trade: string;
  icono: string;
  descripcion: string;
  palabrasClave: string[];
};

function normalizarTexto(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function ServiciosContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();

  const buscar =
    searchParams.get("buscar") || "";

  const text =
    language === "es"
      ? {
          titulo: "Nuestros servicios",
          descripcion:
            "Encuentra profesionales para el servicio que necesitas.",
          verProfesionales:
            "Ver profesionales",
          noEncuentras:
            "¿No encuentras el servicio que necesitas?",
          noEncuentrasDescripcion:
            "Describe el trabajo y encuentra un profesional adecuado para ayudarte.",
          solicitarTrabajo:
            "Solicitar un trabajo",
          resultadoPara:
            "Resultado para",
          sinResultados:
            "No encontramos un servicio que coincida con tu búsqueda.",
          verTodos:
            "Ver todos los servicios",
        }
      : {
          titulo: "Our services",
          descripcion:
            "Find professionals for the service you need.",
          verProfesionales:
            "View professionals",
          noEncuentras:
            "Can’t find the service you need?",
          noEncuentrasDescripcion:
            "Describe the job and find the right professional to help you.",
          solicitarTrabajo:
            "Request a job",
          resultadoPara:
            "Result for",
          sinResultados:
            "We couldn't find a service matching your search.",
          verTodos:
            "View all services",
        };

  const servicios: Servicio[] =
    language === "es"
      ? [
          {
            nombre: "Plomería",
            trade: "plumbing",
            icono: "🔧",
            descripcion:
              "Fugas, tuberías, grifería, drenajes y reparaciones.",
            palabrasClave: [
              "plomeria",
              "plomero",
              "plomera",
              "plumbing",
              "plumber",
              "tuberia",
              "tuberias",
              "fuga",
              "fugas",
              "grifo",
              "griferia",
              "drenaje",
              "drenajes",
            ],
          },
          {
            nombre: "Electricidad",
            trade: "electrical",
            icono: "⚡",
            descripcion:
              "Instalaciones, reparaciones y problemas eléctricos.",
            palabrasClave: [
              "electricidad",
              "electricista",
              "electrico",
              "electrica",
              "electrical",
              "electrician",
              "electric",
              "cableado",
              "enchufe",
              "breaker",
            ],
          },
          {
            nombre: "Pintura",
            trade: "painting",
            icono: "🎨",
            descripcion:
              "Pintura interior, exterior y retoques.",
            palabrasClave: [
              "pintura",
              "pintor",
              "pintora",
              "painting",
              "painter",
              "paint",
              "pared",
              "paredes",
            ],
          },
          {
            nombre: "Jardinería",
            trade: "landscaping",
            icono: "🌿",
            descripcion:
              "Mantenimiento, limpieza y cuidado de exteriores.",
            palabrasClave: [
              "jardineria",
              "jardinero",
              "jardinera",
              "jardin",
              "landscaping",
              "landscaper",
              "garden",
              "yard",
              "cesped",
              "pasto",
            ],
          },
          {
            nombre: "Limpieza",
            trade: "cleaning",
            icono: "🧹",
            descripcion:
              "Limpieza residencial y otros servicios de limpieza.",
            palabrasClave: [
              "limpieza",
              "limpiador",
              "limpiadora",
              "cleaning",
              "cleaner",
              "clean",
              "casa",
              "house cleaning",
            ],
          },
          {
            nombre: "Aire acondicionado",
            trade: "hvac",
            icono: "❄️",
            descripcion:
              "HVAC, aire acondicionado, diagnóstico y mantenimiento.",
            palabrasClave: [
              "aire acondicionado",
              "aire",
              "ac",
              "a/c",
              "hvac",
              "climatizacion",
              "air conditioning",
              "air conditioner",
              "heating",
              "cooling",
            ],
          },
          {
            nombre: "Carpintería",
            trade: "carpentry",
            icono: "🪚",
            descripcion:
              "Reparaciones, instalaciones y trabajos de carpintería.",
            palabrasClave: [
              "carpinteria",
              "carpintero",
              "carpintera",
              "carpentry",
              "carpenter",
              "madera",
              "wood",
            ],
          },
          {
            nombre: "Mudanzas",
            trade: "moving",
            icono: "📦",
            descripcion:
              "Ayuda con mudanzas, carga y traslado.",
            palabrasClave: [
              "mudanza",
              "mudanzas",
              "mover",
              "moving",
              "mover",
              "movers",
              "traslado",
              "carga",
            ],
          },
        ]
      : [
          {
            nombre: "Plumbing",
            trade: "plumbing",
            icono: "🔧",
            descripcion:
              "Leaks, pipes, faucets, drains, and repairs.",
            palabrasClave: [
              "plumbing",
              "plumber",
              "plomeria",
              "plomero",
              "plomera",
              "pipe",
              "pipes",
              "leak",
              "leaks",
              "faucet",
              "drain",
            ],
          },
          {
            nombre: "Electrical",
            trade: "electrical",
            icono: "⚡",
            descripcion:
              "Installations, repairs, and electrical issues.",
            palabrasClave: [
              "electrical",
              "electrician",
              "electric",
              "electricidad",
              "electricista",
              "wiring",
              "outlet",
              "breaker",
            ],
          },
          {
            nombre: "Painting",
            trade: "painting",
            icono: "🎨",
            descripcion:
              "Interior painting, exterior painting, and touch-ups.",
            palabrasClave: [
              "painting",
              "painter",
              "paint",
              "pintura",
              "pintor",
              "pintora",
              "wall",
              "walls",
            ],
          },
          {
            nombre: "Landscaping",
            trade: "landscaping",
            icono: "🌿",
            descripcion:
              "Outdoor maintenance, cleanup, and landscaping care.",
            palabrasClave: [
              "landscaping",
              "landscaper",
              "garden",
              "gardener",
              "yard",
              "lawn",
              "jardineria",
              "jardinero",
              "jardinera",
              "cesped",
            ],
          },
          {
            nombre: "Cleaning",
            trade: "cleaning",
            icono: "🧹",
            descripcion:
              "Residential cleaning and other cleaning services.",
            palabrasClave: [
              "cleaning",
              "cleaner",
              "clean",
              "house cleaning",
              "limpieza",
              "limpiador",
              "limpiadora",
            ],
          },
          {
            nombre: "Air conditioning",
            trade: "hvac",
            icono: "❄️",
            descripcion:
              "HVAC, air conditioning, diagnostics, and maintenance.",
            palabrasClave: [
              "hvac",
              "air conditioning",
              "air conditioner",
              "ac",
              "a/c",
              "heating",
              "cooling",
              "aire acondicionado",
              "aire",
            ],
          },
          {
            nombre: "Carpentry",
            trade: "carpentry",
            icono: "🪚",
            descripcion:
              "Repairs, installations, and carpentry work.",
            palabrasClave: [
              "carpentry",
              "carpenter",
              "wood",
              "carpinteria",
              "carpintero",
              "carpintera",
              "madera",
            ],
          },
          {
            nombre: "Moving",
            trade: "moving",
            icono: "📦",
            descripcion:
              "Help with moving, loading, and transportation.",
            palabrasClave: [
              "moving",
              "mover",
              "movers",
              "move",
              "mudanza",
              "mudanzas",
              "traslado",
              "loading",
            ],
          },
        ];

  const busquedaNormalizada =
    normalizarTexto(buscar);

  const serviciosFiltrados =
    !busquedaNormalizada
      ? servicios
      : servicios.filter((servicio) => {
          const nombreNormalizado =
            normalizarTexto(servicio.nombre);

          const tradeNormalizado =
            normalizarTexto(servicio.trade);

          if (
            nombreNormalizado.includes(
              busquedaNormalizada
            ) ||
            busquedaNormalizada.includes(
              nombreNormalizado
            ) ||
            tradeNormalizado.includes(
              busquedaNormalizada
            )
          ) {
            return true;
          }

          return servicio.palabrasClave.some(
            (palabra) => {
              const palabraNormalizada =
                normalizarTexto(palabra);

              return (
                palabraNormalizada ===
                  busquedaNormalizada ||
                palabraNormalizada.includes(
                  busquedaNormalizada
                ) ||
                busquedaNormalizada.includes(
                  palabraNormalizada
                )
              );
            }
          );
        });

  function verProfesionales(trade: string) {
    router.push(
      `/profesionales?trade=${encodeURIComponent(
        trade
      )}`
    );
  }

  function verTodos() {
    router.push("/servicios");
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto max-w-7xl">

        {/* BOTÓN REGRESAR */}

        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-800 shadow-sm transition hover:border-blue-300 hover:text-blue-700 hover:shadow-md"
          aria-label={language === "es" ? "Regresar" : "Go back"}
        >
          <span aria-hidden="true" className="text-xl leading-none">←</span>
          {language === "es" ? "Regresar" : "Back"}
        </button>

        {/* HEADER */}

        <div className="text-center">
          <div className="text-3xl font-black text-blue-700">
            RELYDO
          </div>

          <h1 className="mt-3 text-4xl font-extrabold text-slate-900 md:text-5xl">
            {text.titulo}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            {text.descripcion}
          </p>

          {buscar && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-600">
                {text.resultadoPara}:{" "}
                <span className="font-extrabold text-blue-700">
                  “{buscar}”
                </span>
              </p>
            </div>
          )}
        </div>

        {/* SERVICIOS */}

        {serviciosFiltrados.length > 0 ? (
          <div
            className={`mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 ${
              serviciosFiltrados.length === 1
                ? "mx-auto max-w-md"
                : "lg:grid-cols-4"
            }`}
          >
            {serviciosFiltrados.map(
              (servicio) => (
                <button
                  key={servicio.trade}
                  type="button"
                  onClick={() =>
                    verProfesionales(
                      servicio.trade
                    )
                  }
                  className="group rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-md transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                    {servicio.icono}
                  </div>

                  <h2 className="mt-5 text-xl font-extrabold text-slate-900 group-hover:text-blue-700">
                    {servicio.nombre}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {servicio.descripcion}
                  </p>

                  <div className="mt-5 font-bold text-blue-700">
                    {text.verProfesionales} →
                  </div>
                </button>
              )
            )}
          </div>
        ) : (
          <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-md">
            <div className="text-4xl">
              🔎
            </div>

            <h2 className="mt-4 text-xl font-extrabold text-slate-900">
              {text.sinResultados}
            </h2>

            <button
              type="button"
              onClick={verTodos}
              className="mt-6 rounded-xl bg-blue-700 px-6 py-3 font-extrabold text-white transition hover:bg-blue-800"
            >
              {text.verTodos}
            </button>
          </div>
        )}

        {/* CTA */}

        <div className="mt-12 rounded-3xl bg-blue-700 p-8 text-center text-white md:p-10">
          <h2 className="text-2xl font-extrabold md:text-3xl">
            {text.noEncuentras}
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-blue-100">
            {text.noEncuentrasDescripcion}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/solicitar-trabajo")
            }
            className="mt-6 rounded-xl bg-white px-7 py-3.5 font-extrabold text-blue-700 transition hover:bg-blue-50"
          >
            {text.solicitarTrabajo}
          </button>
        </div>

      </div>
    </main>
  );
}

export default function Servicios() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 px-4 py-12">
          <div className="mx-auto max-w-7xl text-center">
            <div className="text-3xl font-black text-blue-700">
              RELYDO
            </div>
          </div>
        </main>
      }
    >
      <ServiciosContenido />
    </Suspense>
  );
}