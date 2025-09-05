import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function Home() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Toolkit</h1>
      <div>
        {/* TODO: fix toast description text color (too light) */}
        <Button
          variant="outline"
          onClick={() => toast(":3", { description: ":3" })}
        >
          Toast
        </Button>
      </div>
    </div>
  );
}
