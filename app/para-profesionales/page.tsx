"use client";

import { useRouter } from "next/navigation";
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
          const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "inline";
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


export default function ProfesionalesHome() {
  const router = useRouter();
  const { language } = useLanguage();
  const es = language === "es";

  const T = es
    ? {
        customers: "Para clientes",
        signIn: "Iniciar sesión",
        join: "Unirme a RELYDO",
        badge: "RELYDO PARA PROFESIONALES",
        title1: "Más oportunidades.",
        title2: "Más control. Más crecimiento.",
        subtitle:
          "Encuentra trabajos, envía presupuestos, administra tus servicios y construye una reputación profesional dentro de RELYDO.",
        primary: "Empezar como profesional",
        secondary: "Ya tengo cuenta",
        why: "Una plataforma creada para trabajar",
        whyD: "Oportunidades, comunicación, pagos y reputación en un solo flujo profesional.",
        w1: "Encuentra oportunidades",
        w1d: "Accede a solicitudes compatibles con tu oficio y ubicación.",
        w2: "Envía presupuestos",
        w2d: "Presenta tu propuesta con precio, llegada estimada y mensaje.",
        w3: "Administra tus trabajos",
        w3d: "Actualiza etapas, comunica avances y registra evidencias.",
        w4: "Construye reputación",
        w4d: "Historial, trabajos completados y reseñas fortalecen tu perfil.",
        structure: "Trabaja con una estructura más profesional",
        structureD: "Mantén cada trabajo organizado desde la oportunidad inicial hasta el pago final.",
        cta: "Tu próximo cliente puede estar en RELYDO.",
        ctaD: "Crea tu perfil, completa la verificación y empieza a recibir oportunidades.",
      }
    : {
        customers: "For Customers",
        signIn: "Sign in",
        join: "Join RELYDO",
        badge: "RELYDO FOR PROFESSIONALS",
        title1: "More opportunities.",
        title2: "More control. More growth.",
        subtitle:
          "Find jobs, send quotes, manage your services and build a professional reputation inside RELYDO.",
        primary: "Get started as a professional",
        secondary: "I already have an account",
        why: "A platform built for getting work done",
        whyD: "Opportunities, communication, payments and reputation in one professional workflow.",
        w1: "Find opportunities",
        w1d: "Access requests that match your trade and service area.",
        w2: "Send quotes",
        w2d: "Submit your proposal with price, estimated arrival and message.",
        w3: "Manage your jobs",
        w3d: "Update stages, communicate progress and record evidence.",
        w4: "Build your reputation",
        w4d: "History, completed jobs and reviews strengthen your profile.",
        structure: "Work with a more professional structure",
        structureD: "Keep every job organized from the initial opportunity through final payment.",
        cta: "Your next customer could be on RELYDO.",
        ctaD: "Create your profile, complete verification and start receiving opportunities.",
      };

  const ads = es
    ? ["/ads/ads-2.jpeg", "/ads/274974a4-c1f1-49e8-9ff6-cbd13ad4b9f7.png"]
    : ["/ads/ads-18.png", "/ads/ads-17.png"];

  const items = [
    [T.w1, T.w1d, "01"],
    [T.w2, T.w2d, "02"],
    [T.w3, T.w3d, "03"],
    [T.w4, T.w4d, "04"],
  ];

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#020817]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <button onClick={() => router.push("/")} className="[&_span]:text-white"><BrandLogo /></button>

          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/clientes")} className="hidden rounded-xl px-4 py-2 text-sm font-black text-slate-300 hover:bg-white/10 sm:block">
              {T.customers}
            </button>
            <button onClick={() => router.push("/login-profesional")} className="rounded-xl border border-white/20 px-3 py-2 text-xs font-black text-white sm:px-5 sm:text-sm">
              {T.signIn}
            </button>
            <button onClick={() => router.push("/registro-profesional")} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white sm:px-5 sm:py-3 sm:text-sm">
              {T.join}
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#020817]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(37,99,235,0.42),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(56,189,248,0.12),transparent_24%),linear-gradient(135deg,#020817_0%,#061a42_55%,#020817_100%)]" />
        <div className="relative mx-auto grid max-w-[1440px] gap-10 px-5 py-16 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:px-8 lg:py-28">
          <div>
            <p className="text-xs font-black tracking-[0.22em] text-blue-300">{T.badge}</p>
            <h1 className="mt-5 text-5xl font-black leading-[0.94] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
              {T.title1}
              <span className="mt-2 block bg-gradient-to-r from-blue-300 via-blue-500 to-cyan-300 bg-clip-text text-transparent">{T.title2}</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300 sm:text-xl">{T.subtitle}</p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => router.push("/registro-profesional")} className="rounded-2xl bg-blue-600 px-7 py-4 font-black text-white shadow-2xl shadow-blue-600/30 hover:bg-blue-500">
                {T.primary}
              </button>
              <button onClick={() => router.push("/login-profesional")} className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 font-black text-white">
                {T.secondary}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-white/5 p-2 shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <img src={ads[0]} alt="RELYDO professional" className="w-full rounded-[1.55rem] object-cover" />
          </div>
        </div>
      </section>

      <section className="bg-[#f6f8fc] px-5 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-black tracking-[-0.04em] md:text-5xl">{T.why}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{T.whyD}</p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {items.map(([title, desc, n]) => (
              <div key={n} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-4xl font-black text-blue-200">{n}</div>
                <h3 className="mt-4 text-xl font-black">{title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-black tracking-[0.2em] text-blue-600">PROFESSIONAL WORKFLOW</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] md:text-5xl">{T.structure}</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">{T.structureD}</p>
            <button onClick={() => router.push("/registro-profesional")} className="mt-8 rounded-2xl bg-blue-600 px-7 py-4 font-black text-white">
              {T.join}
            </button>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[#07152f] p-2 shadow-xl">
            <img src={ads[1]} alt="RELYDO professional workflow" className="w-full rounded-[1.55rem] object-cover" loading="lazy" />
          </div>
        </div>
      </section>

      <section className="bg-[#020817] px-5 py-16 text-white lg:px-8 lg:py-24">
        <div className="mx-auto rounded-[2.5rem] border border-white/10 bg-[#07152f] p-8 text-center md:p-12">
          <h2 className="mx-auto max-w-3xl text-4xl font-black tracking-[-0.04em] md:text-5xl">{T.cta}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">{T.ctaD}</p>
          <button onClick={() => router.push("/registro-profesional")} className="mt-8 rounded-2xl bg-white px-7 py-4 font-black text-blue-700">
            {T.primary}
          </button>
        </div>
      </section>
    </main>
  );
}