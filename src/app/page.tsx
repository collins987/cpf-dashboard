import { redirect } from "next/navigation";

/** Phase 5 Extended UI Enhancement §9.2: "/" redirects to the default tab. */
export default function Home() {
  redirect("/rukisha");
}
