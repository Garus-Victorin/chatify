import { redirect } from "next/navigation";

export default function AboutIndex() {
  redirect("/about/author");
}
