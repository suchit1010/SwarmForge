import { createFileRoute } from "@tanstack/react-router";
import { MissionBoard } from "@/components/gauntlet/mission-board";

export const Route = createFileRoute("/mission/$id")({
  component: MissionPage,
});

function MissionPage() {
  const { id } = Route.useParams();
  return <MissionBoard id={id} />;
}
