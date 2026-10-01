import { createFileRoute } from "@tanstack/react-router";
import { EditorApp } from "@/editor/EditorApp";

export const Route = createFileRoute("/play")({ component: Play });

function Play() {
  return <EditorApp autoPlay />;
}
