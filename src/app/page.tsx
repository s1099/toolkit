"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="p-6">
      <h1 className="mb-4 font-bold text-2xl">Toolkit</h1>
      <div>
        <Button
          onClick={() => toast(":3", { description: ":3" })}
          variant="outline"
        >
          Toast
        </Button>
      </div>
    </div>
  );
}
