"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Password field with an accessible show/hide toggle. */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<ComponentProps<typeof Input>, "type">>(function PasswordInput(
  props,
  ref,
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={visible ? "text" : "password"} className="h-11 pr-11" {...props} />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute right-1.5 top-1/2 -translate-y-1/2"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button>
    </div>
  );
});
