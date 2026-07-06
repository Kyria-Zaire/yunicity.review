"use client";

import { YunicityLogo } from "@/components/brand";
import { LoginFormFields } from "@/components/login/login-form-fields";
import { LOGIN_PAGE_TITLE } from "@yunicity/utils";

type LoginFormPanelProps = {
  error: string | null;
  validationMessage: string | null;
  isSubmitting: boolean;
  onSubmit: (values: { email: string; password: string }) => Promise<void>;
  registerHref?: string;
};

export function LoginFormPanel({
  error,
  validationMessage,
  isSubmitting,
  onSubmit,
  registerHref,
}: LoginFormPanelProps) {
  return (
    <div className="flex flex-col justify-center bg-white p-8 sm:p-10 lg:p-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex justify-center">
            <YunicityLogo size="xl" priority />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            {LOGIN_PAGE_TITLE}
          </h1>
        </div>

        <LoginFormFields
          error={error}
          validationMessage={validationMessage}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          registerHref={registerHref}
        />
      </div>
    </div>
  );
}
