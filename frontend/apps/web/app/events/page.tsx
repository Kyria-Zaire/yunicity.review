import { redirect } from "next/navigation";

/** Agenda legacy — l’entrée produit principale est /sortir. */
export default function EventsPage() {
  redirect("/sortir");
}
