"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

const ADMIN_EMAIL = "info@melendivip.com";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

type ProviderProfile = {
  user_id: string;
  business_name: string | null;

  license_required: boolean | null;
  license_number: string | null;

  insured: boolean | null;
  insurance_company: string | null;

  bonded: boolean | null;

  verification_status: string | null;
  verified: boolean | null;
  active: boolean | null;
};

type DocumentType =
  | "license"
  | "insurance"
  | "bond"
  | "other";

export default function CompletarVerificacion() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [userId, setUserId] =
    useState<string | null>(null);

  const [email, setEmail] = useState("");

  const [profile, setProfile] =
    useState<ProviderProfile | null>(null);

  useEffect(() => {
    cargarUsuario();
  }, []);

  async function cargarUsuario() {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login-profesional");
      return;
    }

    const userEmail =
      user.email?.toLowerCase() || "";

    if (
      userEmail ===
      ADMIN_EMAIL.toLowerCase()
    ) {
      router.replace("/admin");
      return;
    }

    const {
      data: baseProfile,
      error: baseProfileError,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      baseProfileError ||
      !baseProfile
    ) {
      setError(
        "No se encontró tu cuenta en RELYDO."
      );
      setLoading(false);
      return;
    }

    if (baseProfile.role !== "provider") {
      router.replace("/");
      return;
    }

    const {
      data: providerProfile,
      error: providerError,
    } = await supabase
      .from("provider_profiles")
      .select(`
        user_id,
        business_name,
        license_required,
        license_number,
        insured,
        insurance_company,
        bonded,
        verification_status,
        verified,
        active
      `)
      .eq("user_id", user.id)
      .single();

    if (
      providerError ||
      !providerProfile
    ) {
      setError(
        "Tu perfil profesional todavía no está completo."
      );
      setLoading(false);
      return;
    }

    setUserId(user.id);
    setEmail(user.email || "");
    setProfile(providerProfile);

    setLoading(false);
  }

  function validarArchivo(
    file: File,
    nombre: string
  ) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        `${nombre}: solo se permiten archivos PDF, JPG o PNG.`
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `${nombre}: el archivo no puede superar 10 MB.`
      );
    }
  }

  async function subirDocumento(
    file: File,
    documentType: DocumentType
  ) {
    if (!userId) {
      throw new Error(
        "No hay un usuario autenticado."
      );
    }

    validarArchivo(
      file,
      documentType
    );

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() || "file";

    const uniqueId =
      crypto.randomUUID();

    const fileName =
      `${documentType}-${uniqueId}.${extension}`;

    /*
      La primera carpeta SIEMPRE es el UID.

      Esto coincide con las políticas RLS
      que configuramos en Storage.
    */

    const filePath =
      `${userId}/${fileName}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from("provider-documents")
      .upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          upsert: false,
        }
      );

    if (uploadError) {
      throw new Error(
        `No se pudo subir ${documentType}: ${uploadError.message}`
      );
    }

    const {
      error: documentError,
    } = await supabase
      .from("provider_documents")
      .insert({
        user_id: userId,
        document_type: documentType,
        file_path: filePath,
        status: "pending",
      });

    if (documentError) {
      throw new Error(
        `El archivo se subió, pero no pudo registrarse en la base de datos: ${documentError.message}`
      );
    }
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!profile || !userId) {
      setError(
        "No se pudo identificar tu perfil profesional."
      );
      return;
    }

    setError("");
    setMensaje("");
    setSubiendo(true);

    const form = e.currentTarget;
    const formData =
      new FormData(form);

    const licenseFile =
      formData.get("license_file") instanceof File
        ? (formData.get(
            "license_file"
          ) as File)
        : null;

    const insuranceFile =
      formData.get("insurance_file") instanceof File
        ? (formData.get(
            "insurance_file"
          ) as File)
        : null;

    const bondFile =
      formData.get("bond_file") instanceof File
        ? (formData.get(
            "bond_file"
          ) as File)
        : null;

    const otherFile =
      formData.get("other_file") instanceof File
        ? (formData.get(
            "other_file"
          ) as File)
        : null;

    const tieneLicencia =
      licenseFile &&
      licenseFile.size > 0;

    const tieneSeguro =
      insuranceFile &&
      insuranceFile.size > 0;

    const tieneBond =
      bondFile &&
      bondFile.size > 0;

    const tieneOtro =
      otherFile &&
      otherFile.size > 0;

    /*
      REQUISITOS SEGÚN EL PERFIL
    */

    if (
      profile.license_required &&
      !tieneLicencia
    ) {
      setError(
        "Tu perfil indica que necesitas licencia. Debes subir una copia de tu licencia."
      );
      setSubiendo(false);
      return;
    }

    if (
      profile.insured &&
      !tieneSeguro
    ) {
      setError(
        "Tu perfil indica que tienes seguro. Debes subir el comprobante de seguro."
      );
      setSubiendo(false);
      return;
    }

    if (
      profile.bonded &&
      !tieneBond
    ) {
      setError(
        "Tu perfil indica que tienes bond/fianza. Debes subir su comprobante."
      );
      setSubiendo(false);
      return;
    }

    /*
      RELYDO necesita al menos UN documento
      para verificar manualmente una cuenta.

      Si el profesional no requiere licencia,
      seguro ni bond, puede utilizar
      "Otro documento".
    */

    if (
      !tieneLicencia &&
      !tieneSeguro &&
      !tieneBond &&
      !tieneOtro
    ) {
      setError(
        "Debes subir al menos un documento para solicitar la verificación."
      );
      setSubiendo(false);
      return;
    }

    try {
      if (tieneLicencia) {
        await subirDocumento(
          licenseFile,
          "license"
        );
      }

      if (tieneSeguro) {
        await subirDocumento(
          insuranceFile,
          "insurance"
        );
      }

      if (tieneBond) {
        await subirDocumento(
          bondFile,
          "bond"
        );
      }

      if (tieneOtro) {
        await subirDocumento(
          otherFile,
          "other"
        );
      }

      /*
        SI ENVÍA O REENVÍA DOCUMENTOS:

        pending
        verified = false
        active = false

        Solo Admin podrá volver a activarlo
        al aprobar la verificación.
      */

      const {
        error: profileError,
      } = await supabase
        .from("provider_profiles")
        .update({
          verification_status:
            "pending",

          verified: false,

          active: false,
        })
        .eq(
          "user_id",
          userId
        );

      if (profileError) {
        throw new Error(
          `Los documentos se enviaron, pero no se pudo actualizar tu estado: ${profileError.message}`
        );
      }

      setProfile({
        ...profile,
        verification_status:
          "pending",
        verified: false,
        active: false,
      });

      form.reset();

      setMensaje(
        "Documentos enviados correctamente. Tu cuenta está pendiente de revisión."
      );
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Ocurrió un error inesperado."
        );
      }
    } finally {
      setSubiendo(false);
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();

    router.replace(
      "/login-profesional"
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="rounded-2xl bg-white px-8 py-7 shadow-lg">
          <p className="font-semibold text-slate-700">
            Comprobando sesión...
          </p>
        </div>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-extrabold text-red-700">
            No se pudo cargar la verificación
          </h1>

          <p className="mt-4 text-slate-700">
            {error}
          </p>

          <button
            type="button"
            onClick={cerrarSesion}
            className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 font-bold text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-3xl">

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

          {/* HEADER */}

          <div className="bg-blue-700 px-8 py-7 text-white">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

              <div>
                <div className="text-2xl font-black">
                  FixFlow
                </div>

                <h1 className="mt-2 text-3xl font-extrabold">
                  Completar verificación profesional
                </h1>

                <p className="mt-2 text-blue-100">
                  Sube tus documentos para solicitar la revisión de tu cuenta.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/panel-profesional"
                  )
                }
                className="w-fit rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
              >
                Volver al panel
              </button>

            </div>

          </div>

          <div className="p-8">

            {/* CUENTA */}

            <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">

              <p className="font-bold text-slate-900">
                Cuenta
              </p>

              <p className="mt-1 text-slate-700">
                {email}
              </p>

              {profile?.business_name && (
                <p className="mt-1 font-semibold text-slate-900">
                  {profile.business_name}
                </p>
              )}

            </div>

            {/* REQUISITOS */}

            <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">

              <h2 className="font-extrabold text-slate-900">
                Documentos requeridos
              </h2>

              <div className="mt-3 space-y-2 text-sm text-slate-700">

                <p>
                  Licencia:{" "}
                  <strong>
                    {profile?.license_required
                      ? "Requerida"
                      : "No requerida"}
                  </strong>
                </p>

                <p>
                  Seguro:{" "}
                  <strong>
                    {profile?.insured
                      ? "Requerido"
                      : "No requerido"}
                  </strong>
                </p>

                <p>
                  Bond/Fianza:{" "}
                  <strong>
                    {profile?.bonded
                      ? "Requerido"
                      : "No requerido"}
                  </strong>
                </p>

              </div>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-8"
            >

              {/* LICENCIA */}

              <section>

                <h2 className="mb-3 text-xl font-extrabold text-blue-700">
                  🪪 Licencia profesional
                </h2>

                <p className="mb-4 text-sm text-slate-600">
                  {profile?.license_required
                    ? "Este documento es obligatorio según la información de tu perfil."
                    : "Sube este documento si corresponde a tu actividad."}
                </p>

                <input
                  name="license_file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full rounded-xl border border-slate-300 bg-white p-4 text-slate-900"
                />

              </section>

              <div className="border-t border-slate-200" />

              {/* SEGURO */}

              <section>

                <h2 className="mb-3 text-xl font-extrabold text-blue-700">
                  🛡️ Seguro
                </h2>

                <p className="mb-4 text-sm text-slate-600">
                  {profile?.insured
                    ? "Tu perfil indica que tienes seguro. Debes subir un comprobante vigente."
                    : "Sube el comprobante si tienes seguro de responsabilidad."}
                </p>

                <input
                  name="insurance_file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full rounded-xl border border-slate-300 bg-white p-4 text-slate-900"
                />

              </section>

              <div className="border-t border-slate-200" />

              {/* BOND */}

              <section>

                <h2 className="mb-3 text-xl font-extrabold text-blue-700">
                  🛡️ Bond / Fianza
                </h2>

                <p className="mb-4 text-sm text-slate-600">
                  {profile?.bonded
                    ? "Tu perfil indica que tienes bond/fianza. Debes subir el comprobante."
                    : "Sube este documento si corresponde."}
                </p>

                <input
                  name="bond_file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full rounded-xl border border-slate-300 bg-white p-4 text-slate-900"
                />

              </section>

              <div className="border-t border-slate-200" />

              {/* OTRO */}

              <section>

                <h2 className="mb-3 text-xl font-extrabold text-blue-700">
                  📄 Otro documento de verificación
                </h2>

                <p className="mb-4 text-sm text-slate-600">
                  Si tu actividad no requiere licencia, seguro o bond, puedes enviar otro documento relacionado con tu negocio o actividad profesional para revisión.
                </p>

                <input
                  name="other_file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full rounded-xl border border-slate-300 bg-white p-4 text-slate-900"
                />

              </section>

              {/* AVISO */}

              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">

                <h3 className="font-extrabold text-amber-900">
                  Verificación requerida
                </h3>

                <p className="mt-2 text-sm leading-6 text-amber-800">
                  Enviar documentos no significa que la cuenta esté verificada. Hasta que FixFlow complete la revisión, el estado permanecerá pendiente.
                </p>

                <p className="mt-2 text-sm text-amber-800">
                  Formatos permitidos: PDF, JPG y PNG. Máximo 10 MB por archivo.
                </p>

              </div>

              {error && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-4 font-medium text-red-700">
                  {error}
                </div>
              )}

              {mensaje && (
                <div className="rounded-xl border border-green-300 bg-green-50 p-4 font-medium text-green-700">
                  {mensaje}
                </div>
              )}

              <button
                type="submit"
                disabled={subiendo}
                className="w-full rounded-xl bg-blue-700 px-6 py-4 text-lg font-extrabold text-white shadow-md transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {subiendo
                  ? "Subiendo documentos..."
                  : "Enviar documentos para verificación"}
              </button>

            </form>

          </div>

        </div>

      </div>
    </main>
  );
}
