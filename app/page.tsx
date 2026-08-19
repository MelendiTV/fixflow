"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/app/components/LanguageProvider";

export default function Home() {
  const router = useRouter();
  const { language } = useLanguage();

  const [busqueda, setBusqueda] = useState("");

  const es = language === "es";

  const text = es
    ? {
        inicio: "Inicio",
        servicios: "Servicios",
        profesionales: "Profesionales",
        comoFunciona: "Cómo funciona",
        contacto: "Contacto",
        iniciarSesion: "Iniciar sesión",
        registrarse: "Registrarse",

        badge: "SERVICIOS LOCALES DE CONFIANZA",
        titulo1: "Contrata profesionales",
        titulo2: "de confianza, sin complicaciones.",
        subtitulo:
          "Encuentra profesionales verificados, compara presupuestos, sigue tu trabajo y paga de forma protegida desde un solo lugar.",

        cliente: "Quiero contratar",
        profesional: "Soy profesional",

        categorias:
          "Plomería • Electricidad • Pintura • Jardinería • Limpieza • y más",
        placeholder: "¿Qué servicio necesitas?",
        buscar: "Buscar",
        solicitarTrabajo: "Solicitar un trabajo",
        misSolicitudes: "Mis solicitudes",

        confianzaTitulo: "Todo lo que necesitas para contratar con confianza",
        confianzaSub:
          "RELYDO acompaña el trabajo desde la solicitud hasta su finalización.",

        verificados: "Profesionales verificados",
        verificadosDesc:
          "Encuentra profesionales que pasan por el proceso de verificación de RELYDO.",

        presupuestos: "Presupuestos claros",
        presupuestosDesc:
          "Recibe propuestas y compara antes de decidir a quién contratar.",

        seguimiento: "Seguimiento del trabajo",
        seguimientoDesc:
          "Sigue el progreso desde que el profesional va en camino hasta que termina.",

        pagos: "Pagos protegidos",
        pagosDesc:
          "El pago se gestiona dentro de RELYDO para darte una experiencia más segura.",

        comunicacion: "Comunicación directa",
        comunicacionDesc:
          "Mantén la conversación relacionada con el trabajo dentro de la plataforma.",

        soporte: "Sistema de reclamos",
        soporteDesc:
          "Si surge un problema, RELYDO mantiene un proceso para revisar el caso.",

        dosLados: "Una plataforma. Dos formas de crecer.",
        dosLadosSub:
          "Ya sea que necesites ayuda o quieras conseguir más trabajos, RELYDO conecta ambas partes.",

        paraClientes: "PARA CLIENTES",
        clienteTitulo: "Resuelve lo que necesitas",
        clienteDesc:
          "Publica el trabajo, recibe presupuestos y elige al profesional que mejor se adapte a ti.",
        clientePunto1: "Solicitudes fáciles de crear",
        clientePunto2: "Presupuestos de profesionales",
        clientePunto3: "Seguimiento del servicio",
        clientePunto4: "Pago y soporte dentro de RELYDO",
        crearCliente: "Crear cuenta como cliente",

        paraPros: "PARA PROFESIONALES",
        proTitulo: "Haz crecer tu negocio",
        proDesc:
          "Encuentra oportunidades locales, envía presupuestos y construye tu reputación en RELYDO.",
        proPunto1: "Nuevas oportunidades de trabajo",
        proPunto2: "Panel para administrar tus servicios",
        proPunto3: "Comunicación con clientes",
        proPunto4: "Historial y reputación profesional",
        crearPro: "Registrarme como profesional",

        funcionaBadge: "SIMPLE Y RÁPIDO",
        funcionaTitulo: "¿Cómo funciona RELYDO?",
        funcionaSub:
          "De una necesidad a un trabajo terminado en pocos pasos.",

        paso1: "Cuéntanos qué necesitas",
        paso1Desc:
          "Describe el trabajo, agrega la información necesaria y envía tu solicitud.",

        paso2: "Recibe presupuestos",
        paso2Desc:
          "Los profesionales disponibles pueden revisar tu solicitud y enviarte una propuesta.",

        paso3: "Elige y da seguimiento",
        paso3Desc:
          "Selecciona una propuesta y sigue el progreso del trabajo desde RELYDO.",

        paso4: "Finaliza con confianza",
        paso4Desc:
          "Mantén el pago, las evidencias y cualquier incidencia asociadas al servicio.",

        destacado: "Destacado en RELYDO",
        destacadoSub:
          "Servicios, promociones y profesionales recomendados para ti.",

        seguridadBadge: "CONFIANZA RELYDO",
        seguridadTitulo: "Diseñado para proteger a ambas partes",
        seguridadDesc:
          "Clientes y profesionales cuentan con herramientas para documentar, comunicar y dar seguimiento a cada trabajo.",

        seguro1: "Verificación",
        seguro1Desc: "Proceso de verificación para profesionales.",

        seguro2: "Pagos",
        seguro2Desc: "Gestión del pago asociada al trabajo.",

        seguro3: "Evidencias",
        seguro3Desc: "Registro de información y evidencias del servicio.",

        seguro4: "Reclamos",
        seguro4Desc: "Proceso para atender problemas cuando sea necesario.",

        ctaBadge: "EMPIEZA HOY",
        ctaTitulo: "Tu próximo trabajo empieza en RELYDO.",
        ctaDesc:
          "Encuentra ayuda para tu próximo proyecto o empieza a recibir oportunidades como profesional.",
        ctaCliente: "Necesito un profesional",
        ctaPro: "Quiero ofrecer mis servicios",

        footerDesc:
          "Conectando clientes con profesionales locales de confianza.",
        footerPlataforma: "Plataforma",
        footerCuenta: "Cuenta",
        footerLegal: "Legal",
        footerInicio: "Inicio",
        footerServicios: "Servicios",
        footerProfesionales: "Profesionales",
        footerLogin: "Iniciar sesión",
        footerCliente: "Registro cliente",
        footerPro: "Registro profesional",
        footerTerminos: "Términos",
        footerPrivacidad: "Privacidad",
        derechos: "Todos los derechos reservados.",
      }
    : {
        inicio: "Home",
        servicios: "Services",
        profesionales: "Professionals",
        comoFunciona: "How it works",
        contacto: "Contact",
        iniciarSesion: "Sign in",
        registrarse: "Sign up",

        badge: "TRUSTED LOCAL SERVICES",
        titulo1: "Hire professionals",
        titulo2: "you can trust, without the hassle.",
        subtitulo:
          "Find verified professionals, compare quotes, track your job and manage protected payments from one place.",

        cliente: "I need a professional",
        profesional: "I'm a professional",

        categorias:
          "Plumbing • Electrical • Painting • Landscaping • Cleaning • and more",
        placeholder: "What service do you need?",
        buscar: "Search",
        solicitarTrabajo: "Request a job",
        misSolicitudes: "My requests",

        confianzaTitulo: "Everything you need to hire with confidence",
        confianzaSub:
          "RELYDO supports the job from the initial request through completion.",

        verificados: "Verified professionals",
        verificadosDesc:
          "Find professionals who go through RELYDO's verification process.",

        presupuestos: "Clear quotes",
        presupuestosDesc:
          "Receive proposals and compare your options before hiring.",

        seguimiento: "Job tracking",
        seguimientoDesc:
          "Follow progress from the moment your professional is on the way until completion.",

        pagos: "Protected payments",
        pagosDesc:
          "Payments are managed through RELYDO for a safer experience.",

        comunicacion: "Direct communication",
        comunicacionDesc:
          "Keep job-related communication organized inside the platform.",

        soporte: "Claim process",
        soporteDesc:
          "If something goes wrong, RELYDO provides a process for reviewing the case.",

        dosLados: "One platform. Two ways to grow.",
        dosLadosSub:
          "Whether you need help or want more work, RELYDO brings both sides together.",

        paraClientes: "FOR CUSTOMERS",
        clienteTitulo: "Get things done",
        clienteDesc:
          "Post your job, receive quotes and choose the professional who works best for you.",
        clientePunto1: "Easy job requests",
        clientePunto2: "Quotes from professionals",
        clientePunto3: "Service progress tracking",
        clientePunto4: "Payment and support through RELYDO",
        crearCliente: "Create customer account",

        paraPros: "FOR PROFESSIONALS",
        proTitulo: "Grow your business",
        proDesc:
          "Find local opportunities, send quotes and build your reputation on RELYDO.",
        proPunto1: "New job opportunities",
        proPunto2: "Service management dashboard",
        proPunto3: "Customer communication",
        proPunto4: "Professional history and reputation",
        crearPro: "Join as a professional",

        funcionaBadge: "SIMPLE AND FAST",
        funcionaTitulo: "How does RELYDO work?",
        funcionaSub:
          "From something you need done to a completed job in just a few steps.",

        paso1: "Tell us what you need",
        paso1Desc:
          "Describe the job, add the necessary information and submit your request.",

        paso2: "Receive quotes",
        paso2Desc:
          "Available professionals can review your request and send you a proposal.",

        paso3: "Choose and track",
        paso3Desc:
          "Select a proposal and follow the progress of your job through RELYDO.",

        paso4: "Finish with confidence",
        paso4Desc:
          "Keep payment, evidence and any service issues connected to the job.",

        destacado: "Featured on RELYDO",
        destacadoSub:
          "Services, promotions and recommended professionals for you.",

        seguridadBadge: "RELYDO TRUST",
        seguridadTitulo: "Designed to protect both sides",
        seguridadDesc:
          "Customers and professionals have tools to document, communicate and track each job.",

        seguro1: "Verification",
        seguro1Desc: "Verification process for professionals.",

        seguro2: "Payments",
        seguro2Desc: "Payment management connected to the job.",

        seguro3: "Evidence",
        seguro3Desc: "Job information and service evidence kept together.",

        seguro4: "Claims",
        seguro4Desc: "A process for handling problems when necessary.",

        ctaBadge: "GET STARTED",
        ctaTitulo: "Your next job starts with RELYDO.",
        ctaDesc:
          "Find help for your next project or start receiving opportunities as a professional.",
        ctaCliente: "Find a professional",
        ctaPro: "Offer my services",

        footerDesc:
          "Connecting customers with trusted local professionals.",
        footerPlataforma: "Platform",
        footerCuenta: "Account",
        footerLegal: "Legal",
        footerInicio: "Home",
        footerServicios: "Services",
        footerProfesionales: "Professionals",
        footerLogin: "Sign in",
        footerCliente: "Customer sign up",
        footerPro: "Professional sign up",
        footerTerminos: "Terms",
        footerPrivacidad: "Privacy",
        derechos: "All rights reserved.",
      };

  function buscarServicio() {
    const texto = busqueda.trim();

    if (!texto) {
      router.push("/servicios");
      return;
    }

    router.push(`/servicios?buscar=${encodeURIComponent(texto)}`);
  }

  const beneficios = [
    {
      icon: "✓",
      title: text.verificados,
      description: text.verificadosDesc,
    },
    {
      icon: "$",
      title: text.presupuestos,
      description: text.presupuestosDesc,
    },
    {
      icon: "→",
      title: text.seguimiento,
      description: text.seguimientoDesc,
    },
    {
      icon: "◆",
      title: text.pagos,
      description: text.pagosDesc,
    },
    {
      icon: "●",
      title: text.comunicacion,
      description: text.comunicacionDesc,
    },
    {
      icon: "★",
      title: text.soporte,
      description: text.soporteDesc,
    },
  ];

  const pasos = [
    {
      number: "01",
      title: text.paso1,
      description: text.paso1Desc,
    },
    {
      number: "02",
      title: text.paso2,
      description: text.paso2Desc,
    },
    {
      number: "03",
      title: text.paso3,
      description: text.paso3Desc,
    },
    {
      number: "04",
      title: text.paso4,
      description: text.paso4Desc,
    },
  ];

  // Imágenes publicitarias según el idioma seleccionado.
  const anunciosEspanol = [
    "/ads/4b37dfc4-7eb9-4b5f-8bb5-40eb6a974310.png",
    "/ads/4daa86f7-42c8-43f5-b5bd-4c6342dfb0dd.png",
    "/ads/58d502c8-3a92-443d-bb21-d335f41c282b.png",
    "/ads/8864c5e6-3489-4ca5-8772-87de324ccfc2.png",
    "/ads/9018c8ec-b41a-4d2c-882a-cac2bd5c0fbe.png",
    "/ads/24409dde-116e-49cc-a962-70f4ca6595df.png",
    "/ads/274974a4-c1f1-49e8-9ff6-cbd13ad4b9f7.png",
    "/ads/ads-2.jpeg",
    "/ads/ads-5.jpeg",
  ];

  // ads-13 no existe, por eso no se referencia.
  // La página usa 9 espacios y tenemos 8 imágenes inglesas; ads-18 se reutiliza al final.
  const anunciosIngles = [
    "/ads/ads-10.png",
    "/ads/ads-11.png",
    "/ads/ads-12.png",
    "/ads/ads-14.png",
    "/ads/ads-15.png",
    "/ads/ads-16.png",
    "/ads/ads-17.png",
    "/ads/ads-18.png",
    "/ads/ads-18.png",
  ];

  const anuncios = es ? anunciosEspanol : anunciosIngles;

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-950">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-5 sm:py-4 lg:px-8">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-lg font-black text-white shadow-lg shadow-blue-600/20 sm:h-11 sm:w-11 sm:rounded-2xl sm:text-xl">
              R
            </span>

            <span className="text-xl font-black tracking-[0.05em] text-slate-950 sm:text-2xl md:text-3xl">
              RELY<span className="text-blue-600">DO</span>
            </span>
          </button>

          <nav className="hidden items-center gap-8 lg:flex">
            <button
              onClick={() => router.push("/")}
              className="text-sm font-bold text-slate-700 transition hover:text-blue-600"
            >
              {text.inicio}
            </button>

            <button
              onClick={() => router.push("/servicios")}
              className="text-sm font-bold text-slate-700 transition hover:text-blue-600"
            >
              {text.servicios}
            </button>

            <button
              onClick={() => router.push("/profesionales")}
              className="text-sm font-bold text-slate-700 transition hover:text-blue-600"
            >
              {text.profesionales}
            </button>

            <button
              onClick={() =>
                document
                  .getElementById("como-funciona")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="text-sm font-bold text-slate-700 transition hover:text-blue-600"
            >
              {text.comoFunciona}
            </button>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              onClick={() => router.push("/login-cliente")}
              className="rounded-lg px-2.5 py-2 text-xs font-extrabold text-slate-800 transition hover:bg-slate-100 sm:rounded-xl sm:px-5 sm:text-sm"
            >
              {text.iniciarSesion}
            </button>

            <button
              type="button"
              onClick={() => router.push("/registro-cliente")}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-extrabold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm"
            >
              {text.registrarse}
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-[#03112d]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,0.36),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.22),transparent_24%),linear-gradient(135deg,#020817_0%,#061a42_55%,#03112d_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="relative mx-auto grid max-w-[1440px] gap-8 px-5 py-8 sm:gap-12 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1.5 text-[10px] font-black tracking-[0.16em] text-blue-200 backdrop-blur sm:px-4 sm:py-2 sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_18px_rgba(96,165,250,0.9)]" />
              {text.badge}
            </div>

            <h1 className="mt-5 text-[2.35rem] font-black leading-[0.98] tracking-[-0.045em] text-white sm:mt-7 sm:text-6xl lg:text-7xl">
              {text.titulo1}

              <span className="mt-2 block bg-gradient-to-r from-blue-300 via-blue-500 to-cyan-300 bg-clip-text text-transparent">
                {text.titulo2}
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-6 text-slate-300 sm:mt-7 sm:text-xl sm:leading-8">
              {text.subtitulo}
            </p>

            {/* Imagen de impacto exclusiva para móvil */}
            <div className="relative mt-6 overflow-hidden rounded-[1.6rem] border border-white/15 bg-white/5 p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] lg:hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent" />
              <img
                src={anuncios[1]}
                alt="RELYDO app"
                className="relative h-[190px] w-full rounded-[1.25rem] object-cover object-[72%_center] sm:h-[250px]"
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:mt-9 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push("/registro-cliente")}
                className="rounded-2xl bg-blue-600 px-7 py-4 font-black text-white shadow-2xl shadow-blue-600/30 transition hover:-translate-y-0.5 hover:bg-blue-500"
              >
                {text.cliente}
              </button>

              <button
                type="button"
                onClick={() => router.push("/registro-profesional")}
                className="rounded-2xl border border-white/20 bg-white/10 px-7 py-4 font-black text-white backdrop-blur transition hover:bg-white/15"
              >
                {text.profesional}
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/8 p-2 shadow-2xl backdrop-blur sm:mt-9">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      buscarServicio();
                    }
                  }}
                  placeholder={text.placeholder}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white px-5 py-4 text-slate-950 outline-none placeholder:text-slate-400"
                />

                <button
                  type="button"
                  onClick={buscarServicio}
                  className="rounded-xl bg-blue-600 px-7 py-4 font-black text-white transition hover:bg-blue-500"
                >
                  {text.buscar}
                </button>
              </div>
            </div>

            <p className="mt-4 text-sm font-semibold text-slate-400">
              {text.categorias}
            </p>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-8 rounded-[3rem] bg-blue-500/15 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/5 p-2 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur">
              <img
                src={anuncios[1]}
                alt="RELYDO"
                className="block h-auto w-full rounded-[1.55rem]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-[1440px] divide-y divide-slate-200 px-5 md:grid-cols-4 md:divide-x md:divide-y-0 lg:px-8">
          {[
            [text.verificados, "01"],
            [text.presupuestos, "02"],
            [text.pagos, "03"],
            [text.soporte, "04"],
          ].map(([label, number]) => (
            <div
              key={label}
              className="flex items-center gap-4 px-4 py-6 md:px-6"
            >
              <span className="text-2xl font-black text-blue-600">
                {number}
              </span>

              <span className="text-sm font-black text-slate-800">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* EXPERIENCIA RELYDO */}
      <section className="bg-[#f6f8fc] px-5 py-10 md:py-24 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black tracking-[0.22em] text-blue-600">
              THE RELYDO EXPERIENCE
            </p>

            <h2 className="mt-3 text-4xl font-black tracking-[-0.035em] text-slate-950 md:text-5xl">
              {text.confianzaTitulo}
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              {text.confianzaSub}
            </p>
          </div>

          <div className="mt-12 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70">
              <img
                src={anuncios[0]}
                alt="RELYDO para clientes"
                className="block h-auto w-full rounded-[1.6rem] object-contain sm:h-full sm:min-h-[420px] sm:object-cover sm:object-center"
                loading="lazy"
              />
            </div>

            <div className="flex flex-col justify-between rounded-[2rem] bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white shadow-2xl shadow-blue-600/20 lg:p-10">
              <div>
                <p className="text-sm font-black tracking-[0.18em] text-blue-100">
                  ONE PLATFORM
                </p>

                <h3 className="mt-3 text-3xl font-black tracking-[-0.025em] md:text-4xl">
                  {text.dosLados}
                </h3>

                <p className="mt-4 max-w-2xl text-lg leading-8 text-blue-50">
                  {text.dosLadosSub}
                </p>
              </div>

              <div className="mt-8 grid gap-4">
                <button
                  onClick={() => router.push("/solicitar-trabajo")}
                  className="rounded-2xl bg-white px-6 py-4 font-black text-blue-700 transition hover:bg-blue-50"
                >
                  {text.solicitarTrabajo}
                </button>

                <button
                  onClick={() => router.push("/mis-solicitudes")}
                  className="rounded-2xl border border-white/30 bg-white/10 px-6 py-4 font-black text-white transition hover:bg-white/15"
                >
                  {text.misSolicitudes}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="bg-white px-5 py-10 md:py-24 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {beneficios.map((item, index) => (
              <div
                key={item.title}
                className="group rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg sm:p-5 lg:p-6"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-base font-black text-white shadow-md shadow-blue-600/20 sm:h-11 sm:w-11 sm:text-lg">
                    {item.icon}
                  </div>

                  <span className="text-xs font-black text-slate-300 sm:text-sm">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-black tracking-[-0.02em] sm:text-lg lg:text-xl">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-5 text-slate-600 sm:leading-6 lg:text-[15px]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLIENTES / PROFESIONALES */}
      <section className="bg-[#020817] px-5 py-10 text-white md:py-24 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-8 xl:grid-cols-2">
            <article className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-[#08265d] to-[#04122e] shadow-2xl">
              <div className="p-8 md:p-10">
                <p className="text-sm font-black tracking-[0.2em] text-blue-300">
                  {text.paraClientes}
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.035em]">
                  {text.clienteTitulo}
                </h2>

                <p className="mt-4 max-w-xl text-lg leading-8 text-slate-300">
                  {text.clienteDesc}
                </p>

                <div className="mt-7 grid gap-3 text-sm font-bold text-slate-100 sm:grid-cols-2">
                  <p>✓ {text.clientePunto1}</p>
                  <p>✓ {text.clientePunto2}</p>
                  <p>✓ {text.clientePunto3}</p>
                  <p>✓ {text.clientePunto4}</p>
                </div>

                <button
                  onClick={() => router.push("/registro-cliente")}
                  className="mt-8 rounded-2xl bg-white px-6 py-4 font-black text-blue-700 transition hover:bg-blue-50"
                >
                  {text.crearCliente}
                </button>
              </div>

              <div className="hidden h-[360px] border-t border-white/10 bg-black/15 p-3 sm:block md:h-[440px]">
                <img
                  src={anuncios[4]}
                  alt="RELYDO cliente"
                  className="h-full w-full rounded-[1.55rem] object-cover object-top"
                  loading="lazy"
                />
              </div>
            </article>

            <article className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-gradient-to-br from-slate-900 to-[#07142c] shadow-2xl">
              <div className="p-8 md:p-10">
                <p className="text-sm font-black tracking-[0.2em] text-blue-400">
                  {text.paraPros}
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-[-0.035em]">
                  {text.proTitulo}
                </h2>

                <p className="mt-4 max-w-xl text-lg leading-8 text-slate-300">
                  {text.proDesc}
                </p>

                <div className="mt-7 grid gap-3 text-sm font-bold text-slate-100 sm:grid-cols-2">
                  <p>✓ {text.proPunto1}</p>
                  <p>✓ {text.proPunto2}</p>
                  <p>✓ {text.proPunto3}</p>
                  <p>✓ {text.proPunto4}</p>
                </div>

                <button
                  onClick={() => router.push("/registro-profesional")}
                  className="mt-8 rounded-2xl bg-blue-600 px-6 py-4 font-black text-white transition hover:bg-blue-500"
                >
                  {text.crearPro}
                </button>
              </div>

              <div className="hidden h-[360px] border-t border-white/10 bg-black/15 p-3 sm:block md:h-[440px]">
                <img
                  src={anuncios[7]}
                  alt="RELYDO profesional"
                  className="h-full w-full rounded-[1.55rem] object-cover object-center"
                  loading="lazy"
                />
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section
        id="como-funciona"
        className="bg-white px-5 py-10 md:py-24 lg:px-8"
      >
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-black tracking-[0.2em] text-blue-600">
                {text.funcionaBadge}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] md:text-5xl">
                {text.funcionaTitulo}
              </h2>

              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                {text.funcionaSub}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {pasos.map((paso) => (
                <div
                  key={paso.number}
                  className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-6"
                >
                  <div className="text-4xl font-black text-blue-200">
                    {paso.number}
                  </div>

                  <h3 className="mt-3 text-xl font-black">
                    {paso.title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">
                    {paso.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 hidden gap-6 overflow-hidden rounded-[2.25rem] border border-slate-200 bg-slate-950 shadow-2xl sm:grid lg:grid-cols-[0.95fr_1.05fr]">
            <div className="flex flex-col justify-center p-8 text-white md:p-10">
              <p className="text-sm font-black tracking-[0.18em] text-blue-300">
                RELYDO FLOW
              </p>

              <h3 className="mt-3 text-3xl font-black md:text-4xl">
                {text.funcionaTitulo}
              </h3>

              <p className="mt-4 max-w-xl leading-7 text-slate-300">
                {text.funcionaSub}
              </p>

              <button
                type="button"
                onClick={() => router.push("/solicitar-trabajo")}
                className="mt-7 w-fit rounded-2xl bg-blue-600 px-6 py-4 font-black text-white transition hover:bg-blue-500"
              >
                {text.solicitarTrabajo}
              </button>
            </div>

            <div className="h-[360px] p-3 md:h-[460px]">
              <img
                src={anuncios[5]}
                alt="RELYDO app"
                className="h-full w-full rounded-[1.75rem] object-cover object-center"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SEGURIDAD */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-[#02102d] px-5 py-10 text-white md:py-24 lg:px-8">
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-blue-300/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-[1440px] gap-10 xl:grid-cols-[1fr_0.95fr] xl:items-center">
          <div>
            <p className="text-sm font-black tracking-[0.2em] text-blue-200">
              {text.seguridadBadge}
            </p>

            <h2 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.04em] md:text-6xl">
              {text.seguridadTitulo}
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
              {text.seguridadDesc}
            </p>

            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              {[
                [text.seguro1, text.seguro1Desc],
                [text.seguro2, text.seguro2Desc],
                [text.seguro3, text.seguro3Desc],
                [text.seguro4, text.seguro4Desc],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur"
                >
                  <div className="mb-4 h-1.5 w-10 rounded-full bg-blue-300" />

                  <h3 className="font-black">
                    {title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-blue-100/85">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-2 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur sm:block">
            <img
              src={anuncios[6]}
              alt="RELYDO seguridad"
              className="block h-auto w-full rounded-[1.6rem]"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-[#f6f8fc] px-5 py-10 md:py-24 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid overflow-hidden rounded-[2.5rem] bg-white shadow-[0_25px_80px_rgba(15,23,42,0.12)] xl:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col justify-center p-8 md:p-12 xl:p-14">
              <p className="text-sm font-black tracking-[0.2em] text-blue-600">
                {text.ctaBadge}
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.04em] md:text-5xl">
                {text.ctaTitulo}
              </h2>

              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                {text.ctaDesc}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => router.push("/registro-cliente")}
                  className="rounded-2xl bg-blue-600 px-7 py-4 font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  {text.ctaCliente}
                </button>

                <button
                  onClick={() => router.push("/registro-profesional")}
                  className="rounded-2xl border border-slate-300 bg-white px-7 py-4 font-black text-slate-800 transition hover:border-blue-500 hover:text-blue-700"
                >
                  {text.ctaPro}
                </button>
              </div>
            </div>

            <div className="hidden h-[360px] bg-[#07152f] p-3 sm:block md:h-[460px]">
              <img
                src={anuncios[8]}
                alt="RELYDO"
                className="h-full w-full rounded-[1.8rem] object-cover object-center"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contacto" className="border-t border-slate-200 bg-white">
        {/* FOOTER MÓVIL COMPACTO */}
        <div className="px-5 py-7 sm:hidden">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-xl font-black tracking-[0.05em] text-slate-950"
            >
              RELY<span className="text-blue-600">DO</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/login-cliente")}
              className="text-sm font-bold text-slate-700"
            >
              {text.footerLogin}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
            <button
              type="button"
              onClick={() => router.push("/servicios")}
              className="text-left"
            >
              {text.footerServicios}
            </button>

            <button
              type="button"
              onClick={() => router.push("/profesionales")}
              className="text-left"
            >
              {text.footerProfesionales}
            </button>

            <button
              type="button"
              onClick={() => router.push("/registro-cliente")}
              className="text-left"
            >
              {text.footerCliente}
            </button>

            <button
              type="button"
              onClick={() => router.push("/registro-profesional")}
              className="text-left"
            >
              {text.footerPro}
            </button>

            <span>{text.footerTerminos}</span>
            <span>{text.footerPrivacidad}</span>
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} RELYDO. {text.derechos}
          </div>
        </div>

        {/* FOOTER DESKTOP / TABLET */}
        <div className="hidden px-5 py-12 sm:block lg:px-8">
          <div className="mx-auto grid max-w-[1440px] gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-2xl font-black tracking-[0.05em] text-slate-950"
              >
                RELY<span className="text-blue-600">DO</span>
              </button>

              <p className="mt-4 max-w-xs leading-7 text-slate-600">
                {text.footerDesc}
              </p>
            </div>

            <div>
              <h3 className="font-black">{text.footerPlataforma}</h3>
              <div className="mt-4 flex flex-col items-start gap-3 text-slate-600">
                <button onClick={() => router.push("/")}>{text.footerInicio}</button>
                <button onClick={() => router.push("/servicios")}>{text.footerServicios}</button>
                <button onClick={() => router.push("/profesionales")}>{text.footerProfesionales}</button>
              </div>
            </div>

            <div>
              <h3 className="font-black">{text.footerCuenta}</h3>
              <div className="mt-4 flex flex-col items-start gap-3 text-slate-600">
                <button onClick={() => router.push("/login-cliente")}>{text.footerLogin}</button>
                <button onClick={() => router.push("/registro-cliente")}>{text.footerCliente}</button>
                <button onClick={() => router.push("/registro-profesional")}>{text.footerPro}</button>
              </div>
            </div>

            <div>
              <h3 className="font-black">{text.footerLegal}</h3>
              <div className="mt-4 flex flex-col items-start gap-3 text-slate-600">
                <span>{text.footerTerminos}</span>
                <span>{text.footerPrivacidad}</span>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-[1440px] border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} RELYDO. {text.derechos}
          </div>
        </div>
      </footer>
    </main>
  );
}