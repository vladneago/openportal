import { redirect } from "next/navigation";

export default function HomePage() {
  // TODO: Check if user is authenticated, redirect accordingly
  redirect("/login");
}
