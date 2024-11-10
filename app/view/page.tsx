"use client"
import Viewer from "@/components/Replay";


export default function ViewPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">View Stream</h1>
      <Viewer />
    </div>
  );
}