"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import useToastStore from "@/app/store/toastStore";
import userApiStore from "@/app/store/userStore";

const inputCls =
  "w-full py-2.5 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-secondary text-heading disabled:bg-gray-50 disabled:cursor-not-allowed";
const labelCls = "text-sm font-medium text-heading";

export default function ClientInfoEditor() {
  const { showSuccess, showError } = useToastStore();
  const { fetchProfile } = userApiStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const fileRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    mode: "onSubmit",
    defaultValues: {
      name: "",
      lastname: "",
      username: "",
      age: "",
      phone: "",
      date_of_birth: "",
      street_address: "",
      apt_suite: "",
      city: "",
      state: "",
      zip_code: "",
      country: "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/users/me/profile", {
          credentials: "include",
        });
        if (!res.ok) {
          if (res.status === 401) {
            showError("Not signed in", "Please sign in again");
            window.location.href = "/auth/signin/";
            return;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (cancelled) return;
        const u = json.user || {};
        setAvatarUrl(u.profile_picture || null);
        setEmail(u.email || "");
        setEmailVerified(Boolean(u.is_email_verified));
        reset({
          name: u.name || "",
          lastname: u.lastname || "",
          username: u.username || "",
          age: u.age ?? "",
          phone: u.phone || "",
          date_of_birth: u.date_of_birth
            ? String(u.date_of_birth).slice(0, 10)
            : "",
          street_address: u.street_address || "",
          apt_suite: u.apt_suite || "",
          city: u.city || "",
          state: u.state || "",
          zip_code: u.zip_code || "",
          country: u.country || "",
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load";
        showError("Could not load profile", msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const body = {
        ...data,
        age:
          data.age === "" || data.age == null ? null : Number(data.age),
      };
      const res = await fetch("/api/users/me/profile", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const issueMsg =
          json?.issues && Array.isArray(json.issues) && json.issues[0]
            ? `${json.issues[0].path?.join(".") ?? "field"}: ${json.issues[0].message}`
            : json?.error || `HTTP ${res.status}`;
        showError("Save failed", issueMsg);
        return;
      }
      showSuccess("Profile saved", "Your details are up to date");
      // Refresh the navbar/user-aware bits.
      await fetchProfile().catch(() => null);
      // Reset isDirty without changing form values.
      reset(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      showError("Save failed", msg);
    } finally {
      setSaving(false);
    }
  };

  const onInvalid = (formErrors) => {
    const firstField = Object.keys(formErrors)[0];
    const fieldErr = formErrors[firstField];
    showError(
      "Please fix form errors",
      fieldErr?.message || `Check the "${firstField}" field`,
    );
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      showError("Invalid image", "JPG, JPEG, PNG only");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showError("Image too large", "Max 2 MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append("profile_picture", file);
      const res = await fetch("/api/users/me/avatar", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        showError(
          "Avatar upload failed",
          json?.message || `HTTP ${res.status}`,
        );
        return;
      }
      const newUrl = json?.data?.profile_picture || null;
      if (newUrl) setAvatarUrl(newUrl);
      showSuccess("Avatar updated", "Looking good");
      await fetchProfile().catch(() => null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      showError("Avatar upload failed", msg);
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-gray-500">Loading profile…</div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      className="flex flex-col gap-8"
    >
      {/* Heading */}
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl text-heading font-bold leading-tight">
            My Info
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Update your account details. These are visible only to you and
            freelancers you work with.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving || !isDirty}
          className="px-5 py-2.5 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary/90 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </header>

      {/* Avatar */}
      <section className="flex items-center gap-5 border border-gray-200 rounded-2xl p-5">
        <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-gray-400">?</span>
          )}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-heading">
            Profile picture
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            JPG, JPEG or PNG. Max 2 MB.
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <button
          type="button"
          disabled={uploadingAvatar}
          onClick={() => fileRef.current?.click()}
          className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:border-secondary disabled:opacity-60 cursor-pointer"
        >
          {uploadingAvatar ? "Uploading…" : avatarUrl ? "Replace" : "Upload"}
        </button>
      </section>

      {/* Personal info */}
      <section className="border border-gray-200 rounded-2xl p-5 lg:p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold text-heading">Personal information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Field
            label="First name"
            required
            error={errors.name?.message}
          >
            <input
              type="text"
              className={inputCls}
              {...register("name", {
                required: "First name required",
                minLength: { value: 2, message: "At least 2 characters" },
              })}
            />
          </Field>
          <Field label="Last name" error={errors.lastname?.message}>
            <input
              type="text"
              className={inputCls}
              {...register("lastname", {
                minLength: { value: 2, message: "At least 2 characters" },
              })}
            />
          </Field>
          <Field label="Username" error={errors.username?.message}>
            <input
              type="text"
              className={inputCls}
              {...register("username", {
                maxLength: { value: 255, message: "Too long" },
              })}
            />
          </Field>
          <Field
            label={
              <span className="flex items-center gap-2">
                Email
                {emailVerified ? (
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-green-600 bg-green-50 border border-green-100 rounded px-1.5 py-0.5">
                    Verified
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5">
                    Unverified
                  </span>
                )}
              </span>
            }
          >
            <input
              type="email"
              value={email}
              readOnly
              disabled
              className={inputCls}
            />
          </Field>
          <Field label="Phone number" error={errors.phone?.message}>
            <input
              type="tel"
              placeholder="+44 7…"
              className={inputCls}
              {...register("phone", {
                pattern: {
                  value: /^[+]?[0-9\s\-()]*$/,
                  message: "Digits, spaces, +, -, () only",
                },
              })}
            />
          </Field>
          <Field label="Age" error={errors.age?.message}>
            <input
              type="number"
              min={1}
              max={120}
              className={inputCls}
              {...register("age", {
                min: { value: 1, message: "Enter a valid age" },
                max: { value: 120, message: "Enter a valid age" },
              })}
            />
          </Field>
          <Field label="Date of birth">
            <input
              type="date"
              className={inputCls}
              {...register("date_of_birth")}
            />
          </Field>
        </div>
      </section>

      {/* Address */}
      <section className="border border-gray-200 rounded-2xl p-5 lg:p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold text-heading">Address</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Street address">
            <input
              type="text"
              className={inputCls}
              {...register("street_address")}
            />
          </Field>
          <Field label="Apt / Suite">
            <input
              type="text"
              className={inputCls}
              {...register("apt_suite")}
            />
          </Field>
          <Field label="City">
            <input type="text" className={inputCls} {...register("city")} />
          </Field>
          <Field label="State / Region">
            <input type="text" className={inputCls} {...register("state")} />
          </Field>
          <Field label="Country">
            <input type="text" className={inputCls} {...register("country")} />
          </Field>
          <Field label="Zip / Postcode">
            <input
              type="text"
              className={inputCls}
              {...register("zip_code")}
            />
          </Field>
        </div>
      </section>

      {/* Footer save */}
      <div className="flex justify-end pt-2 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving || !isDirty}
          className="px-6 py-2.5 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary/90 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelCls}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
