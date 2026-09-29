"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { adminApi } from "@/lib/admin/api";

/** N'accepte qu'un chemin interne à l'admin (pas de redirection ouverte vers un autre site). */
function safeNext(next: string | null) {
  return next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationFn: () => adminApi.login(email, password),
    onSuccess: (me) => {
      queryClient.setQueryData(["admin", "me"], me);
      router.replace(safeNext(searchParams.get("next")));
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        login.mutate();
      }}
    >
      <Field id="email" label="E-mail" required>
        {(a) => (
          <Input
            {...a}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        )}
      </Field>
      <Field id="password" label="Mot de passe" required>
        {(a) => (
          <Input
            {...a}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        )}
      </Field>

      {login.isError && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-lg bg-danger/8 p-3 text-sm font-medium text-danger"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {login.error.message}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={login.isPending}>
        {login.isPending ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <Lock aria-hidden="true" />
        )}
        Se connecter
      </Button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <Logo className="mx-auto h-12" priority />
        <h1 className="mt-6 mb-1 text-center text-xl font-semibold">Espace admin</h1>
        <p className="mb-6 text-center text-sm text-muted">Suivi des demandes de devis</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
