"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function RegistroProfesional() {
  const router = useRouter();

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setMensaje("");
    setEnviando(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const legalName = String(
      formData.get("legal_name") || ""
    ).trim();

    const businessName = String(
      formData.get("business_name") || ""
    ).trim();

    const email = String(
      formData.get("email") || ""
    )
      .trim()
      .toLowerCase();

    const phone = String(
      formData.get("phone") || ""
    ).trim();

    const password = String(
      formData.get("password") || ""
    );

    const trade = String(
      formData.get("trade") || ""
    ).trim();

    const bio = String(
      formData.get("bio") || ""
    ).trim();

    const yearsExperience = Number(
      formData.get("years_experience") || 0
    );

    const serviceRadiusMiles = Number(
      formData.get("service_radius_miles") || 25
    );

    const city = String(
      formData.get("city") || ""
    ).trim();

    const state = String(
      formData.get("state") || ""
    )
      .trim()
      .toUpperCase();

    const zipCode = String(
      formData.get("zip_code") || ""
    ).trim();

    const licenseRequired =
      formData.get("license_required") === "yes";

    const licenseNumber = String(
      formData.get("license_number") || ""
    ).trim();

    const licenseState = String(
      formData.get("license_state") || ""
    )
      .trim()
      .toUpperCase();

    const licenseExpiration = String(
      formData.get("license_expiration") || ""
    ).trim();

    const insured =
      formData.get("insured") === "yes";

    const insuranceCompany = String(
      formData.get("insurance_company") || ""
    ).trim();

    const insuranceExpiration = String(
      formData.get("insurance_expiration") || ""
    ).trim();

    const bonded =
      formData.get("bonded") === "yes";

    /*
      VALIDACIONES
    */

    if (password.length < 8) {
      setError(
        "La contraseña debe tener al menos 8 caracteres."
      );
      setEnviando(false);
      return;
    }

    if (
      !legalName ||
      !businessName ||
      !email ||
      !phone ||
      !trade ||
      !bio ||
      !city ||
      !state ||
      !zipCode
    ) {
      setError(
        "Completa todos los campos obligatorios."
      );
      setEnviando(false);
      return;
    }

    if (
      yearsExperience < 0 ||
      !Number.isFinite(yearsExperience)
    ) {
      setError(
        "Los años de experiencia no son válidos."
      );
      setEnviando(false);
      return;
    }

    if (
      serviceRadiusMiles < 1 ||
      !Number.isFinite(serviceRadiusMiles)
    ) {
      setError(
        "El radio de servicio debe ser de al menos 1 milla."
      );
      setEnviando(false);
      return;
    }

    if (
      licenseRequired &&
      (!licenseNumber ||
        !licenseState)
    ) {
      setError(
        "Si tu trabajo requiere licencia, debes indicar el número y el estado que la emitió."
      );
      setEnviando(false);
      return;
    }

    if (
      insured &&
      !insuranceCompany
    ) {
      setError(
        "Si indicas que tienes seguro, escribe el nombre de la compañía aseguradora."
      );
      setEnviando(false);
      return;
    }

    try {
      /*
        IMPORTANTE:

        Aquí SOLO creamos el usuario de Auth.

        NO insertamos todavía en:
        profiles
        provider_profiles
        provider_documents

        porque con Confirm Email activado
        todavía puede no existir una sesión
        authenticated.
      */

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.signUp({
        email,
        password,

        options: {
          emailRedirectTo:
            `${window.location.origin}/login-profesional`,

          /*
            Guardamos temporalmente la información
            no sensible del registro.

            Después de confirmar email e iniciar
            sesión, la usaremos para crear las
            tablas reales del profesional.
          */

          data: {
            signup_type: "provider",

            legal_name: legalName,
            business_name: businessName,
            phone,

            trade,
            bio,

            years_experience:
              yearsExperience,

            service_radius_miles:
              serviceRadiusMiles,

            city,
            state,
            zip_code: zipCode,

            license_required:
              licenseRequired,

            license_number:
              licenseNumber || null,

            license_state:
              licenseState || null,

            license_expiration:
              licenseExpiration || null,

            insured,

            insurance_company:
              insuranceCompany || null,

            insurance_expiration:
              insuranceExpiration || null,

            bonded,
          },
        },
      });

      if (authError) {
        throw new Error(
          authError.message
        );
      }

      if (!authData.user) {
        throw new Error(
          "No se pudo crear la cuenta."
        );
      }

      form.reset();

      /*
        Si Confirm Email está activado,
        normalmente session será null.

        Eso es correcto.
      */

      if (!authData.session) {
        setMensaje(
          "Cuenta creada correctamente. Revisa tu correo y confirma tu email. Después inicia sesión para completar tu perfil y subir los documentos de verificación."
        );

        return;
      }

      /*
        Si en algún momento desactivamos
        Confirm Email y Supabase devuelve
        una sesión inmediatamente,
        podemos continuar al siguiente paso.
      */

      setMensaje(
        "Cuenta creada correctamente. Continúa para completar tu perfil profesional."
      );

      setTimeout(() => {
        router.replace(
          "/completar-perfil-profesional"
        );
      }, 1200);
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
      setEnviando(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  const labelClass =
    "mb-2 block text-sm font-bold text-slate-900";

  const sectionTitleClass =
    "mb-5 flex items-center gap-2 text-xl font-extrabold text-blue-700";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">

      <div className="mx-auto max-w-6xl">

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

          {/* HEADER */}

          <div className="bg-blue-700 px-8 py-7 text-white">

            <div className="flex flex-col gap-2">

              <div className="text-2xl font-black tracking-tight">
                FixFlow
              </div>

              <h1 className="text-3xl font-extrabold md:text-4xl">
                Registrarse como profesional
              </h1>

              <p className="text-base text-blue-100">
                Crea tu cuenta. Después de confirmar tu correo podrás completar la verificación.
              </p>

            </div>

          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 md:p-8"
          >

            <div className="grid gap-8 lg:grid-cols-2">

              {/* IZQUIERDA */}

              <div className="space-y-8">

                {/* CUENTA */}

                <section>

                  <h2 className={sectionTitleClass}>
                    <span>👤</span>
                    Información de la cuenta
                  </h2>

                  <div className="space-y-5">

                    <div>
                      <label className={labelClass}>
                        Nombre legal completo *
                      </label>

                      <input
                        name="legal_name"
                        required
                        type="text"
                        autoComplete="name"
                        placeholder="Ej: Carlos Rodríguez"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Nombre del negocio *
                      </label>

                      <input
                        name="business_name"
                        required
                        type="text"
                        placeholder="Ej: Carlos Plumbing LLC"
                        className={inputClass}
                      />
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">

                      <div>

                        <label className={labelClass}>
                          Email *
                        </label>

                        <input
                          name="email"
                          required
                          type="email"
                          autoComplete="email"
                          placeholder="tu@email.com"
                          className={inputClass}
                        />

                      </div>

                      <div>

                        <label className={labelClass}>
                          Teléfono *
                        </label>

                        <input
                          name="phone"
                          required
                          type="tel"
                          autoComplete="tel"
                          placeholder="(702) 555-1234"
                          className={inputClass}
                        />

                      </div>

                    </div>

                    <div>

                      <label className={labelClass}>
                        Contraseña *
                      </label>

                      <input
                        name="password"
                        required
                        type="password"
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="Mínimo 8 caracteres"
                        className={inputClass}
                      />

                    </div>

                  </div>

                </section>

                <div className="border-t border-slate-200" />

                {/* LICENCIA */}

                <section>

                  <h2 className={sectionTitleClass}>
                    <span>🪪</span>
                    Licencia profesional
                  </h2>

                  <div className="space-y-5">

                    <div>

                      <label className={labelClass}>
                        ¿Tu trabajo requiere licencia? *
                      </label>

                      <select
                        name="license_required"
                        required
                        className={inputClass}
                      >
                        <option value="">
                          Selecciona
                        </option>

                        <option value="yes">
                          Sí
                        </option>

                        <option value="no">
                          No
                        </option>
                      </select>

                    </div>

                    <div className="grid gap-5 md:grid-cols-2">

                      <div>

                        <label className={labelClass}>
                          Número de licencia
                        </label>

                        <input
                          name="license_number"
                          type="text"
                          placeholder="Ej: 012345"
                          className={inputClass}
                        />

                      </div>

                      <div>

                        <label className={labelClass}>
                          Estado que emitió la licencia
                        </label>

                        <input
                          name="license_state"
                          type="text"
                          maxLength={2}
                          placeholder="NV"
                          className={inputClass}
                        />

                      </div>

                    </div>

                    <div>

                      <label className={labelClass}>
                        Vencimiento de la licencia
                      </label>

                      <input
                        name="license_expiration"
                        type="date"
                        className={inputClass}
                      />

                    </div>

                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                      La copia de tu licencia se solicitará después de confirmar tu correo e iniciar sesión.
                    </div>

                  </div>

                </section>

                <div className="border-t border-slate-200" />

                {/* BOND */}

                <section>

                  <h2 className={sectionTitleClass}>
                    <span>🛡️</span>
                    Bond / Fianza
                  </h2>

                  <div>

                    <label className={labelClass}>
                      ¿Tienes bond o fianza comercial? *
                    </label>

                    <select
                      name="bonded"
                      required
                      className={inputClass}
                    >
                      <option value="">
                        Selecciona
                      </option>

                      <option value="yes">
                        Sí
                      </option>

                      <option value="no">
                        No
                      </option>
                    </select>

                  </div>

                </section>

              </div>

              {/* DERECHA */}

              <div className="space-y-8">

                {/* INFORMACIÓN PROFESIONAL */}

                <section>

                  <h2 className={sectionTitleClass}>
                    <span>💼</span>
                    Información profesional
                  </h2>

                  <div className="space-y-5">

                    <div>

                      <label className={labelClass}>
                        Profesión / especialidad *
                      </label>

                      <select
                        name="trade"
                        required
                        className={inputClass}
                      >

                        <option value="">
                          Selecciona una especialidad
                        </option>

                        <option value="plumbing">
                          Plomería
                        </option>

                        <option value="electrical">
                          Electricidad
                        </option>

                        <option value="hvac">
                          HVAC / Aire acondicionado
                        </option>

                        <option value="carpentry">
                          Carpintería
                        </option>

                        <option value="painting">
                          Pintura
                        </option>

                        <option value="landscaping">
                          Jardinería
                        </option>

                        <option value="cleaning">
                          Limpieza
                        </option>

                        <option value="moving">
                          Mudanzas
                        </option>

                        <option value="other">
                          Otro
                        </option>

                      </select>

                    </div>

                    <div>

                      <label className={labelClass}>
                        Sobre ti o tu negocio *
                      </label>

                      <textarea
                        name="bio"
                        required
                        rows={4}
                        placeholder="Describe tu experiencia, especialidades y trabajos que realizas."
                        className={inputClass}
                      />

                    </div>

                    <div className="grid gap-5 md:grid-cols-2">

                      <div>

                        <label className={labelClass}>
                          Años de experiencia *
                        </label>

                        <input
                          name="years_experience"
                          required
                          min="0"
                          type="number"
                          placeholder="5"
                          className={inputClass}
                        />

                      </div>

                      <div>

                        <label className={labelClass}>
                          Radio de servicio (millas) *
                        </label>

                        <input
                          name="service_radius_miles"
                          required
                          min="1"
                          type="number"
                          defaultValue="25"
                          className={inputClass}
                        />

                      </div>

                    </div>

                    <div className="grid gap-5 md:grid-cols-3">

                      <div>

                        <label className={labelClass}>
                          Ciudad *
                        </label>

                        <input
                          name="city"
                          required
                          placeholder="Las Vegas"
                          className={inputClass}
                        />

                      </div>

                      <div>

                        <label className={labelClass}>
                          Estado *
                        </label>

                        <input
                          name="state"
                          required
                          maxLength={2}
                          placeholder="NV"
                          className={inputClass}
                        />

                      </div>

                      <div>

                        <label className={labelClass}>
                          ZIP *
                        </label>

                        <input
                          name="zip_code"
                          required
                          placeholder="89101"
                          className={inputClass}
                        />

                      </div>

                    </div>

                  </div>

                </section>

                <div className="border-t border-slate-200" />

                {/* SEGURO */}

                <section>

                  <h2 className={sectionTitleClass}>
                    <span>🛡️</span>
                    Seguro
                  </h2>

                  <div className="space-y-5">

                    <div>

                      <label className={labelClass}>
                        ¿Tienes seguro de responsabilidad? *
                      </label>

                      <select
                        name="insured"
                        required
                        className={inputClass}
                      >

                        <option value="">
                          Selecciona
                        </option>

                        <option value="yes">
                          Sí
                        </option>

                        <option value="no">
                          No
                        </option>

                      </select>

                    </div>

                    <div>

                      <label className={labelClass}>
                        Compañía de seguros
                      </label>

                      <input
                        name="insurance_company"
                        type="text"
                        placeholder="Nombre de la aseguradora"
                        className={inputClass}
                      />

                    </div>

                    <div>

                      <label className={labelClass}>
                        Vencimiento del seguro
                      </label>

                      <input
                        name="insurance_expiration"
                        type="date"
                        className={inputClass}
                      />

                    </div>

                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                      Los comprobantes de seguro y bond se subirán después de confirmar tu email.
                    </div>

                  </div>

                </section>

                {/* AVISO */}

                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">

                  <div className="flex gap-3">

                    <div className="text-2xl">
                      ⚠️
                    </div>

                    <div>

                      <h3 className="font-extrabold text-amber-900">
                        Verificación requerida
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        Crear una cuenta no significa que FixFlow haya verificado al profesional. Después de confirmar tu correo deberás subir los documentos necesarios.
                      </p>

                    </div>

                  </div>

                </div>

                {/* ERROR */}

                {error && (
                  <div className="rounded-xl border border-red-300 bg-red-50 p-4 font-medium text-red-700">
                    {error}
                  </div>
                )}

                {/* SUCCESS */}

                {mensaje && (
                  <div className="rounded-xl border border-green-300 bg-green-50 p-4 font-medium text-green-700">
                    {mensaje}
                  </div>
                )}

                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
                  Al registrarte, confirmas que la información suministrada es correcta y aceptas el proceso de verificación de RELYDO.
                </div>

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full rounded-xl bg-blue-700 px-6 py-4 text-lg font-extrabold text-white shadow-md transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {enviando
                    ? "Creando cuenta..."
                    : "Crear cuenta profesional"}
                </button>

                <p className="text-center text-sm text-slate-600">
                  ¿Ya tienes cuenta?{" "}

                  <a
                    href="/login-profesional"
                    className="font-bold text-blue-700 hover:underline"
                  >
                    Inicia sesión
                  </a>
                </p>

              </div>

            </div>

          </form>

        </div>

      </div>

    </main>
  );
}
