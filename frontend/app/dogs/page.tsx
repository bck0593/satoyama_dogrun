import { redirect } from "next/navigation";

export default function DogsRedirectPage() {
  redirect("/dog-registration");
}
