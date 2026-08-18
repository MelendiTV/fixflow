"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  useSearchParams,
} from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type ProfesionalElegido = {
  user_id: string;
  business_name: string | null;
  trade: string | null;
};

type FotoSubida = {
  request_id: string;
  file_url: string;
};

type FotoSeleccionada = {
  id: string;
  file: File;
  preview: string;
};

function nombreOficio(
  trade: string | null
) {
  const oficios: Record<string, string> = {
    plumbing: "Plomería",
    electrical: "Electricidad",
    hvac: "HVAC / Aire acondicionado",
    carpentry: "Carpintería",
    painting: "Pintura",
    landscaping: "Jardinería",
    cleaning: "Limpieza",
    moving: "Mudanzas",
    handyman: "Handyman",
    "appliance-repair":
      "Reparación de electrodomésticos",
    other: "Otros servicios",
  };

  if (!trade) {
    return "Profesional";
  }

  return oficios[trade] || trade;
}

function SolicitarTrabajoContenido() {
  const searchParams =
    useSearchParams();

  const profesionalId =
    searchParams.get("profesional");

  const [enviado, setEnviado] =
    useState(false);

  const [enviando, setEnviando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    cargandoProfesional,
    setCargandoProfesional,
  ] = useState(false);

  const [
    profesional,
    setProfesional,
  ] =
    useState<ProfesionalElegido | null>(
      null
    );

  const [
    cantidadFotos,
    setCantidadFotos,
  ] = useState(0);

  const [
    fotosSeleccionadas,
    setFotosSeleccionadas,
  ] = useState<FotoSeleccionada[]>([]);

  useEffect(() => {
    if (profesionalId) {
      cargarProfesional(
        profesionalId
      );
    } else {
      setProfesional(null);
    }
  }, [profesionalId]);

  /*
    LIMPIAR PREVIEWS AL SALIR
  */

  useEffect(() => {
    return () => {
      fotosSeleccionadas.forEach(
        (foto) => {
          URL.revokeObjectURL(
            foto.preview
          );
        }
      );
    };
  }, []);

  async function cargarProfesional(
    userId: string
  ) {
    setCargandoProfesional(true);
    setError("");

    const {
      data,
      error: profesionalError,
    } = await supabase
      .from("provider_profiles")
      .select(`
        user_id,
        business_name,
        trade
      `)
      .eq(
        "user_id",
        userId
      )
      .eq(
        "verification_status",
        "verified"
      )
      .eq(
        "verified",
        true
      )
      .eq(
        "active",
        true
      )
      .maybeSingle();

    if (profesionalError) {
      console.error(
        "Error cargando profesional:",
        profesionalError
      );

      setError(
        "No pudimos verificar el profesional seleccionado."
      );

      setProfesional(null);
      setCargandoProfesional(false);

      return;
    }

    if (!data) {
      setError(
        "El profesional seleccionado ya no está disponible o no está verificado."
      );

      setProfesional(null);
      setCargandoProfesional(false);

      return;
    }

    setProfesional(data);
    setCargandoProfesional(false);
  }

  /*
    VALIDAR UNA FOTO
  */

  function validarFoto(
    file: File
  ) {
    const MAX_SIZE =
      10 * 1024 * 1024;

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      throw new Error(
        `"${file.name}" no es una imagen válida.`
      );
    }

    if (
      file.size >
      MAX_SIZE
    ) {
      throw new Error(
        `La imagen "${file.name}" supera el límite de 10 MB.`
      );
    }
  }

  /*
    AGREGAR FOTOS

    Permite:
    - escoger varias a la vez
    - agregar una después de otra
    - máximo 5
  */

  function agregarFotos(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const nuevas =
      Array.from(
        event.target.files || []
      );

    if (
      nuevas.length === 0
    ) {
      return;
    }

    setError("");

    try {
      nuevas.forEach(
        validarFoto
      );

      setFotosSeleccionadas(
        (actuales) => {
          const unicas =
            nuevas.filter(
              (file) =>
                !actuales.some(
                  (actual) =>
                    actual.file.name ===
                      file.name &&
                    actual.file.size ===
                      file.size &&
                    actual.file.lastModified ===
                      file.lastModified
                )
            );

          const disponibles =
            Math.max(
              0,
              5 - actuales.length
            );

          const permitidas =
            unicas.slice(
              0,
              disponibles
            );

          if (
            unicas.length >
            disponibles
          ) {
            setError(
              "Puedes seleccionar un máximo de 5 fotos."
            );
          }

          const nuevasConPreview =
            permitidas.map(
              (file) => ({
                id:
                  crypto.randomUUID(),
                file,
                preview:
                  URL.createObjectURL(
                    file
                  ),
              })
            );

          return [
            ...actuales,
            ...nuevasConPreview,
          ];
        }
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron agregar las fotos."
      );
    } finally {
      /*
        IMPORTANTE:
        permite volver a abrir el selector
        y agregar más imágenes sin reemplazar
        las anteriores.
      */
      event.target.value =
        "";
    }
  }

  function eliminarFoto(
    id: string
  ) {
    setFotosSeleccionadas(
      (actuales) => {
        const foto =
          actuales.find(
            (item) =>
              item.id === id
          );

        if (foto) {
          URL.revokeObjectURL(
            foto.preview
          );
        }

        return actuales.filter(
          (item) =>
            item.id !== id
        );
      }
    );
  }

  function limpiarFotos() {
    setFotosSeleccionadas(
      (actuales) => {
        actuales.forEach(
          (foto) => {
            URL.revokeObjectURL(
              foto.preview
            );
          }
        );

        return [];
      }
    );
  }

  function validarFotos(
    files: File[]
  ) {
    const MAX_FOTOS = 5;

    if (
      files.length >
      MAX_FOTOS
    ) {
      throw new Error(
        `Puedes subir un máximo de ${MAX_FOTOS} fotos.`
      );
    }

    files.forEach(
      validarFoto
    );
  }

  async function subirFotos(
    requestId: string,
    files: File[]
  ) {
    if (
      files.length === 0
    ) {
      return;
    }

    const fotosParaGuardar:
      FotoSubida[] = [];

    for (const file of files) {
      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      const nombreArchivo =
        `${crypto.randomUUID()}.${extension}`;

      const filePath =
        `${requestId}/${nombreArchivo}`;

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from("request-photos")
          .upload(
            filePath,
            file,
            {
              cacheControl:
                "3600",

              upsert: false,

              contentType:
                file.type,
            }
          );

      if (uploadError) {
        throw new Error(
          `La solicitud fue creada, pero hubo un problema subiendo "${file.name}": ${uploadError.message}`
        );
      }

      const {
        data:
          publicUrlData,
      } =
        supabase.storage
          .from("request-photos")
          .getPublicUrl(
            filePath
          );

      fotosParaGuardar.push(
        {
          request_id:
            requestId,

          file_url:
            publicUrlData.publicUrl,
        }
      );
    }

    const {
      error: photosError,
    } = await supabase
      .from("request_photos")
      .insert(
        fotosParaGuardar
      );

    if (photosError) {
      throw new Error(
        `Las fotos se subieron, pero no se pudieron asociar a la solicitud: ${photosError.message}`
      );
    }
  }

  function obtenerReturnUrl() {
    return profesionalId
      ? `/solicitar-trabajo?profesional=${profesionalId}`
      : "/solicitar-trabajo";
  }

  function irALoginCliente() {
    const returnUrl =
      obtenerReturnUrl();

    window.location.href =
      `/login-cliente?redirect=${encodeURIComponent(
        returnUrl
      )}`;
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setEnviando(true);
    setError("");

    const form =
      e.currentTarget;

    const formData =
      new FormData(form);

    const serviceSlug =
      String(
        formData.get(
          "service"
        ) || ""
      ).trim();

    const title =
      String(
        formData.get(
          "title"
        ) || ""
      ).trim();

    const description =
      String(
        formData.get(
          "description"
        ) || ""
      ).trim();

    const customerName =
      String(
        formData.get(
          "customer_name"
        ) || ""
      ).trim();

    const customerPhone =
      String(
        formData.get(
          "customer_phone"
        ) || ""
      ).trim();

    const customerEmail =
      String(
        formData.get(
          "customer_email"
        ) || ""
      )
        .trim()
        .toLowerCase();

    const addressLine1 =
      String(
        formData.get(
          "address_line1"
        ) || ""
      ).trim();

    const city =
      String(
        formData.get(
          "city"
        ) || ""
      ).trim();

    const state =
      String(
        formData.get(
          "state"
        ) || ""
      )
        .trim()
        .toUpperCase();

    const zipCode =
      String(
        formData.get(
          "zip_code"
        ) || ""
      ).trim();

    const preferredDate =
      String(
        formData.get(
          "preferred_date"
        ) || ""
      ).trim();

    const preferredTime =
      String(
        formData.get(
          "preferred_time"
        ) || ""
      ).trim();

    /*
      AHORA LAS FOTOS VIENEN DEL ESTADO,
      NO DEL INPUT DIRECTAMENTE.
    */

    const fotos =
      fotosSeleccionadas.map(
        (item) =>
          item.file
      );

    if (
      !serviceSlug ||
      !title ||
      !description ||
      !customerName ||
      !customerPhone ||
      !customerEmail ||
      !addressLine1 ||
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
      profesionalId &&
      !profesional
    ) {
      setError(
        "El profesional seleccionado no es válido o ya no está disponible."
      );

      setEnviando(false);

      return;
    }

    try {
      const {
        data: {
          user,
        },
        error:
          userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        irALoginCliente();
        return;
      }

      const {
        data:
          perfilCliente,
        error:
          perfilError,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

      if (perfilError) {
        throw new Error(
          `No pudimos verificar tu cuenta: ${perfilError.message}`
        );
      }

      if (!perfilCliente) {
        await supabase.auth.signOut();

        irALoginCliente();

        return;
      }

      if (
        perfilCliente.role !==
        "customer"
      ) {
        await supabase.auth.signOut();

        irALoginCliente();

        return;
      }

      const customerId =
        user.id;

      validarFotos(
        fotos
      );

      const {
        data: service,
        error:
          serviceError,
      } = await supabase
        .from("services")
        .select("id")
        .eq(
          "slug",
          serviceSlug
        )
        .eq(
          "active",
          true
        )
        .maybeSingle();

      if (
        serviceError ||
        !service
      ) {
        console.error(
          "Error buscando servicio:",
          serviceError
        );

        throw new Error(
          "No pudimos identificar el servicio seleccionado."
        );
      }

      const {
        data:
          nuevaSolicitud,
        error:
          insertError,
      } = await supabase
        .from(
          "service_requests"
        )
        .insert({
          customer_id:
            customerId,

          service_id:
            service.id,

          preferred_provider_id:
            profesional?.user_id ||
            null,

          title,

          description,

          customer_name:
            customerName,

          customer_phone:
            customerPhone,

          customer_email:
            customerEmail,

          address_line1:
            addressLine1,

          city,

          state,

          zip_code:
            zipCode,

          preferred_date:
            preferredDate ||
            null,

          preferred_time:
            preferredTime ||
            null,

          status:
            "open",
        })
        .select("id")
        .single();

      if (
        insertError ||
        !nuevaSolicitud
      ) {
        console.error(
          "Error guardando solicitud:",
          insertError
        );

        throw new Error(
          insertError?.message ||
            "No se pudo crear la solicitud."
        );
      }

      await subirFotos(
        nuevaSolicitud.id,
        fotos
      );

      /*
        AVISAR A PROFESIONALES POR PUSH

        La solicitud ya quedó creada.
        Si el Push falla, NO cancelamos
        ni dañamos la orden del cliente.
      */

      try {
        const {
          data: {
            session,
          },
        } =
          await supabase.auth.getSession();

        const accessToken =
          session?.access_token;

        if (accessToken) {
          const pushResponse =
            await fetch(
              "/api/push/new-job",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  Authorization:
                    `Bearer ${accessToken}`,
                },

                body:
                  JSON.stringify({
                    requestId:
                      nuevaSolicitud.id,
                  }),
              }
            );

          const pushResult =
            await pushResponse
              .json()
              .catch(() => null);

          if (!pushResponse.ok) {
            console.warn(
              "La solicitud se creó, pero el Push no pudo enviarse:",
              pushResult
            );
          } else {
            console.log(
              "Push nuevo trabajo:",
              pushResult
            );
          }
        } else {
          console.warn(
            "La solicitud se creó, pero no encontramos access token para enviar Push."
          );
        }
      } catch (pushError) {
        console.warn(
          "La solicitud se creó, pero ocurrió un error enviando Push:",
          pushError
        );
      }

      setCantidadFotos(
        fotos.length
      );

      limpiarFotos();

      setEnviado(true);

      form.reset();
    } catch (err) {
      console.error(
        err
      );

      if (
        err instanceof Error
      ) {
        setError(
          err.message
        );
      } else {
        setError(
          "Ocurrió un error inesperado."
        );
      }
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-6 py-10">

        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-xl">

          <div className="text-6xl">
            ✅
          </div>

          <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
            Solicitud enviada
          </h1>

          {profesional ? (
            <p className="mt-4 text-slate-600">
              Tu solicitud fue enviada con{" "}
              <strong>
                {profesional.business_name ||
                  "el profesional seleccionado"}
              </strong>{" "}
              como profesional preferido.
            </p>
          ) : (
            <>
              <p className="mt-4 text-slate-600">
                Hemos recibido tu solicitud.
              </p>

              <p className="mt-2 text-slate-600">
                Profesionales verificados podrán revisar el trabajo y enviarte sus ofertas.
              </p>
            </>
          )}

          {cantidadFotos >
            0 && (
            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
              📷{" "}
              {cantidadFotos ===
              1
                ? "1 foto fue subida correctamente."
                : `${cantidadFotos} fotos fueron subidas correctamente.`}
            </div>
          )}

          <a
            href="/mis-solicitudes"
            className="mt-8 inline-block rounded-xl bg-blue-700 px-8 py-3 font-bold text-white hover:bg-blue-800"
          >
            Ver mis solicitudes
          </a>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-12">

      <div className="mx-auto max-w-3xl">

        <div className="mb-8">

          <a
            href={
              profesionalId
                ? `/profesionales/${profesionalId}`
                : "/profesionales"
            }
            className="font-medium text-blue-700 hover:underline"
          >
            ← Volver
          </a>

        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

          {/* HEADER */}

          <div className="bg-blue-700 p-8 text-white">

            <div className="text-2xl font-black">
              FixFlow
            </div>

            <h1 className="mt-2 text-4xl font-extrabold">
              Solicitar trabajo
            </h1>

            <p className="mt-2 text-blue-100">
              Cuéntanos qué necesitas y encontraremos profesionales que puedan ayudarte.
            </p>

          </div>

          <div className="p-8">

            {cargandoProfesional && (
              <div className="mb-7 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <p className="font-bold text-blue-900">
                  Verificando profesional seleccionado...
                </p>
              </div>
            )}

            {profesional && (
              <div className="mb-7 rounded-2xl border border-green-200 bg-green-50 p-5">

                <p className="text-sm font-bold uppercase tracking-wide text-green-700">
                  Profesional preferido
                </p>

                <h2 className="mt-1 text-xl font-extrabold text-green-900">
                  {profesional.business_name ||
                    "Profesional RELYDO"}
                </h2>

                <p className="mt-1 text-green-800">
                  {nombreOficio(
                    profesional.trade
                  )}
                </p>

                <p className="mt-3 text-sm text-green-800">
                  ✓ Profesional verificado por RELYDO
                </p>

              </div>
            )}

            {error && (
              <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4">
                <p className="font-medium text-red-700">
                  {error}
                </p>
              </div>
            )}

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-6"
            >

              <div>

                <label className="mb-2 block font-bold text-slate-900">
                  Tipo de servicio *
                </label>

                <select
                  name="service"
                  required
                  defaultValue={
                    profesional?.trade ||
                    ""
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white p-4 text-slate-900"
                >

                  <option
                    value=""
                    disabled
                  >
                    Selecciona un servicio
                  </option>

                  <option value="plumbing">
                    Plomería
                  </option>

                  <option value="electrical">
                    Electricidad
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

                  <option value="hvac">
                    Aire acondicionado / HVAC
                  </option>

                  <option value="carpentry">
                    Carpintería
                  </option>

                  <option value="moving">
                    Mudanzas
                  </option>

                  <option value="appliance-repair">
                    Reparación de electrodomésticos
                  </option>

                  <option value="handyman">
                    Handyman
                  </option>

                  <option value="other">
                    Otros servicios
                  </option>

                </select>

              </div>

              <div>

                <label className="mb-2 block font-bold text-slate-900">
                  ¿Qué problema tienes? *
                </label>

                <input
                  name="title"
                  type="text"
                  required
                  placeholder="Ej: Tengo una fuga debajo del fregadero"
                  className="w-full rounded-xl border border-slate-300 p-4 text-slate-900"
                />

              </div>

              <div>

                <label className="mb-2 block font-bold text-slate-900">
                  Describe el trabajo *
                </label>

                <textarea
                  name="description"
                  required
                  rows={5}
                  placeholder="Explica con más detalle qué está pasando..."
                  className="w-full resize-none rounded-xl border border-slate-300 p-4 text-slate-900"
                />

              </div>

              {/* FOTOS MEJORADAS */}

              <div>

                <div className="flex items-end justify-between gap-3">
                  <div>
                    <label className="block font-bold text-slate-900">
                      Fotos del problema
                    </label>

                    <p className="mt-1 text-sm text-slate-500">
                      Puedes agregar una o varias fotos, hasta un máximo de 5.
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-sm font-black ${
                      fotosSeleccionadas.length >= 5
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {fotosSeleccionadas.length}/5
                  </span>
                </div>

                <label
                  className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center transition ${
                    fotosSeleccionadas.length >= 5
                      ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                      : "border-blue-300 bg-blue-50/50 hover:border-blue-500 hover:bg-blue-50"
                  }`}
                >
                  <div className="text-4xl">
                    📷
                  </div>

                  <p className="mt-3 font-extrabold text-slate-900">
                    {fotosSeleccionadas.length === 0
                      ? "Seleccionar fotos"
                      : "Agregar más fotos"}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    JPG, PNG, WEBP u otra imagen compatible · Máximo 10 MB por foto
                  </p>

                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={
                      fotosSeleccionadas.length >= 5
                    }
                    onChange={
                      agregarFotos
                    }
                    className="hidden"
                  />
                </label>

                {fotosSeleccionadas.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {fotosSeleccionadas.map(
                      (
                        foto,
                        index
                      ) => (
                        <div
                          key={
                            foto.id
                          }
                          className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                        >
                          <img
                            src={
                              foto.preview
                            }
                            alt={`Foto seleccionada ${
                              index + 1
                            }`}
                            className="h-36 w-full object-cover"
                          />

                          <div className="absolute inset-x-0 bottom-0 bg-slate-950/70 px-3 py-2 text-xs font-bold text-white">
                            Foto{" "}
                            {index + 1}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              eliminarFoto(
                                foto.id
                              )
                            }
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-black text-red-600 shadow-lg transition hover:bg-red-50"
                            aria-label={`Eliminar foto ${
                              index + 1
                            }`}
                          >
                            ×
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}

                {fotosSeleccionadas.length > 0 &&
                  fotosSeleccionadas.length < 5 && (
                    <p className="mt-3 text-sm font-medium text-blue-700">
                      Puedes volver a pulsar “Agregar más fotos” y seleccionar otras. Las anteriores no se perderán.
                    </p>
                  )}

                {fotosSeleccionadas.length === 5 && (
                  <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-800">
                    ✓ Has seleccionado el máximo de 5 fotos.
                  </div>
                )}

              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>

                  <label className="mb-2 block font-bold text-slate-900">
                    Nombre *
                  </label>

                  <input
                    name="customer_name"
                    type="text"
                    required
                    placeholder="Tu nombre"
                    className="w-full rounded-xl border border-slate-300 p-4 text-slate-900"
                  />

                </div>

                <div>

                  <label className="mb-2 block font-bold text-slate-900">
                    Teléfono *
                  </label>

                  <input
                    name="customer_phone"
                    type="tel"
                    required
                    placeholder="(702) 555-1234"
                    className="w-full rounded-xl border border-slate-300 p-4 text-slate-900"
                  />

                </div>

              </div>

              <div>

                <label className="mb-2 block font-bold text-slate-900">
                  Email *
                </label>

                <input
                  name="customer_email"
                  type="email"
                  required
                  placeholder="tu@email.com"
                  className="w-full rounded-xl border border-slate-300 p-4 text-slate-900"
                />

              </div>

              <div>

                <label className="mb-2 block font-bold text-slate-900">
                  Dirección *
                </label>

                <input
                  name="address_line1"
                  type="text"
                  required
                  placeholder="123 Main St"
                  className="w-full rounded-xl border border-slate-300 p-4 text-slate-900"
                />

              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                <div>

                  <label className="mb-2 block font-bold text-slate-900">
                    Ciudad *
                  </label>

                  <input
                    name="city"
                    type="text"
                    required
                    placeholder="Las Vegas"
                    className="w-full rounded-xl border border-slate-300 p-4 text-slate-900"
                  />

                </div>

                <div>

                  <label className="mb-2 block font-bold text-slate-900">
                    Estado *
                  </label>

                  <input
                    name="state"
                    type="text"
                    required
                    maxLength={2}
                    placeholder="NV"
                    className="w-full rounded-xl border border-slate-300 p-4 text-slate-900"
                  />

                </div>

                <div>

                  <label className="mb-2 block font-bold text-slate-900">
                    ZIP *
                  </label>

                  <input
                    name="zip_code"
                    type="text"
                    required
                    placeholder="89101"
                    className="w-full rounded-xl border border-slate-300 p-4 text-slate-900"
                  />

                </div>

              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>

                  <label className="mb-2 block font-bold text-slate-900">
                    Fecha preferida
                  </label>

                  <input
                    name="preferred_date"
                    type="date"
                    className="w-full rounded-xl border border-slate-300 bg-white p-4 text-slate-900"
                  />

                </div>

                <div>

                  <label className="mb-2 block font-bold text-slate-900">
                    Hora preferida
                  </label>

                  <input
                    name="preferred_time"
                    type="time"
                    className="w-full rounded-xl border border-slate-300 bg-white p-4 text-slate-900"
                  />

                </div>

              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">

                {profesional ? (
                  <p className="text-slate-800">
                    Esta solicitud se registrará con{" "}
                    <strong>
                      {profesional.business_name ||
                        "este profesional"}
                    </strong>{" "}
                    como tu profesional preferido.
                  </p>
                ) : (
                  <p className="text-slate-800">
                    Esta solicitud quedará abierta para que profesionales verificados puedan revisarla y enviarte sus ofertas.
                  </p>
                )}

              </div>

              <button
                type="submit"
                disabled={
                  enviando ||
                  cargandoProfesional
                }
                className="w-full rounded-xl bg-blue-700 py-4 text-lg font-extrabold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enviando
                  ? `Creando solicitud${
                      fotosSeleccionadas.length > 0
                        ? ` y subiendo ${fotosSeleccionadas.length} ${
                            fotosSeleccionadas.length === 1
                              ? "foto"
                              : "fotos"
                          }`
                        : ""
                    }...`
                  : "Enviar solicitud"}
              </button>

            </form>

          </div>

        </div>

      </div>

    </main>
  );
}

export default function SolicitarTrabajo() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-100 flex items-center justify-center">
          <p className="font-bold text-slate-700">
            Cargando...
          </p>
        </main>
      }
    >
      <SolicitarTrabajoContenido />
    </Suspense>
  );
}