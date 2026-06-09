import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function GoogleButton({ label = "Войти через Google" }: { label?: string }) {
  const onClick = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) {
        toast.error("Не удалось войти через Google: " + error.message);
      }
      // Browser will redirect to Google — no further action needed.
    } catch (e) {
      toast.error("Ошибка входа через Google");
      console.error("[GoogleButton] signInWithOAuth failed", e);
    }
  };

  return (
    <Button type="button" variant="glass" size="lg" className="w-full" onClick={onClick}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.24 1.42-1.7 4.16-5.5 4.16-3.31 0-6-2.74-6-6.13s2.69-6.13 6-6.13c1.88 0 3.14.8 3.86 1.5l2.64-2.55C16.93 3.5 14.7 2.5 12 2.5 6.97 2.5 2.9 6.57 2.9 11.6S6.97 20.7 12 20.7c6.93 0 9.2-4.86 9.2-7.36 0-.5-.05-.88-.13-1.26H12z"
        />
      </svg>
      {label}
    </Button>
  );
}
