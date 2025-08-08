import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";

export type ModelOption = { value: string; label: string };

type ModelSelectCardProps = {
  id: string;
  title: string;
  description: string;
  selected: string;
  onChange: (value: string) => void;
  options: ModelOption[];
};

export function ModelSelectCard(props: ModelSelectCardProps) {
  const { id, title, description, selected, onChange, options } = props;

  const selectedLabel =
    options.find((m) => m.value === selected)?.label ?? selected;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Label htmlFor={id}>Model</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                id={id}
                variant="outline"
                className="min-w-48 justify-between"
              >
                <span>{selectedLabel}</span>
                <ChevronDown className="size-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-48">
              <DropdownMenuRadioGroup value={selected} onValueChange={onChange}>
                {options.map((m) => (
                  <DropdownMenuRadioItem key={m.value} value={m.value}>
                    {m.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
