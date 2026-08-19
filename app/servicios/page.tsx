"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/components/LanguageProvider";

type Servicio = {
  nombre: string;
  trade: string;
  icono: string;
  descripcion: string;
};

export default function Servicios() {
  const router = useRouter();
  const { language } = useLanguage();

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
        ]
      : [
          {
            nombre: "Plumbing",
            trade: "plumbing",
            icono: "🔧",
            descripcion:
              "Leaks, pipes, faucets, drains, and repairs.",
          },
          {
            nombre: "Electrical",
            trade: "electrical",
            icono: "⚡",
            descripcion:
              "Installations, repairs, and electrical issues.",
          },
          {
            nombre: "Painting",
            trade: "painting",
            icono: "🎨",
            descripcion:
              "Interior painting, exterior painting, and touch-ups.",
          },
          {
            nombre: "Landscaping",
            trade: "landscaping",
            icono: "🌿",
            descripcion:
              "Outdoor maintenance, cleanup, and landscaping care.",
          },
          {
            nombre: "Cleaning",
            trade: "cleaning",
            icono: "🧹",
            descripcion:
              "Residential cleaning and other cleaning services.",
          },
          {
            nombre: "Air conditioning",
            trade: "hvac",
            icono: "❄️",
            descripcion:
              "HVAC, air conditioning, diagnostics, and maintenance.",
          },
          {
            nombre: "Carpentry",
            trade: "carpentry",
            icono: "🪚",
            descripcion:
              "Repairs, installations, and carpentry work.",
          },
          {
            nombre: "Moving",
            trade: "moving",
            icono: "📦",
            descripcion:
              "Help with moving, loading, and transportation.",
          },
        ];

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
            RELYDO
          </div>

          <h1 className="mt-3 text-4xl font-extrabold text-slate-900 md:text-5xl">
            {text.titulo}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            {text.descripcion}
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
                {text.verProfesionales} →
              </div>
            </button>
          ))}
        </div>

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