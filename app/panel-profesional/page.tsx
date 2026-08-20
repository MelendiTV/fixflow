"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import NotificationsBell from "@/app/components/NotificationsBell";
import { AccountModeSwitcher } from "@/app/components/AccountModeSwitcher";
import { useAccountMode } from "@/app/components/AccountModeProvider";
import { useLanguage } from "@/app/components/LanguageProvider";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type ProviderProfile = {
  user_id: string;
  business_name: string | null;
  company_logo_url: string | null;
  bio: string | null;
  trade: string | null;
  years_experience: number | null;
  service_radius_miles: number | null;
  license_required: boolean | null;
  license_number: string | null;
  license_state: string | null;
  license_expiration: string | null;
  insured: boolean | null;
  insurance_company: string | null;
  insurance_expiration: string | null;
  bonded: boolean | null;
  verification_status: string | null;
  verified: boolean | null;
  active: boolean | null;
  average_rating: number | null;
  completed_jobs: number | null;
};

type TrabajoContratado = {
  id: string;
  title: string;
  description: string;
  city: string;
  state: string;
  zip_code: string;
  preferred_date: string | null;
  preferred_time: string | null;
  status: string;
  job_stage: string | null;
  customer_name: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
};

type OfertaAceptada = {
  request_id: string;
  price: number;
  arrival_minutes: number | null;
  estimated_job_minutes: number | null;
  message: string | null;
  status: string;
};

type PagoProfesional = {
  request_id: string;
  job_amount: number;
  provider_commission_percent: number;
  provider_commission_amount: number;
  provider_net_amount: number;
  platform_revenue_amount: number;
  currency: string;
  status: string;
};

type TrabajoConOferta = TrabajoContratado & {
  oferta: OfertaAceptada | null;
  pago: PagoProfesional | null;
};

type ReclamoProfesional = {
  id: string;
  request_id: string;
  provider_id: string;
  reason: string | null;
  description: string | null;
  status: string;
  resolution_notes: string | null;
  created_at: string;
};

type DocumentoProfesional = {
  id: string;
  user_id: string;
  document_type: string;
  file_path: string;
  status: string | null;
  rejection_reason: string | null;
  created_at: string | null;
  reviewed_at: string | null;
  expiration_date: string | null;
  approved_at: string | null;
  reviewed_by: string | null;
};

type SolicitudDocumentoProfesional = {
  id: string;
  provider_id: string;
  requested_by: string | null;
  request_type: string;
  document_type: string | null;
  message: string;
  status: string;
  requested_at: string;
  submitted_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

function nombreOficio(trade: string | null, language: "es" | "en") {
  const nombresEs: Record<string, string> = {
    plumbing: "Plomería",
    electrical: "Electricidad",
    hvac: "HVAC / Aire acondicionado",
    carpentry: "Carpintería",
    painting: "Pintura",
    landscaping: "Jardinería",
    cleaning: "Limpieza",
    moving: "Mudanzas",
    other: "Otros servicios",
  };

  const nombresEn: Record<string, string> = {
    plumbing: "Plumbing",
    electrical: "Electrical",
    hvac: "HVAC / Air conditioning",
    carpentry: "Carpentry",
    painting: "Painting",
    landscaping: "Landscaping",
    cleaning: "Cleaning",
    moving: "Moving",
    other: "Other services",
  };

  if (!trade) return language === "es" ? "No indicada" : "Not specified";
  return (language === "es" ? nombresEs : nombresEn)[trade] || trade;
}

function nombreEtapa(
  etapa: string | null,
  status: string,
  language: "es" | "en"
) {
  if (status === "completed") return language === "es" ? "Completado" : "Completed";
  if (status === "cancelled") return language === "es" ? "Cancelado" : "Cancelled";
  if (etapa === "on_the_way") return language === "es" ? "En camino" : "On the way";
  if (etapa === "arrived") return language === "es" ? "Ya llegó" : "Arrived";
  if (etapa === "working") return language === "es" ? "Trabajo iniciado" : "Work started";
  return language === "es" ? "Contratado" : "Hired";
}

function estiloEtapa(etapa: string | null, status: string) {
  if (status === "completed") return "bg-green-100 text-green-800";
  if (status === "cancelled") return "bg-red-100 text-red-800";
  if (etapa === "working") return "bg-amber-100 text-amber-800";
  if (etapa === "arrived") return "bg-purple-100 text-purple-800";
  if (etapa === "on_the_way") return "bg-blue-100 text-blue-800";
  return "bg-green-100 text-green-800";
}

function mostrarMinutos(minutos: number | null, language: "es" | "en") {
  if (minutos === null || minutos === undefined)
    return language === "es" ? "No indicado" : "Not specified";
  if (minutos < 60) return `${minutos} min`;

  const horas = Math.floor(minutos / 60);
  const restantes = minutos % 60;

  if (restantes === 0) {
    return language === "es"
      ? `${horas} ${horas === 1 ? "hora" : "horas"}`
      : `${horas} ${horas === 1 ? "hour" : "hours"}`;
  }

  return `${horas} h ${restantes} min`;
}

function formatearFecha(fecha: string | null, language: "es" | "en") {
  if (!fecha) return language === "es" ? "No disponible" : "Not available";

  return new Intl.DateTimeFormat(language === "es" ? "es-US" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(fecha));
}

export default function PanelProfesional() {
  const router = useRouter();
  const { setAccountRole } = useAccountMode();
  const { language } = useLanguage();
  const T = (es: string, en: string) => (language === "es" ? es : en);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [email, setEmail] = useState("");
  const [trabajosContratados, setTrabajosContratados] = useState<TrabajoConOferta[]>([]);
  const [reclamos, setReclamos] = useState<ReclamoProfesional[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoProfesional[]>([]);
  const [solicitudesDocumentos, setSolicitudesDocumentos] = useState<SolicitudDocumentoProfesional[]>([]);
  const [abriendoDocumento, setAbriendoDocumento] = useState<string | null>(null);
  const [archivosSolicitud, setArchivosSolicitud] = useState<Record<string, File | null>>({});
  const [enviandoSolicitud, setEnviandoSolicitud] = useState<string | null>(null);
  const [mensajeDocumentos, setMensajeDocumentos] = useState("");
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    cargarPanel();

    const channel = supabase
      .channel("panel-profesional-service-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_requests",
        },
        async (payload) => {
          console.log("Cambio detectado en service_requests:", payload);

          if (mounted) {
            await cargarPanel(false);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
        },
        async (payload) => {
          console.log("Cambio detectado en payments:", payload);

          if (mounted) {
            await cargarPanel(false);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "job_claims",
        },
        async (payload) => {
          console.log("Cambio detectado en job_claims:", payload);

          if (mounted) {
            await cargarPanel(false);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "provider_documents",
        },
        async () => {
          if (mounted) await cargarPanel(false);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "provider_document_requests",
        },
        async () => {
          if (mounted) await cargarPanel(false);
        }
      )
      .subscribe((status) => {
        console.log("Realtime panel profesional:", status);
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function cargarPanel(mostrarCarga = true) {
    if (mostrarCarga) {
      setLoading(true);
    } else {
      setActualizando(true);
    }

    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login-profesional");
        return;
      }

      setEmail(user.email || "");

      const { data: baseProfile, error: baseProfileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (baseProfileError || !baseProfile) {
        throw new Error(T("No se encontró tu cuenta en RELYDO.", "We could not find your RELYDO account."));
      }

      if (baseProfile.role === "admin") {
        router.replace("/admin");
        return;
      }

      if (baseProfile.role !== "provider") {
        await supabase.auth.signOut();
        router.replace("/login-profesional");
        return;
      }

      setAccountRole("provider");

      const { data: providerProfile, error: profileError } = await supabase
        .from("provider_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(
          `${T("No se pudo cargar tu perfil profesional", "We could not load your professional profile")}: ${profileError.message}`
        );
      }

      if (!providerProfile) {
        router.replace("/completar-perfil-profesional");
        return;
      }

      setProfile(providerProfile as ProviderProfile);

      const { data: documentosData, error: documentosError } = await supabase
        .from("provider_documents")
        .select(`
          id,
          user_id,
          document_type,
          file_path,
          status,
          rejection_reason,
          created_at,
          reviewed_at,
          expiration_date,
          approved_at,
          reviewed_by
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (documentosError) {
        console.error("Error cargando documentos del profesional:", documentosError);
        setDocumentos([]);
      } else {
        setDocumentos((documentosData || []) as DocumentoProfesional[]);
      }

      const { data: solicitudesDocsData, error: solicitudesDocsError } = await supabase
        .from("provider_document_requests")
        .select(`
          id,
          provider_id,
          requested_by,
          request_type,
          document_type,
          message,
          status,
          requested_at,
          submitted_at,
          completed_at,
          created_at,
          updated_at
        `)
        .eq("provider_id", user.id)
        .order("requested_at", { ascending: false });

      if (solicitudesDocsError) {
        console.error("Error cargando solicitudes de documentos:", solicitudesDocsError);
        setSolicitudesDocumentos([]);
      } else {
        setSolicitudesDocumentos((solicitudesDocsData || []) as SolicitudDocumentoProfesional[]);
      }

      const estaVerificado =
        providerProfile.verification_status === "verified" &&
        providerProfile.verified === true &&
        providerProfile.active === true;

      if (!estaVerificado) {
        setTrabajosContratados([]);
        setReclamos([]);
        return;
      }

      const { data: reclamosData, error: reclamosError } = await supabase
        .from("job_claims")
        .select(`
          id,
          request_id,
          provider_id,
          reason,
          description,
          status,
          resolution_notes,
          created_at
        `)
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });

      if (reclamosError) {
        console.error("Error cargando reclamos del profesional:", reclamosError);
        setReclamos([]);
      } else {
        setReclamos((reclamosData || []) as ReclamoProfesional[]);
      }

      const { data: trabajosData, error: trabajosError } = await supabase
        .from("service_requests")
        .select(`
          id,
          title,
          description,
          city,
          state,
          zip_code,
          preferred_date,
          preferred_time,
          status,
          job_stage,
          customer_name,
          cancellation_reason,
          cancelled_at,
          created_at
        `)
        .eq("preferred_provider_id", user.id)
        .in("status", ["in_progress", "completed", "cancelled"])
        .order("created_at", { ascending: false });

      if (trabajosError) {
        throw new Error(
          `${T("No se pudieron cargar tus trabajos", "We could not load your jobs")}: ${trabajosError.message}`
        );
      }

      const trabajosBase = (trabajosData || []) as TrabajoContratado[];

      if (trabajosBase.length === 0) {
        setTrabajosContratados([]);
        return;
      }

      const requestIds = trabajosBase.map((trabajo) => trabajo.id);

      const { data: ofertasData, error: ofertasError } = await supabase
        .from("offers")
        .select(`
          request_id,
          price,
          arrival_minutes,
          estimated_job_minutes,
          message,
          status
        `)
        .eq("professional_id", user.id)
        .in("request_id", requestIds);

      if (ofertasError) {
        console.error("Error cargando presupuestos:", ofertasError);
      }

      const ofertas = (ofertasData || []) as OfertaAceptada[];

      const { data: pagosData, error: pagosError } = await supabase
        .from("payments")
        .select(`
          request_id,
          job_amount,
          provider_commission_percent,
          provider_commission_amount,
          provider_net_amount,
          platform_revenue_amount,
          currency,
          status
        `)
        .eq("provider_id", user.id)
        .in("request_id", requestIds);

      if (pagosError) {
        console.error("Error cargando pagos del profesional:", pagosError);
      }

      const pagos = (pagosData || []) as PagoProfesional[];

      const combinados = trabajosBase.map((trabajo) => ({
        ...trabajo,
        oferta:
          ofertas.find((oferta) => oferta.request_id === trabajo.id) || null,
        pago:
          pagos.find((pago) => pago.request_id === trabajo.id) || null,
      }));

      setTrabajosContratados(combinados);
    } catch (err) {
      console.error("Error cargando panel:", err);

      setError(
        err instanceof Error ? err.message : T("Ocurrió un error inesperado.", "An unexpected error occurred.")
      );
    } finally {
      if (mostrarCarga) {
        setLoading(false);
      }

      setActualizando(false);
    }
  }

  async function subirLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !profile) return;

    setError("");

    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];

    if (!tiposPermitidos.includes(file.type)) {
      setError(T("El logo debe ser JPG, PNG o WEBP.", "The logo must be JPG, PNG, or WEBP."));
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(T("El logo no puede superar 5 MB.", "The logo cannot exceed 5 MB."));
      event.target.value = "";
      return;
    }

    setSubiendoLogo(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(T("Tu sesión ya no está disponible.", "Your session is no longer available."));
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const ruta = `${user.id}/company-logo-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("provider-logos")
        .upload(ruta, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`${T("No se pudo subir el logo", "We could not upload the logo")}: ${uploadError.message}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("provider-logos").getPublicUrl(ruta);

      const { error: updateError } = await supabase
        .from("provider_profiles")
        .update({
          company_logo_url: publicUrl,
        })
        .eq("user_id", user.id);

      if (updateError) {
        throw new Error(
          `${T("El logo subió, pero no se pudo guardar en el perfil", "The logo was uploaded, but it could not be saved to your profile")}: ${updateError.message}`
        );
      }

      setProfile((actual) =>
        actual
          ? {
              ...actual,
              company_logo_url: publicUrl,
            }
          : actual
      );
    } catch (err) {
      console.error("Error subiendo logo:", err);
      setError(
        err instanceof Error ? err.message : T("No se pudo subir el logo.", "We could not upload the logo.")
      );
    } finally {
      setSubiendoLogo(false);
      event.target.value = "";
    }
  }

  function irASeccion(id: string) {
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    window.location.href = "/login-profesional";
  }

  function nombreTipoDocumento(documentType: string | null) {
    if (!documentType) return T("Varios documentos", "Multiple documents");
    if (documentType === "license") return T("Licencia", "License");
    if (documentType === "insurance") return T("Seguro", "Insurance");
    if (documentType === "bond") return T("Bond / Fianza", "Bond");
    if (documentType === "other") return T("Otro documento", "Other document");
    return documentType;
  }

  function fechaCorta(fecha: string | null) {
    if (!fecha) return T("Sin registrar", "Not registered");
    return new Intl.DateTimeFormat(language === "es" ? "es-US" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(`${fecha}T12:00:00`));
  }

  function vencimientoDocumento(doc: DocumentoProfesional) {
    if (doc.expiration_date) return doc.expiration_date;
    if (doc.document_type === "license") return profile?.license_expiration || null;
    if (doc.document_type === "insurance") return profile?.insurance_expiration || null;
    return null;
  }

  function diasParaVencer(fecha: string | null) {
    if (!fecha) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vence = new Date(`${fecha}T12:00:00`);
    vence.setHours(0, 0, 0, 0);
    return Math.ceil((vence.getTime() - hoy.getTime()) / 86400000);
  }

  async function abrirDocumento(doc: DocumentoProfesional) {
    setError("");
    setAbriendoDocumento(doc.id);

    try {
      const { data, error: signedUrlError } = await supabase.storage
        .from("provider-documents")
        .createSignedUrl(doc.file_path, 60);

      if (signedUrlError || !data?.signedUrl) {
        throw new Error(
          signedUrlError?.message || T("No se pudo generar el enlace del documento.", "Could not generate the document link.")
        );
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : T("No se pudo abrir el documento.", "Could not open the document."));
    } finally {
      setAbriendoDocumento(null);
    }
  }

  function seleccionarArchivoSolicitud(solicitudId: string, file: File | null) {
    setError("");
    setMensajeDocumentos("");

    if (!file) {
      setArchivosSolicitud((actual) => ({ ...actual, [solicitudId]: null }));
      return;
    }

    const esImagen = file.type.startsWith("image/");
    const esPdf = file.type === "application/pdf";

    if (!esImagen && !esPdf) {
      setError(
        T(
          "El documento debe ser una imagen o un archivo PDF.",
          "The document must be an image or PDF file."
        )
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(
        T(
          "El documento no puede superar 10 MB.",
          "The document cannot exceed 10 MB."
        )
      );
      return;
    }

    setArchivosSolicitud((actual) => ({ ...actual, [solicitudId]: file }));
  }

  async function enviarDocumentoSolicitado(solicitud: SolicitudDocumentoProfesional) {
    const file = archivosSolicitud[solicitud.id];
    if (!file) {
      setError(T("Selecciona primero una foto o archivo.", "Select a photo or file first."));
      return;
    }

    setError("");
    setMensajeDocumentos("");
    setEnviandoSolicitud(solicitud.id);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(T("Tu sesión ya no está disponible.", "Your session is no longer available."));
      }

      const documentType = solicitud.document_type || "other";
      const extensionOriginal = file.name.split(".").pop()?.toLowerCase();
      const extension =
        extensionOriginal && /^[a-z0-9]{1,8}$/.test(extensionOriginal)
          ? extensionOriginal
          : file.type === "application/pdf"
          ? "pdf"
          : "jpg";

      const ruta = `${user.id}/${documentType}-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("provider-documents")
        .upload(ruta, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(
          `${T("No se pudo subir el documento", "Could not upload the document")}: ${uploadError.message}`
        );
      }

      const { error: insertError } = await supabase
        .from("provider_documents")
        .insert({
          user_id: user.id,
          document_type: documentType,
          file_path: ruta,
          status: "pending",
          rejection_reason: null,
        });

      if (insertError) {
        await supabase.storage.from("provider-documents").remove([ruta]);
        throw new Error(
          `${T("El archivo subió, pero no se pudo registrar", "The file uploaded, but could not be registered")}: ${insertError.message}`
        );
      }

      const ahora = new Date().toISOString();
      const { error: requestError } = await supabase
        .from("provider_document_requests")
        .update({
          status: "submitted",
          submitted_at: ahora,
          updated_at: ahora,
        })
        .eq("id", solicitud.id)
        .eq("provider_id", user.id);

      if (requestError) {
        throw new Error(
          `${T("El documento se guardó, pero no se pudo actualizar la solicitud", "The document was saved, but the request could not be updated")}: ${requestError.message}`
        );
      }

      setArchivosSolicitud((actual) => ({ ...actual, [solicitud.id]: null }));
      setMensajeDocumentos(
        T(
          "Documento enviado correctamente. RELYDO lo revisará y te notificará cuando termine la revisión.",
          "Document sent successfully. RELYDO will review it and notify you when the review is complete."
        )
      );

      await cargarPanel(false);
      irASeccion("documentacion-profesional");
    } catch (err) {
      console.error("Error enviando documento solicitado:", err);
      setError(
        err instanceof Error
          ? err.message
          : T("No se pudo enviar el documento.", "Could not send the document.")
      );
    } finally {
      setEnviandoSolicitud(null);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 shadow-lg">
          <p className="font-bold text-slate-700">
            {T("Cargando panel profesional...", "Loading professional dashboard...")}
          </p>
        </div>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-extrabold text-red-700">
            {T("No se pudo cargar el panel", "Could not load dashboard")}
          </h1>

          <p className="mt-4 text-slate-700">{error}</p>

          <button
            type="button"
            onClick={cerrarSesion}
            className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-700"
          >
            {T("Cerrar sesión", "Sign out")}
          </button>
        </div>
      </main>
    );
  }

  if (!profile) return null;

  const estaRechazado = profile.verification_status === "rejected";

  const estaSuspendido =
    profile.verification_status === "verified" &&
    profile.verified === true &&
    profile.active !== true;

  const estaVerificado =
    !estaRechazado &&
    profile.verification_status === "verified" &&
    profile.verified === true &&
    profile.active === true;

  function obtenerEstado() {
    if (estaRechazado) {
      return {
        titulo: T("Verificación rechazada", "Verification rejected"),
        descripcion: T(
          "Tu verificación necesita correcciones. Revisa o vuelve a enviar tus documentos.",
          "Your verification needs corrections. Review or resubmit your documents."
        ),
        estilo: "border-red-300 bg-red-50 text-red-900",
        badge: "bg-red-100 text-red-800",
        textoBadge: T("Rechazado", "Rejected"),
      };
    }

    if (estaSuspendido) {
      return {
        titulo: T("Cuenta suspendida", "Account suspended"),
        descripcion: T(
          "Tu cuenta profesional está temporalmente suspendida. No puedes acceder a nuevos trabajos mientras permanezca suspendida.",
          "Your professional account is temporarily suspended. You cannot access new jobs while it remains suspended."
        ),
        estilo: "border-red-300 bg-red-50 text-red-900",
        badge: "bg-red-100 text-red-800",
        textoBadge: T("Suspendido", "Suspended"),
      };
    }

    if (estaVerificado) {
      return {
        titulo: T("Verificado ✅", "Verified ✅"),
        descripcion: T(
          "Tu cuenta ha sido revisada y aprobada por RELYDO.",
          "Your account has been reviewed and approved by RELYDO."
        ),
        estilo: "border-green-300 bg-green-50 text-green-900",
        badge: "bg-green-100 text-green-800",
        textoBadge: T("Verificado", "Verified"),
      };
    }

    return {
      titulo: T("Pendiente de verificación", "Verification pending"),
      descripcion: T(
        "Tu cuenta todavía está pendiente de revisión.",
        "Your account is still pending review."
      ),
      estilo: "border-amber-300 bg-amber-50 text-amber-900",
      badge: "bg-amber-100 text-amber-800",
      textoBadge: T("Pendiente", "Pending"),
    };
  }

  const estado = obtenerEstado();

  const trabajosActivos = trabajosContratados.filter(
    (trabajo) => trabajo.status === "in_progress"
  );

  const trabajosCompletados = trabajosContratados.filter(
    (trabajo) => trabajo.status === "completed"
  );

  const trabajosCancelados = trabajosContratados.filter(
    (trabajo) => trabajo.status === "cancelled"
  );

  const reclamosActivos = reclamos.filter(
    (reclamo) =>
      reclamo.status === "open" ||
      reclamo.status === "reviewing" ||
      reclamo.status === "in_review"
  );

  const totalHistorial =
    trabajosActivos.length +
    trabajosCompletados.length +
    trabajosCancelados.length;

  const solicitudesDocsActivas = solicitudesDocumentos.filter((solicitud) =>
    ["pending", "open", "requested"].includes(solicitud.status)
  );

  const documentosRechazados = documentos.filter((doc) => doc.status === "rejected");
  const documentosVencidos = documentos.filter((doc) => {
    const dias = diasParaVencer(vencimientoDocumento(doc));
    return dias !== null && dias < 0;
  });
  const documentosPorVencer = documentos.filter((doc) => {
    const dias = diasParaVencer(vencimientoDocumento(doc));
    return dias !== null && dias >= 0 && dias <= 30;
  });

  const requiereAccionDocumental =
    solicitudesDocsActivas.length > 0 ||
    documentosRechazados.length > 0 ||
    documentosVencidos.length > 0;

  const estadoDocumentos = requiereAccionDocumental
    ? T("Acción", "Action")
    : documentosPorVencer.length > 0
    ? T("Por vencer", "Expiring")
    : T("Al día", "Up to date");

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <section className="relative z-30 overflow-visible rounded-[32px] border border-blue-500/20 bg-gradient-to-br from-blue-700 via-blue-700 to-indigo-700 text-white shadow-xl shadow-blue-900/10">
          <div className="relative px-7 py-8 md:px-10 md:py-10">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-24 left-10 h-52 w-52 rounded-full bg-cyan-300/10 blur-3xl" />

            <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-blue-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  {T("Panel profesional", "Professional dashboard")}
                </div>

                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-lg">
                    {profile.company_logo_url ? (
                      <img
                        src={profile.company_logo_url}
                        alt={`Logo de ${profile.business_name || "la compañía"}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-black text-white">
                        {(profile.business_name || "F").charAt(0).toUpperCase()}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={subiendoLogo}
                      onClick={() => logoInputRef.current?.click()}
                      className="absolute inset-x-0 bottom-0 bg-slate-950/75 px-2 py-1.5 text-[10px] font-black uppercase tracking-wide text-white opacity-0 transition group-hover:opacity-100 disabled:cursor-not-allowed"
                    >
                      {subiendoLogo ? T("Subiendo...", "Uploading...") : T("Cambiar logo", "Change logo")}
                    </button>
                  </div>

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={subirLogo}
                    className="hidden"
                  />

                  <div>
                    <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                      {profile.business_name || T("Profesional RELYDO", "RELYDO Professional")}
                    </h1>

                    <button
                      type="button"
                      disabled={subiendoLogo}
                      onClick={() => logoInputRef.current?.click()}
                      className="mt-2 text-sm font-bold text-blue-100 underline decoration-white/40 underline-offset-4 transition hover:text-white disabled:opacity-60"
                    >
                      {subiendoLogo
                        ? "Subiendo logo..."
                        : profile.company_logo_url
                        ? "Cambiar imagen de la compañía"
                        : "Añadir imagen de la compañía"}
                    </button>
                  </div>
                </div>

                <p className="mt-4 max-w-xl text-base leading-7 text-blue-100 md:text-lg">
                  {T("Administra tus oportunidades, trabajos activos, reputación y estado de cuenta desde un solo lugar.", "Manage your opportunities, active jobs, reputation, and account status from one place.")}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white">
                    {nombreOficio(profile.trade, language)}
                  </span>

                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white">
                    ⭐ {Number(profile.average_rating || 0).toFixed(1)}
                  </span>

                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white">
                    {profile.completed_jobs ?? 0} {T("trabajos completados", "completed jobs")}
                  </span>
                </div>
              </div>

              <div className="relative z-[100] flex items-start gap-3 md:items-center">
                <div className="relative z-[110]">
                  <NotificationsBell modo="profesional" />
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs font-black uppercase tracking-wide text-blue-200">
                    {T("Cuenta", "Account")}
                  </p>
                  <p className="mt-1 max-w-[220px] truncate text-sm font-bold text-white">
                    {email}
                  </p>

                  <div className="mt-3 rounded-xl bg-white/95 p-2 text-slate-900">
                    <AccountModeSwitcher />
                  </div>

                  <button
                    type="button"
                    onClick={cerrarSesion}
                    className="mt-3 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-black text-white transition hover:bg-white/20"
                  >
                    {T("Cerrar sesión", "Sign out")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RESUMEN */}

        <section className="relative z-10 mt-7">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                {T("Resumen", "Summary")}
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                {T("Tu actividad en RELYDO", "Your RELYDO activity")}
              </h2>

              <p className="mt-2 text-slate-600">
                {T("Una vista rápida de tus trabajos y reputación.", "A quick view of your jobs and reputation.")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => cargarPanel(false)}
              disabled={actualizando}
              className="w-fit rounded-xl border border-slate-300 bg-white px-5 py-3 font-black text-slate-800 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actualizando ? T("Actualizando...", "Updating...") : T("↻ Actualizar", "↻ Refresh")}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
            <ResumenCard
              titulo={T("Activos", "Active")}
              valor={String(trabajosActivos.length)}
              clase="text-blue-700"
              icono="⚡"
              fondo="bg-blue-50"
              onClick={() => irASeccion("trabajos-activos")}
            />

            <ResumenCard
              titulo={T("Completados", "Completed")}
              valor={String(profile.completed_jobs ?? trabajosCompletados.length)}
              clase="text-emerald-700"
              icono="✓"
              fondo="bg-emerald-50"
              onClick={() => irASeccion("trabajos-completados")}
            />

            <ResumenCard
              titulo={T("Cancelados", "Cancelled")}
              valor={String(trabajosCancelados.length)}
              clase="text-red-700"
              icono="×"
              fondo="bg-red-50"
              onClick={() => irASeccion("trabajos-cancelados")}
            />

            <ResumenCard
              titulo={T("Reclamos", "Claims")}
              valor={String(reclamosActivos.length)}
              clase="text-rose-700"
              icono="⚠"
              fondo="bg-rose-50"
              onClick={() => irASeccion("reclamos-profesional")}
            />

            <ResumenCard
              titulo={T("Calificación", "Rating")}
              valor={Number(profile.average_rating || 0).toFixed(1)}
              clase="text-amber-700"
              icono="★"
              fondo="bg-amber-50"
              onClick={() => irASeccion("perfil-profesional")}
            />

            <ResumenCard
              titulo={T("Historial", "History")}
              valor={String(totalHistorial)}
              clase="text-violet-700"
              icono="↺"
              fondo="bg-violet-50"
              onClick={() => irASeccion("historial-completo")}
            />

            <ResumenCard
              titulo={T("Documentos", "Documents")}
              valor={estadoDocumentos}
              clase={requiereAccionDocumental ? "text-red-700 text-xl" : documentosPorVencer.length > 0 ? "text-amber-700 text-xl" : "text-emerald-700 text-xl"}
              icono="📄"
              fondo={requiereAccionDocumental ? "bg-red-50" : documentosPorVencer.length > 0 ? "bg-amber-50" : "bg-emerald-50"}
              onClick={() => irASeccion("documentacion-profesional")}
            />
          </div>
        </section>

        {/* ALERTA TRABAJO ACTIVO */}

        {estaVerificado && trabajosActivos.length > 0 && (
          <section className="mt-6 rounded-3xl border border-blue-300 bg-blue-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-blue-700">
                  {T("Atención", "Attention")}
                </p>

                <h2 className="mt-1 text-xl font-extrabold text-blue-950">
                  {trabajosActivos.length === 1
                    ? "Tienes un trabajo activo"
                    : `Tienes ${trabajosActivos.length} trabajos activos`}
                </h2>

                <p className="mt-1 text-blue-800">
                  {T("Revisa el estado y mantenlo actualizado para que el cliente pueda seguir el servicio en vivo.", "Review the status and keep it updated so the customer can follow the service live.")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => irASeccion("trabajos-activos")}
                className="shrink-0 rounded-xl bg-blue-700 px-5 py-3 font-extrabold text-white transition hover:bg-blue-800"
              >
                {trabajosActivos.length === 1
                  ? "Ver trabajo activo"
                  : `Ver ${trabajosActivos.length} trabajos activos`}
              </button>
            </div>
          </section>
        )}

        {/* ESTADO */}

        <section className={`mt-6 rounded-3xl border p-7 shadow-sm ${estado.estilo}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide">
                {T("Estado de la cuenta", "Account status")}
              </p>

              <h2 className="mt-2 text-2xl font-extrabold">{estado.titulo}</h2>
              <p className="mt-2">{estado.descripcion}</p>
            </div>

            <span className={`w-fit rounded-full px-5 py-2 font-bold ${estado.badge}`}>
              {estado.textoBadge}
            </span>
          </div>
        </section>

        {/* DOCUMENTACIÓN PROFESIONAL */}

        <section
          id="documentacion-profesional"
          className={`mt-6 scroll-mt-6 overflow-hidden rounded-[30px] border bg-white shadow-sm ${
            requiereAccionDocumental
              ? "border-red-200"
              : documentosPorVencer.length > 0
              ? "border-amber-200"
              : "border-emerald-200"
          }`}
        >
          <div className="border-b border-slate-100 bg-slate-50/70 px-7 py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-700">
                  {T("Documentación y verificación", "Documents and verification")}
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  {T("Mis documentos", "My documents")}
                </h2>
                <p className="mt-2 text-slate-600">
                  {T(
                    "Consulta tus documentos, vencimientos y cualquier solicitud enviada por RELYDO.",
                    "Review your documents, expiration dates, and any request sent by RELYDO."
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/completar-verificacion")}
                className="w-fit rounded-xl bg-blue-700 px-5 py-3 font-black text-white transition hover:bg-blue-800"
              >
                {T("📤 Subir o renovar documentos", "📤 Upload or renew documents")}
              </button>
            </div>
          </div>

          <div className="p-7">
            {mensajeDocumentos && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="font-black text-emerald-900">
                  ✅ {T("Documento enviado", "Document sent")}
                </p>
                <p className="mt-1 text-sm leading-6 text-emerald-800">{mensajeDocumentos}</p>
              </div>
            )}

            {requiereAccionDocumental && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="font-black text-red-900">
                  ⚠️ {T("Necesitas realizar una acción", "Action required")}
                </p>
                <p className="mt-1 text-sm leading-6 text-red-800">
                  {T(
                    "RELYDO necesita que revises o actualices parte de tu documentación. Lee la solicitud de abajo y sube el documento correspondiente.",
                    "RELYDO needs you to review or update part of your documentation. Read the request below and upload the corresponding document."
                  )}
                </p>
              </div>
            )}

            {!requiereAccionDocumental && documentosPorVencer.length > 0 && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-black text-amber-900">
                  ⏳ {T("Documento próximo a vencer", "Document expiring soon")}
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  {T("Tienes documentación que vence dentro de los próximos 30 días.", "You have documentation expiring within the next 30 days.")}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
                {documentos.length} {T("documentos", "documents")}
              </span>
              {solicitudesDocsActivas.length > 0 && (
                <span className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-black text-red-800">
                  {solicitudesDocsActivas.length} {T("solicitud(es) activa(s)", "active request(s)")}
                </span>
              )}
            </div>

            {solicitudesDocsActivas.length > 0 && (
              <div className="mt-6">
                <h3 className="font-black text-slate-950">
                  {T("Solicitudes de RELYDO", "Requests from RELYDO")}
                </h3>
                <div className="mt-3 space-y-3">
                  {solicitudesDocsActivas.map((solicitud) => (
                    <div key={solicitud.id} className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-black text-amber-950">
                            {nombreTipoDocumento(solicitud.document_type)}
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-900">
                            {solicitud.message}
                          </p>
                          <p className="mt-3 text-xs font-semibold text-amber-700">
                            {T("Solicitado", "Requested")}: {formatearFecha(solicitud.requested_at, language)}
                          </p>
                        </div>
                        <span className="w-fit rounded-full bg-amber-200 px-3 py-1 text-xs font-black text-amber-900">
                          {T("Acción requerida", "Action required")}
                        </span>
                      </div>
                      <div className="mt-4">
                        <label className="inline-flex cursor-pointer items-center rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-amber-800">
                          📎 {T("Tomar foto o subir archivo", "Take photo or upload file")}
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            disabled={enviandoSolicitud === solicitud.id}
                            onChange={(event) => {
                              const file = event.target.files?.[0] || null;
                              seleccionarArchivoSolicitud(solicitud.id, file);
                              event.currentTarget.value = "";
                            }}
                          />
                        </label>

                        {archivosSolicitud[solicitud.id] && (
                          <div className="mt-3 rounded-xl border border-amber-200 bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-amber-700">
                              {T("Archivo seleccionado", "Selected file")}
                            </p>
                            <p className="mt-1 break-all text-sm font-bold text-slate-800">
                              {archivosSolicitud[solicitud.id]?.name}
                            </p>
                            <button
                              type="button"
                              disabled={enviandoSolicitud === solicitud.id}
                              onClick={() => enviarDocumentoSolicitado(solicitud)}
                              className="mt-3 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {enviandoSolicitud === solicitud.id
                                ? T("Enviando...", "Sending...")
                                : T("Enviar documento a RELYDO", "Send document to RELYDO")}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="font-black text-slate-950">
                {T("Documentos registrados", "Registered documents")}
              </h3>

              {documentos.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                  <p className="font-bold text-slate-700">
                    {T("Todavía no tienes documentos registrados.", "You do not have any registered documents yet.")}
                  </p>
                </div>
              ) : (
                <div className="mt-3 grid gap-4 lg:grid-cols-2">
                  {documentos.map((doc) => {
                    const vencimiento = vencimientoDocumento(doc);
                    const dias = diasParaVencer(vencimiento);
                    const vencido = dias !== null && dias < 0;
                    const porVencer = dias !== null && dias >= 0 && dias <= 30;
                    const rechazado = doc.status === "rejected";

                    return (
                      <article
                        key={doc.id}
                        className={`rounded-2xl border p-5 ${
                          rechazado || vencido
                            ? "border-red-200 bg-red-50/50"
                            : porVencer
                            ? "border-amber-200 bg-amber-50/50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-lg font-black text-slate-950">
                              {nombreTipoDocumento(doc.document_type)}
                            </p>
                            <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${
                              rechazado
                                ? "bg-red-100 text-red-800"
                                : doc.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {rechazado
                                ? T("Rechazado", "Rejected")
                                : doc.status === "approved"
                                ? T("Aprobado", "Approved")
                                : T("Pendiente", "Pending")}
                            </span>
                          </div>
                          <button
                            type="button"
                            disabled={abriendoDocumento === doc.id}
                            onClick={() => abrirDocumento(doc)}
                            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-black text-white hover:bg-slate-700 disabled:opacity-50"
                          >
                            {abriendoDocumento === doc.id ? T("Abriendo...", "Opening...") : T("Ver", "View")}
                          </button>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide text-slate-400">{T("Vencimiento", "Expiration")}</p>
                            <p className={`mt-1 font-bold ${vencido ? "text-red-700" : porVencer ? "text-amber-700" : "text-slate-800"}`}>
                              {vencimiento ? fechaCorta(vencimiento) : T("No aplica / sin registrar", "Not applicable / not registered")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide text-slate-400">{T("Aprobado", "Approved")}</p>
                            <p className="mt-1 font-bold text-slate-800">
                              {doc.approved_at ? formatearFecha(doc.approved_at, language) : T("Sin registrar", "Not registered")}
                            </p>
                          </div>
                        </div>

                        {doc.rejection_reason && (
                          <div className="mt-4 rounded-xl border border-red-200 bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-red-600">
                              {T("Motivo / acción necesaria", "Reason / required action")}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-red-800">{doc.rejection_reason}</p>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* VERIFICACIÓN */}

        {!estaVerificado && !estaSuspendido && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow">
            <h2 className="text-xl font-extrabold text-slate-900">
              {T("Verificación profesional", "Professional verification")}
            </h2>

            <p className="mt-2 text-slate-600">
              {estaRechazado
                ? "Tu verificación fue rechazada. Puedes corregir y volver a enviar tus documentos."
                : "Completa la verificación para comenzar a recibir trabajos."}
            </p>

            <button
              type="button"
              onClick={() => router.push("/completar-verificacion")}
              className={`mt-5 rounded-xl px-6 py-3 font-extrabold text-white ${
                estaRechazado
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-700 hover:bg-blue-800"
              }`}
            >
              {estaRechazado
                ? "Corregir verificación"
                : "Completar verificación"}
            </button>
          </section>
        )}

        {/* SUSPENDIDO */}

        {estaSuspendido && (
          <section className="mt-6 rounded-3xl border border-red-200 bg-white p-7 shadow">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-2xl">
                ⛔
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-red-900">
                  {T("Acceso a trabajos suspendido", "Job access suspended")}
                </h2>

                <p className="mt-2 leading-6 text-slate-600">
                  {T("Tu perfil continúa existiendo, pero mientras la cuenta esté suspendida no podrás recibir ni aceptar nuevos trabajos.", "Your profile still exists, but while your account is suspended you cannot receive or accept new jobs.")}
                </p>
              </div>
            </div>
          </section>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-5 font-medium text-red-700">
            {error}
          </div>
        )}

        {/* RECLAMOS */}

        {estaVerificado && (
          <section
            id="reclamos-profesional"
            className="mt-6 scroll-mt-6 rounded-3xl border border-rose-200 bg-white p-7 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-rose-700">
                  {T("Protección", "Protection")}
                </p>

                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                  {T("Mis reclamos", "My claims")}
                </h2>

                <p className="mt-2 text-slate-600">
                  {T("Revisa los reclamos relacionados con tus trabajos y entra al detalle para adjuntar fotos o videos.", "Review claims related to your jobs and open the details to attach photos or videos.")}
                </p>
              </div>

              <span className="w-fit rounded-full bg-rose-100 px-4 py-2 font-extrabold text-rose-800">
                {reclamosActivos.length} {T("activos", "active")}
              </span>
            </div>

            {reclamos.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="font-bold text-slate-700">
                  {T("No tienes reclamos registrados.", "You have no registered claims.")}
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {reclamos.map((reclamo) => {
                  const trabajoRelacionado = trabajosContratados.find(
                    (trabajo) => trabajo.id === reclamo.request_id
                  );

                  const activo =
                    reclamo.status === "open" ||
                    reclamo.status === "reviewing" ||
                    reclamo.status === "in_review";

                  return (
                    <button
                      key={reclamo.id}
                      type="button"
                      onClick={() => router.push(`/trabajos/${reclamo.request_id}`)}
                      className="flex w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-rose-300 hover:bg-rose-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-slate-900">
                            {trabajoRelacionado?.title || T("Trabajo con reclamo", "Job with claim")}
                          </p>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                              activo
                                ? "bg-rose-100 text-rose-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {reclamo.status === "open"
                              ? T("Abierto", "Open")
                              : reclamo.status === "reviewing" ||
                                reclamo.status === "in_review"
                              ? T("En revisión", "Under review")
                              : T("Resuelto", "Resolved")}
                          </span>
                        </div>

                        <p className="mt-2 font-bold text-slate-700">
                          {reclamo.reason || T("Reclamo del cliente", "Customer claim")}
                        </p>

                        {reclamo.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                            {reclamo.description}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black text-blue-700">
                          {T("Ver reclamo →", "View claim →")}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatearFecha(reclamo.created_at, language)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* PERFIL */}

        <section
          id="perfil-profesional"
          className="mt-6 scroll-mt-6 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/60 px-7 py-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-blue-700 shadow-lg shadow-blue-700/20">
                  {profile.company_logo_url ? (
                    <img
                      src={profile.company_logo_url}
                      alt={`Logo de ${profile.business_name || "la compañía"}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-black text-white">
                      {(profile.business_name || "F").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-blue-700">
                    {T("Perfil profesional", "Professional profile")}
                  </p>

                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                    {profile.business_name || T("Profesional RELYDO", "RELYDO Professional")}
                  </h2>

                  <p className="mt-1 font-bold text-slate-500">
                    {nombreOficio(profile.trade, language)}
                  </p>
                </div>
              </div>

              {estaVerificado && (
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] text-white">
                    ✓
                  </span>
                  {T("Profesional verificado", "Verified professional")}
                </span>
              )}
            </div>
          </div>

          <div className="p-7">
            {profile.bio && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  {T("Sobre tu negocio", "About your business")}
                </p>

                <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">
                  {profile.bio}
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DatoPerfil
                titulo={T("Especialidad", "Specialty")}
                valor={nombreOficio(profile.trade, language)}
                icono="🛠️"
              />

              <DatoPerfil
                titulo={T("Experiencia", "Experience")}
                valor={`${profile.years_experience ?? 0} ${T("años", "years")}`}
                icono="🏅"
              />

              <DatoPerfil
                titulo={T("Radio de servicio", "Service radius")}
                valor={`${profile.service_radius_miles ?? 0} ${T("millas", "miles")}`}
                icono="📍"
              />

              <DatoPerfil
                titulo={T("Trabajos completados", "Completed jobs")}
                valor={String(profile.completed_jobs ?? 0)}
                icono="✅"
              />

              <DatoPerfil
                titulo={T("Calificación", "Rating")}
                valor={`⭐ ${Number(profile.average_rating || 0).toFixed(1)}`}
                icono="⭐"
              />

              <DatoPerfil
                titulo={T("Cuenta", "Account")}
                valor={profile.active ? T("Activa", "Active") : T("Suspendida", "Suspended")}
                icono="🛡️"
              />
            </div>
          </div>
        </section>

        {/* OPORTUNIDADES */}

        <section className="mt-6 overflow-hidden rounded-[30px] border border-blue-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
                {T("Oportunidades", "Opportunities")}
              </p>

              <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                {T("Nuevos trabajos", "New jobs")}
              </h2>

              <p className="mt-2 text-slate-600">
                {T("Revisa nuevas solicitudes disponibles y envía tus presupuestos.", "Review available requests and send your quotes.")}
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
              🔎
            </div>
          </div>

          {estaVerificado ? (
            <button
              type="button"
              onClick={() => router.push("/trabajos")}
              className="mt-5 w-full rounded-2xl bg-blue-700 px-6 py-4 text-lg font-black text-white shadow-lg shadow-blue-700/15 transition hover:-translate-y-0.5 hover:bg-blue-800"
            >
              {T("Ver trabajos disponibles →", "View available jobs →")}
            </button>
          ) : (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
              {estaSuspendido
                ? "No puedes recibir nuevos trabajos mientras tu cuenta esté suspendida."
                : "Los trabajos estarán disponibles cuando tu cuenta quede verificada."}
            </div>
          )}
        </section>

        {/* ACTIVOS */}

        {estaVerificado && (
          <section
            id="trabajos-activos"
            className="mt-6 scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-green-700">
                  {T("Trabajo activo", "Active job")}
                </p>

                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                  {T("Trabajos en progreso", "Jobs in progress")}
                </h2>

                <p className="mt-2 text-slate-600">
                  {T("Controla desde aquí todos los trabajos que ya fueron contratados.", "Manage all jobs that have already been hired from here.")}
                </p>
              </div>

              {trabajosActivos.length > 0 && (
                <span className="w-fit rounded-full bg-green-100 px-4 py-2 font-extrabold text-green-800">
                  {trabajosActivos.length}
                </span>
              )}
            </div>

            {trabajosActivos.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="font-bold text-slate-700">
                  {T("No tienes trabajos en progreso.", "You have no jobs in progress.")}
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {trabajosActivos.map((trabajo) => (
                  <article
                    key={trabajo.id}
                    className="rounded-3xl border border-green-200 bg-green-50/40 p-6"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-extrabold text-green-800">
                            {T("En progreso", "In progress")}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-sm font-extrabold ${estiloEtapa(
                              trabajo.job_stage,
                              trabajo.status
                            )}`}
                          >
                            {nombreEtapa(trabajo.job_stage, trabajo.status, language)}
                          </span>
                        </div>

                        <h3 className="mt-3 text-2xl font-extrabold text-slate-900">
                          {trabajo.title}
                        </h3>

                        <p className="mt-2 text-slate-600">
                          {trabajo.description}
                        </p>
                      </div>

                      {trabajo.pago ? (
                        <div className="min-w-[230px] rounded-2xl border border-emerald-200 bg-white px-6 py-4 shadow-sm">
                          <p className="text-center text-sm font-bold text-emerald-700">
                            {T("Recibirás", "You’ll receive")}
                          </p>

                          <p className="mt-1 text-center text-3xl font-extrabold text-emerald-900">
                            ${Number(trabajo.pago.provider_net_amount).toFixed(2)}
                          </p>

                          <div className="mt-3 border-t border-slate-100 pt-3 text-xs">
                            <div className="flex items-center justify-between gap-4 text-slate-600">
                              <span>{T("Valor del servicio", "Service value")}</span>
                              <span className="font-bold text-slate-900">
                                ${Number(trabajo.pago.job_amount).toFixed(2)}
                              </span>
                            </div>

                            <div className="mt-1.5 flex items-center justify-between gap-4 text-slate-600">
                              <span>
                                {T("Tarifa RELYDO", "RELYDO fee")} ({Number(
                                  trabajo.pago.provider_commission_percent
                                ).toFixed(2)}%)
                              </span>
                              <span className="font-bold text-slate-900">
                                ${Number(
                                  trabajo.pago.provider_commission_amount
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : trabajo.oferta ? (
                        <div className="rounded-2xl bg-white px-6 py-4 text-center shadow-sm">
                          <p className="text-sm font-bold text-slate-500">
                            {T("Precio acordado", "Agreed price")}
                          </p>

                          <p className="mt-1 text-3xl font-extrabold text-slate-900">
                            ${Number(trabajo.oferta.price).toFixed(2)}
                          </p>

                          <p className="mt-2 text-xs font-semibold text-amber-700">
                            {T("Cálculo de tarifa pendiente", "Fee calculation pending")}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <InfoBox
                        titulo={T("Cliente", "Customer")}
                        valor={trabajo.customer_name || "Cliente RELYDO"}
                      />

                      <InfoBox
                        titulo={T("Ubicación", "Location")}
                        valor={`${trabajo.city}, ${trabajo.state} ${trabajo.zip_code}`}
                      />

                      <InfoBox
                        titulo={T("Fecha", "Date")}
                        valor={trabajo.preferred_date || T("Flexible", "Flexible")}
                      />

                      <InfoBox
                        titulo={T("Hora", "Time")}
                        valor={trabajo.preferred_time || T("Flexible", "Flexible")}
                      />
                    </div>

                    {trabajo.oferta && (
                      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <InfoBox
                          titulo={T("Tiempo estimado de llegada", "Estimated arrival time")}
                          valor={mostrarMinutos(trabajo.oferta.arrival_minutes, language)}
                          borde
                        />

                        <InfoBox
                          titulo={T("Duración estimada", "Estimated duration")}
                          valor={mostrarMinutos(
                            trabajo.oferta.estimated_job_minutes, language
                          )}
                          borde
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => router.push(`/trabajos/${trabajo.id}`)}
                      className="mt-5 w-full rounded-2xl bg-blue-700 px-6 py-4 text-lg font-black text-white shadow-lg shadow-blue-700/15 transition hover:-translate-y-0.5 hover:bg-blue-800"
                    >
                      {T("Ver trabajo y actualizar estado →", "View job and update status →")}
                    </button>

                    <p className="mt-3 text-center text-sm text-slate-500">
                      {T("Cambia el estado a En camino, Llegué, Trabajo iniciado o Completado.", "Change the status to On the way, Arrived, Work started, or Completed.")}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* COMPLETADOS */}

        {estaVerificado && trabajosCompletados.length > 0 && (
          <section
            id="trabajos-completados"
            className="mt-6 scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
                  Historial
                </p>

                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                  {T("Trabajos completados", "Completed jobs")}
                </h2>
              </div>

              <span className="rounded-full bg-blue-100 px-4 py-2 font-extrabold text-blue-800">
                {trabajosCompletados.length}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {trabajosCompletados.map((trabajo) => (
                <article
                  key={trabajo.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-extrabold text-green-800">
                        ✓ {T("Completado", "Completed")}
                      </span>

                      <h3 className="mt-3 text-xl font-extrabold text-slate-900">
                        {trabajo.title}
                      </h3>

                      <p className="mt-2 text-slate-600">
                        {trabajo.description}
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        {trabajo.city}, {trabajo.state} {trabajo.zip_code}
                      </p>
                    </div>

                    {trabajo.pago ? (
                      <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-right">
                        <p className="text-xs font-bold text-emerald-700">
                          {T("Tu ingreso neto", "Your net earnings")}
                        </p>

                        <p className="mt-1 text-xl font-black text-emerald-800">
                          ${Number(trabajo.pago.provider_net_amount).toFixed(2)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Valor ${Number(trabajo.pago.job_amount).toFixed(2)}
                          {" · "}
                          Tarifa ${Number(
                            trabajo.pago.provider_commission_amount
                          ).toFixed(2)}
                        </p>
                      </div>
                    ) : trabajo.oferta ? (
                      <div className="rounded-xl bg-white px-4 py-3 text-right">
                        <p className="text-xs font-bold text-slate-500">
                          {T("Precio acordado", "Agreed price")}
                        </p>

                        <p className="mt-1 text-xl font-black text-green-800">
                          ${Number(trabajo.oferta.price).toFixed(2)}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push(`/trabajos/${trabajo.id}`)}
                    className="mt-5 rounded-xl border-2 border-blue-700 px-5 py-3 font-extrabold text-blue-700 hover:bg-blue-50"
                  >
                    {T("Ver detalles", "View details")}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* CANCELADOS */}

        {estaVerificado && trabajosCancelados.length > 0 && (
          <section
            id="trabajos-cancelados"
            className="mt-6 scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-red-700">
                  Historial
                </p>

                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                  {T("Trabajos cancelados", "Cancelled jobs")}
                </h2>
              </div>

              <span className="rounded-full bg-red-100 px-4 py-2 font-extrabold text-red-800">
                {trabajosCancelados.length}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {trabajosCancelados.map((trabajo) => (
                <article
                  key={trabajo.id}
                  className="rounded-2xl border border-red-200 bg-red-50/40 p-6"
                >
                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-extrabold text-red-800">
                    ✕ {T("Cancelado", "Cancelled")}
                  </span>

                  <h3 className="mt-3 text-xl font-extrabold text-slate-900">
                    {trabajo.title}
                  </h3>

                  <p className="mt-2 text-slate-600">{trabajo.description}</p>

                  {trabajo.cancellation_reason && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-white p-4">
                      <p className="text-sm font-bold text-red-700">
                        {T("Motivo de cancelación", "Cancellation reason")}
                      </p>

                      <p className="mt-1 font-semibold text-slate-800">
                        {trabajo.cancellation_reason}
                      </p>

                      {trabajo.cancelled_at && (
                        <p className="mt-2 text-xs text-slate-500">
                          {formatearFecha(trabajo.cancelled_at, language)}
                        </p>
                      )}
                    </div>
                  )}

                  {trabajo.pago ? (
                    <div className="mt-3 rounded-xl border border-red-200 bg-white p-4">
                      <p className="text-sm font-bold text-red-800">
                        {T("Precio acordado", "Agreed price")}: ${Number(
                          trabajo.pago.job_amount
                        ).toFixed(2)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {T("El trabajo fue cancelado. El tratamiento de reembolsos y comisiones se definirá en la fase de cancelaciones del sistema de pagos.", "The job was cancelled. Refund and fee handling will be defined in the cancellation phase of the payment system.")}
                      </p>
                    </div>
                  ) : trabajo.oferta ? (
                    <p className="mt-3 font-bold text-red-800">
                      {T("Precio acordado", "Agreed price")}: ${Number(trabajo.oferta.price).toFixed(2)}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => router.push(`/trabajos/${trabajo.id}`)}
                    className="mt-5 rounded-xl border-2 border-red-600 px-5 py-3 font-extrabold text-red-700 hover:bg-red-50"
                  >
                    {T("Ver detalles", "View details")}
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* HISTORIAL COMPLETO */}

        {estaVerificado && (
          <section
            id="historial-completo"
            className="mt-6 scroll-mt-6 rounded-3xl border border-violet-200 bg-white p-7 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-violet-700">
                  {T("Historial completo", "Full history")}
                </p>

                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                  {T("Todos tus trabajos", "All your jobs")}
                </h2>

                <p className="mt-2 text-slate-600">
                  {T("Activos, completados y cancelados en una sola vista.", "Active, completed, and cancelled jobs in one view.")}
                </p>
              </div>

              <span className="w-fit rounded-full bg-violet-100 px-4 py-2 font-extrabold text-violet-800">
                {totalHistorial}
              </span>
            </div>

            {trabajosContratados.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="font-bold text-slate-700">
                  {T("Todavía no tienes trabajos en el historial.", "You don’t have any jobs in your history yet.")}
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {trabajosContratados.map((trabajo) => (
                  <button
                    key={trabajo.id}
                    type="button"
                    onClick={() => router.push(`/trabajos/${trabajo.id}`)}
                    className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-violet-300 hover:bg-violet-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-black text-slate-900">
                        {trabajo.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {trabajo.city}, {trabajo.state} · {formatearFecha(trabajo.created_at, language)}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-sm font-extrabold ${estiloEtapa(
                        trabajo.job_stage,
                        trabajo.status
                      )}`}
                    >
                      {nombreEtapa(trabajo.job_stage, trabajo.status, language)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </main>
  );
}

function ResumenCard({
  titulo,
  valor,
  clase,
  icono,
  fondo,
  onClick,
}: {
  titulo: string;
  valor: string;
  clase: string;
  icono: string;
  fondo: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-100"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-500 transition group-hover:text-slate-800">
          {titulo}
        </p>

        <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${fondo}`}>
          {icono}
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className={`text-3xl font-black tracking-tight ${clase}`}>
          {valor}
        </p>

        <span className="text-lg font-black text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600">
          →
        </span>
      </div>
    </button>
  );
}

function InfoBox({
  titulo,
  valor,
  borde = false,
}: {
  titulo: string;
  valor: string;
  borde?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl bg-white p-4 ${
        borde ? "border border-slate-200" : "border border-white"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {titulo}
      </p>
      <p className="mt-1.5 font-extrabold text-slate-900">{valor}</p>
    </div>
  );
}

function DatoPerfil({
  titulo,
  valor,
  icono,
}: {
  titulo: string;
  valor: string;
  icono: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
          {icono}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-500">{titulo}</p>
          <p className="mt-1 font-black text-slate-950">{valor}</p>
        </div>
      </div>
    </div>
  );
}