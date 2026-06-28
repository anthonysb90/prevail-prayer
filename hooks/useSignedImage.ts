import { useQuery } from "@tanstack/react-query";
import { signPrayerImage } from "@/lib/prayerImages";

/** Resolves a private storage path to a short-lived signed URL for display. */
export function useSignedImage(path: string | null | undefined) {
  return useQuery<string | null>({
    queryKey: ["signed-image", path],
    queryFn: () => (path ? signPrayerImage(path) : Promise.resolve(null)),
    enabled: !!path,
    staleTime: 50 * 60 * 1000, // refresh well before the 1h signed-URL expiry
  });
}
