import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, GripVertical } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export interface Stage {
    id: string;
    label: string;
    color: string;
}

interface StageManagerProps {
    stages: Stage[];
    onChange: (stages: Stage[]) => void;
}

const COLORS = [
    { label: "Blue", value: "bg-blue-500" },
    { label: "Green", value: "bg-green-500" },
    { label: "Yellow", value: "bg-yellow-500" },
    { label: "Purple", value: "bg-purple-500" },
    { label: "Red", value: "bg-red-500" },
    { label: "Orange", value: "bg-orange-500" },
    { label: "Pink", value: "bg-pink-500" },
    { label: "Gray", value: "bg-gray-500" },
];

const StageManager = ({ stages, onChange }: StageManagerProps) => {
    const [newStageLabel, setNewStageLabel] = useState("");

    const handleAddStage = () => {
        if (!newStageLabel.trim()) return;

        const id = newStageLabel.toLowerCase().replace(/\s+/g, "-");
        const newStage: Stage = {
            id,
            label: newStageLabel,
            color: "bg-gray-500", // Default color
        };

        onChange([...stages, newStage]);
        setNewStageLabel("");
    };

    const handleRemoveStage = (index: number) => {
        const newStages = [...stages];
        newStages.splice(index, 1);
        onChange(newStages);
    };

    const handleColorChange = (index: number, color: string) => {
        const newStages = [...stages];
        newStages[index].color = color;
        onChange(newStages);
    };

    const handleLabelChange = (index: number, label: string) => {
        const newStages = [...stages];
        newStages[index].label = label;
        // Also update ID to match label if it hasn't been used yet? 
        // Better to keep ID stable if possible, but for simple usage let's just update label.
        onChange(newStages);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Pipeline Stages</Label>
                <div className="space-y-2">
                    {stages.map((stage, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-card">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                            <Input
                                value={stage.label}
                                onChange={(e) => handleLabelChange(index, e.target.value)}
                                className="h-8"
                            />
                            <Select
                                value={stage.color}
                                onValueChange={(value) => handleColorChange(index, value)}
                            >
                                <SelectTrigger className="w-[100px] h-8">
                                    <div className={`w-4 h-4 rounded-full ${stage.color} mr-2`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {COLORS.map((color) => (
                                        <SelectItem key={color.value} value={color.value}>
                                            <div className="flex items-center">
                                                <div className={`w-3 h-3 rounded-full ${color.value} mr-2`} />
                                                {color.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleRemoveStage(index)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-2">
                <Input
                    placeholder="New Stage Name (e.g. Technical Interview)"
                    value={newStageLabel}
                    onChange={(e) => setNewStageLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddStage()}
                />
                <Button type="button" onClick={handleAddStage} variant="secondary">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stage
                </Button>
            </div>
        </div>
    );
};

export default StageManager;
