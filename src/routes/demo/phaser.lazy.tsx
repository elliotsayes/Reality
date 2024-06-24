import { DemoPhaserGame } from "@/features/render/test/components/DemoPhaserGame";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/demo/phaser")({
  component: DemoPhaserGame,
});
