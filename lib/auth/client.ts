import { useRouter } from "next/navigation";

/**
 * Custom hook to handle user logout across client components.
 * Clears the server session via a Server Action, removes client-side cookies,
 * and redirects the user to the login page.
 */
export function useLogout() {
  const router = useRouter();

  const handleLogout = async () => {
    const { logoutAction } = await import("@/app/login/actions");
    await logoutAction();
    document.cookie = "system_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  return handleLogout;
}
