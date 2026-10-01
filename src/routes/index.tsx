import { createFileRoute } from "@tanstack/react-router";
import { EditorApp } from "@/editor/EditorApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <EditorApp />;
}
