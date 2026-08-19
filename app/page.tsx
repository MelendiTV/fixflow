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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-blue-500 bg-blue-600 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-2xl font-black tracking-wide md:text-3xl"
          >
            RELYDO
          </button>

          <nav className="hidden items-center gap-6 lg:flex">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="font-medium hover:text-blue-100"
            >
              {text.inicio}
            </button>

            <button
              type="button"
              onClick={() => router.push("/servicios")}
              className="font-medium hover:text-blue-100"
            >
              {text.servicios}
            </button>

            <button
              type="button"
              onClick={() => router.push("/profesionales")}
              className="font-medium hover:text-blue-100"
            >
              {text.profesionales}
            </button>

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("como-funciona")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="font-medium hover:text-blue-100"
            >
              {text.comoFunciona}
            </button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => router.push("/login-cliente")}
              className="rounded-xl bg-white px-3 py-2 text-sm font-extrabold text-blue-700 shadow-sm transition hover:bg-blue-50 sm:px-5 sm:text-base"
            >
              {text.iniciarSesion}
            </button>

            <button
              type="button"
              onClick={() => router.push("/registro-cliente")}
              className="hidden rounded-xl border border-white px-5 py-2 font-extrabold text-white transition hover:bg-white hover:text-blue-700 sm:block"
            >
              {text.registrarse}
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-slate-50">
        <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -right-40 top-20 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-14 text-center md:py-20">
          <div className="mx-auto inline-flex rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-black tracking-[0.18em] text-blue-700 shadow-sm sm:text-sm">
            {text.badge}
          </div>

          <h1 className="mx-auto mt-6 max-w-5xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl md:text-6xl">
            {text.titulo1}
            <span className="block text-blue-600">{text.titulo2}</span>
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg md:text-xl">
            {text.subtitulo}
          </p>

          <div className="mx-auto mt-8 flex max-w-xl flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/registro-cliente")}
              className="rounded-xl bg-blue-600 px-7 py-4 font-black text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              {text.cliente}
            </button>

            <button
              type="button"
              onClick={() => router.push("/registro-profesional")}
              className="rounded-xl border-2 border-slate-300 bg-white px-7 py-4 font-black text-slate-800 transition hover:border-blue-600 hover:text-blue-700"
            >
              {text.profesional}
            </button>
          </div>

          {/* BUSCADOR */}
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/60">
            <div className="flex flex-col gap-3 sm:flex-row">
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
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
              />

              <button
                type="button"
                onClick={buscarServicio}
                className="rounded-xl bg-blue-600 px-8 py-4 font-black text-white transition hover:bg-blue-700"
              >
                {text.buscar}
              </button>
            </div>
          </div>

          <p className="mt-5 text-sm font-medium text-slate-500 sm:text-base">
            {text.categorias}
          </p>

          <div className="mx-auto mt-6 flex max-w-xl flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/solicitar-trabajo")}
              className="flex-1 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800"
            >
              {text.solicitarTrabajo}
            </button>

            <button
              type="button"
              onClick={() => router.push("/mis-solicitudes")}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 transition hover:border-blue-500 hover:text-blue-700"
            >
              {text.misSolicitudes}
            </button>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="bg-white px-5 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              {text.confianzaTitulo}
            </h2>

            <p className="mt-4 text-lg text-slate-600">
              {text.confianzaSub}
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {beneficios.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-xl font-black text-white">
                  {item.icon}
                </div>

                <h3 className="mt-5 text-xl font-black">
                  {item.title}
                </h3>

                <p className="mt-2 leading-7 text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLIENTE / PROFESIONAL */}
      <section className="px-5 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-black md:text-4xl">
              {text.dosLados}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
              {text.dosLadosSub}
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {/* CLIENTE */}
            <div className="rounded-3xl bg-blue-600 p-7 text-white shadow-xl md:p-10">
              <p className="text-sm font-black tracking-[0.18em] text-blue-100">
                {text.paraClientes}
              </p>

              <h3 className="mt-3 text-3xl font-black">
                {text.clienteTitulo}
              </h3>

              <p className="mt-4 max-w-xl leading-7 text-blue-50">
                {text.clienteDesc}
              </p>

              <div className="mt-7 space-y-3 font-semibold">
                <p>✓ {text.clientePunto1}</p>
                <p>✓ {text.clientePunto2}</p>
                <p>✓ {text.clientePunto3}</p>
                <p>✓ {text.clientePunto4}</p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/registro-cliente")}
                className="mt-8 rounded-xl bg-white px-6 py-4 font-black text-blue-700 transition hover:bg-blue-50"
              >
                {text.crearCliente}
              </button>
            </div>

            {/* PROFESIONAL */}
            <div className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl md:p-10">
              <p className="text-sm font-black tracking-[0.18em] text-blue-400">
                {text.paraPros}
              </p>

              <h3 className="mt-3 text-3xl font-black">
                {text.proTitulo}
              </h3>

              <p className="mt-4 max-w-xl leading-7 text-slate-300">
                {text.proDesc}
              </p>

              <div className="mt-7 space-y-3 font-semibold text-slate-100">
                <p>✓ {text.proPunto1}</p>
                <p>✓ {text.proPunto2}</p>
                <p>✓ {text.proPunto3}</p>
                <p>✓ {text.proPunto4}</p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/registro-profesional")}
                className="mt-8 rounded-xl bg-blue-600 px-6 py-4 font-black text-white transition hover:bg-blue-700"
              >
                {text.crearPro}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section
        id="como-funciona"
        className="bg-white px-5 py-16 md:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-black tracking-[0.2em] text-blue-600">
              {text.funcionaBadge}
            </p>

            <h2 className="mt-2 text-3xl font-black md:text-4xl">
              {text.funcionaTitulo}
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-600">
              {text.funcionaSub}
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {pasos.map((paso) => (
              <div
                key={paso.number}
                className="relative rounded-2xl border border-slate-200 p-6"
              >
                <span className="text-4xl font-black text-blue-100">
                  {paso.number}
                </span>

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
      </section>

      {/* PUBLICIDAD */}
      <section className="px-5 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-black tracking-[0.2em] text-blue-600">
              RELYDO
            </p>

            <h2 className="mt-2 text-3xl font-black md:text-4xl">
              {text.destacado}
            </h2>

            <p className="mt-3 text-slate-600">
              {text.destacadoSub}
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((numero) => (
              <div
                key={numero}
                className="group relative aspect-[4/3] overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 shadow-md"
              >
                <img
                  src={`/ads/relydo-ad-${numero}.png`}
                  alt={`RELYDO ${numero}`}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />

                <div className="absolute inset-0 -z-10 flex items-center justify-center">
                  <span className="font-bold text-slate-400">
                    RELYDO
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEGURIDAD */}
      <section className="bg-slate-950 px-5 py-16 text-white md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-black tracking-[0.2em] text-blue-400">
                {text.seguridadBadge}
              </p>

              <h2 className="mt-3 max-w-2xl text-3xl font-black leading-tight md:text-5xl">
                {text.seguridadTitulo}
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                {text.seguridadDesc}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [text.seguro1, text.seguro1Desc],
                [text.seguro2, text.seguro2Desc],
                [text.seguro3, text.seguro3Desc],
                [text.seguro4, text.seguro4Desc],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="mb-3 h-2 w-10 rounded-full bg-blue-500" />

                  <h3 className="font-black">{title}</h3>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-5 py-16 md:py-24">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-blue-600 px-6 py-12 text-center text-white shadow-2xl shadow-blue-600/20 md:px-12 md:py-16">
          <p className="text-sm font-black tracking-[0.2em] text-blue-100">
            {text.ctaBadge}
          </p>

          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black md:text-5xl">
            {text.ctaTitulo}
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-50">
            {text.ctaDesc}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/registro-cliente")}
              className="rounded-xl bg-white px-7 py-4 font-black text-blue-700 transition hover:bg-blue-50"
            >
              {text.ctaCliente}
            </button>

            <button
              type="button"
              onClick={() => router.push("/registro-profesional")}
              className="rounded-xl border-2 border-white px-7 py-4 font-black text-white transition hover:bg-white hover:text-blue-700"
            >
              {text.ctaPro}
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        id="contacto"
        className="border-t border-slate-200 bg-white px-5 py-12"
      >
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-2xl font-black text-blue-600"
            >
              RELYDO
            </button>

            <p className="mt-4 max-w-xs leading-7 text-slate-600">
              {text.footerDesc}
            </p>
          </div>

          <div>
            <h3 className="font-black">{text.footerPlataforma}</h3>
            <div className="mt-4 flex flex-col items-start gap-3 text-slate-600">
              <button onClick={() => router.push("/")}>
                {text.footerInicio}
              </button>
              <button onClick={() => router.push("/servicios")}>
                {text.footerServicios}
              </button>
              <button onClick={() => router.push("/profesionales")}>
                {text.footerProfesionales}
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-black">{text.footerCuenta}</h3>
            <div className="mt-4 flex flex-col items-start gap-3 text-slate-600">
              <button onClick={() => router.push("/login-cliente")}>
                {text.footerLogin}
              </button>
              <button onClick={() => router.push("/registro-cliente")}>
                {text.footerCliente}
              </button>
              <button onClick={() => router.push("/registro-profesional")}>
                {text.footerPro}
              </button>
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

        <div className="mx-auto mt-10 max-w-7xl border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} RELYDO. {text.derechos}
        </div>
      </footer>
    </main>
  );
}