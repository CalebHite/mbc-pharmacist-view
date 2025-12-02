// app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  // Send anyone hitting "/" straight to the pharmacy overview
  redirect("/pharmacy");
}
