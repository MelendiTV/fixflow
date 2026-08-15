"use client";

import { useRouter } from "next/navigation";

type Servicio = {
  nombre: string;
  trade: string;
  icono: string;
  descripcion: string;
};

const servicios: Servicio[] = [
  {
    nombre: "Plomería",
    trade: "plumbing",
    icono: "🔧",
    descripcion:
      "Fugas, tuberías, grifería, drenajes y reparaciones.",
  },
  {
    nombre: "Electricidad",
    trade: "electrical",
    icono: "⚡",
    descripcion:
      "Instalaciones, reparaciones y problemas eléctricos.",
  },
  {
    nombre: "Pintura",
    trade: "painting",
    icono: "🎨",
    descripcion:
      "Pintura interior, exterior y retoques.",
  },
  {
    nombre: "Jardinería",
    trade: "landscaping",
    icono: "🌿",
    descripcion:
      "Mantenimiento, limpieza y cuidado de exteriores.",
  },
  {
    nombre: "Limpieza",
    trade: "cleaning",
    icono: "🧹",
    descripcion:
      "Limpieza residencial y otros servicios de limpieza.",
  },
  {
    nombre: "Aire acondicionado",
    trade: "hvac",
    icono: "❄️",
    descripcion:
      "HVAC, aire acondicionado, diagnóstico y mantenimiento.",
  },
  {
    nombre: "Carpintería",
    trade: "carpentry",
    icono: "🪚",
    descripcion:
      "Reparaciones, instalaciones y trabajos de carpintería.",
  },
  {
    nombre: "Mudanzas",
    trade: "moving",
    icono: "📦",
    descripcion:
      "Ayuda con mudanzas, carga y traslado.",
  },
];

export default function Servicios() {
  const router = useRouter();

  function verProfesionales(trade: string) {
    router.push(
      `/profesionales?trade=${encodeURIComponent(trade)}`
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="text-center">
          <div className="text-3xl font-black text-blue-700">
            FixFlow
          </div>

          <h1 className="mt-3 text-4xl font-extrabold text-slate-900 md:text-5xl">
            Nuestros servicios
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Encuentra profesionales para el servicio que necesitas.
          </p>
        </div>

        {/* SERVICIOS */}

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {servicios.map((servicio) => (
            <button
              key={servicio.trade}
              type="button"
              onClick={() =>
                verProfesionales(servicio.trade)
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
                Ver profesionales →
              </div>
            </button>
          ))}
        </div>

        {/* CTA */}

        <div className="mt-12 rounded-3xl bg-blue-700 p-8 text-center text-white md:p-10">
          <h2 className="text-2xl font-extrabold md:text-3xl">
            ¿No encuentras el servicio que necesitas?
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-blue-100">
            Describe el trabajo y encuentra un profesional adecuado para ayudarte.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/solicitar-trabajo")
            }
            className="mt-6 rounded-xl bg-white px-7 py-3.5 font-extrabold text-blue-700 transition hover:bg-blue-50"
          >
            Solicitar un trabajo
          </button>
        </div>

      </div>
    </main>
  );
}
