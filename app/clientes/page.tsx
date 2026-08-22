"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/app/components/LanguageProvider";

const LOGO_SRC = "/relydo-logo.png";

function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <img
        src={LOGO_SRC}
        alt="RELYDO"
        className="h-10 w-auto object-contain sm:h-11"
        onError={(event) => {
          event.currentTarget.style.display = "none";

          const fallback =
            event.currentTarget.nextElementSibling as HTMLElement | null;

          if (fallback) {
            fallback.style.display = "inline";
          }
        }}
      />

      <span
        style={{ display: "none" }}
        className="text-2xl font-black tracking-[0.06em] text-slate-950"
      >
        RELY<span className="text-blue-600">DO</span>
      </span>
    </div>
  );
}

export default function ClientesHome() {
  const router = useRouter();
  const { language } = useLanguage();

  const [busqueda, setBusqueda] = useState("");

  const es = language === "es";

  const text = es
    ? {
        pros: "Para profesionales",
        signIn: "Iniciar sesión",
        signUp: "Crear cuenta",

        badge: "RELYDO PARA CLIENTES",

        title1: "Encuentra profesionales",
        title2: "de confianza, sin complicaciones.",

        subtitle:
          "Publica lo que necesitas, recibe presupuestos y mantén el trabajo, el pago y la comunicación organizados en un solo lugar.",

        request: "Solicitar un trabajo",
        requests: "Mis solicitudes",

        placeholder: "¿Qué servicio necesitas?",
        search: "Buscar",

        howTitle:
          "Contratar ayuda no debería ser complicado",

        p1: "Crea tu solicitud",
        p1d:
          "Describe el trabajo, agrega fotos, ubicación y preferencias.",

        p2: "Compara presupuestos",
        p2d:
          "Revisa propuestas y elige al profesional que mejor encaje.",

        p3: "Sigue el trabajo",
        p3d:
          "Mantente al tanto desde que va en camino hasta que termina.",

        p4: "Paga con más confianza",
        p4d:
          "Mantén pagos, evidencias y reclamos vinculados al trabajo.",

        cta: "¿Listo para empezar?",
        ctaSub:
          "Crea tu solicitud y deja que RELYDO te ayude a encontrar la opción correcta.",
      }
    : {
        pros: "For Professionals",
        signIn: "Sign in",
        signUp: "Create account",

        badge: "RELYDO FOR CUSTOMERS",

        title1: "Find professionals",
        title2: "you can trust, without the hassle.",

        subtitle:
          "Post what you need, receive quotes and keep the job, payment and communication organized in one place.",

        request: "Request a job",
        requests: "My requests",

        placeholder: "What service do you need?",
        search: "Search",

        howTitle:
          "Hiring help shouldn't be complicated",

        p1: "Create your request",
        p1d:
          "Describe the job, add photos, location and preferences.",

        p2: "Compare quotes",
        p2d:
          "Review proposals and choose the professional who fits best.",

        p3: "Track the job",
        p3d:
          "Stay informed from on-the-way through completion.",

        p4: "Pay with more confidence",
        p4d:
          "Keep payments, evidence and claims connected to the job.",

        cta: "Ready to get started?",
        ctaSub:
          "Create your request and let RELYDO help you find the right fit.",
      };

  const adsEspanol = [
    "/ads/4b37dfc4-7eb9-4b5f-8bb5-40eb6a974310.png",
    "/ads/4daa86f7-42c8-43f5-b5bd-4c6342dfb0dd.png",
    "/ads/9018c8ec-b41a-4d2c-882a-cac2bd5c0fbe.png",
    "/ads/24409dde-116e-49cc-a962-70f4ca6595df.png",
  ];

  const adsIngles = [
    "/ads/ads-10.png",
    "/ads/ads-11.png",
    "/ads/ads-15.png",
    "/ads/ads-16.png",
  ];

  const ads = es
    ? adsEspanol
    : adsIngles;

  function buscarServicio() {
    const texto =
      busqueda.trim();

    if (!texto) {
      router.push(
        "/servicios"
      );

      return;
    }

    router.push(
      `/servicios?buscar=${encodeURIComponent(
        texto
      )}`
    );
  }

  const pasos = [
    {
      number: "01",
      title: text.p1,
      description: text.p1d,
    },
    {
      number: "02",
      title: text.p2,
      description: text.p2d,
    },
    {
      number: "03",
      title: text.p3,
      description: text.p3d,
    },
    {
      number: "04",
      title: text.p4,
      description: text.p4d,
    },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            aria-label="RELYDO Home"
          >
            <BrandLogo />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/para-profesionales"
                )
              }
              className="hidden rounded-xl px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-100 sm:block"
            >
              {text.pros}
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/login-cliente"
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 transition hover:border-blue-300 hover:text-blue-700 sm:px-5 sm:text-sm"
            >
              {text.signIn}
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/registro-cliente"
                )
              }
              className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 sm:px-5 sm:py-3 sm:text-sm"
            >
              {text.signUp}
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#03112d]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,0.36),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.18),transparent_22%),linear-gradient(135deg,#020817_0%,#061a42_55%,#03112d_100%)]" />

        <div className="relative mx-auto grid max-w-[1440px] gap-10 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <p className="text-xs font-black tracking-[0.2em] text-blue-300">
              {text.badge}
            </p>

            <h1 className="mt-4 text-5xl font-black leading-[0.97] tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
              {text.title1}

              <span className="mt-2 block bg-gradient-to-r from-blue-300 via-blue-500 to-cyan-300 bg-clip-text text-transparent">
                {text.title2}
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              {text.subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/solicitar-trabajo"
                  )
                }
                className="rounded-2xl bg-blue-600 px-7 py-4 font-black text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500"
              >
                {text.request}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/mis-solicitudes"
                  )
                }
                className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 font-black text-white backdrop-blur transition hover:bg-white/15"
              >
                {text.requests}
              </button>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-2 shadow-2xl backdrop-blur">
              <div className="flex flex-col gap-2 sm:flex-row">
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
                      e.key ===
                      "Enter"
                    ) {
                      buscarServicio();
                    }
                  }}
                  placeholder={
                    text.placeholder
                  }
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white px-5 py-4 text-slate-950 outline-none placeholder:text-slate-400"
                />

                <button
                  type="button"
                  onClick={
                    buscarServicio
                  }
                  className="rounded-xl bg-blue-600 px-7 py-4 font-black text-white transition hover:bg-blue-500"
                >
                  {text.search}
                </button>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-[3rem] bg-blue-500/15 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/5 p-2 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur">
              <img
                src={ads[1]}
                alt="RELYDO for customers"
                className="block h-auto w-full rounded-[1.55rem] object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[#f6f8fc] px-5 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black tracking-[0.2em] text-blue-600">
              RELYDO
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] md:text-5xl">
              {text.howTitle}
            </h2>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {pasos.map(
              (paso) => (
                <div
                  key={
                    paso.number
                  }
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="text-4xl font-black text-blue-200">
                    {
                      paso.number
                    }
                  </div>

                  <h3 className="mt-4 text-xl font-black">
                    {
                      paso.title
                    }
                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">
                    {
                      paso.description
                    }
                  </p>
                </div>
              )
            )}
          </div>

          <div className="mt-12 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-2 shadow-xl">
            <img
              src={ads[2]}
              alt="RELYDO customer experience"
              className="w-full rounded-[1.6rem] object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white px-5 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-[1440px] overflow-hidden rounded-[2.5rem] bg-[#07152f] text-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-center p-8 md:p-12">
            <p className="text-sm font-black tracking-[0.2em] text-blue-300">
              RELYDO
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] md:text-5xl">
              {text.cta}
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-300">
              {text.ctaSub}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/solicitar-trabajo"
                )
              }
              className="mt-8 w-fit rounded-2xl bg-white px-7 py-4 font-black text-blue-700 transition hover:bg-blue-50"
            >
              {text.request}
            </button>
          </div>

          <div className="min-h-[340px] p-3">
            <img
              src={ads[3]}
              alt="RELYDO customer app"
              className="h-full w-full rounded-[1.8rem] object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </main>
  );
}