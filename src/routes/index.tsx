import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/gauntlet/landing";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Landing />;
}
