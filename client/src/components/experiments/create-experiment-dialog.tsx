"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateExperiment } from "@/hooks/use-experiments";
import { Plus, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function CreateExperimentDialog() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [temperatures, setTemperatures] = useState("0.3, 0.7, 1.0");
  const [topP, setTopP] = useState("0.9, 1.0");
  
  // Progress state
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const createMutation = useCreateExperiment((event) => {
    // Handle progress events
    setProgressMessage(event.message);
    setProgressPercentage(event.progress.percentage);
    
    if (event.type === 'complete') {
      setIsComplete(true);
      handleClose();
    }
  });

  const handleClose = () => {
    setOpen(false);
    // Reset form and progress
    setTimeout(() => {
      setPrompt("");
      setTemperatures("0.3, 0.7, 1.0");
      setTopP("0.9, 1.0");
      setProgressMessage("");
      setProgressPercentage(0);
      setIsComplete(false);
    }, 300);
  };

  const validateForm = () => {
    // Validate prompt
    if (!prompt.trim()) {
      throw new Error("Please enter a prompt for your experiment.");
    }

    if (prompt.trim().length < 10) {
      throw new Error("Prompt must be at least 10 characters long.");
    }

    // Parse and validate temperatures
    const tempArray = temperatures
      .split(",")
      .map(t => t.trim())
      .filter(t => t !== "");

    if (tempArray.length === 0) {
      throw new Error("Please provide at least one temperature value.");
    }

    if (tempArray.length > 5) {
      throw new Error("Maximum 5 temperature values allowed.");
    }

    const parsedTemps = tempArray.map(t => parseFloat(t));
    
    if (parsedTemps.some(t => isNaN(t))) {
      throw new Error("All temperature values must be valid numbers.");
    }

    if (parsedTemps.some(t => t < 0 || t > 2)) {
      throw new Error("Temperature values must be between 0 and 2.");
    }

    // Parse and validate top-P
    const topPArray = topP
      .split(",")
      .map(t => t.trim())
      .filter(t => t !== "");

    if (topPArray.length === 0) {
      throw new Error("Please provide at least one Top-P value.");
    }

    if (topPArray.length > 5) {
      throw new Error("Maximum 5 Top-P values allowed.");
    }

    const parsedTopP = topPArray.map(t => parseFloat(t));
    
    if (parsedTopP.some(t => isNaN(t))) {
      throw new Error("All Top-P values must be valid numbers.");
    }

    if (parsedTopP.some(t => t < 0 || t > 1)) {
      throw new Error("Top-P values must be between 0 and 1.");
    }

    return { tempArray: parsedTemps, topPArray: parsedTopP };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate form before making API call
      const { tempArray, topPArray } = validateForm();
      
      await createMutation.mutateAsync({
        prompt,
        parameterRanges: {
          temperatures: tempArray,
          topP: topPArray,
        },
      });
    } catch (error) {
      console.error("Error creating experiment:", error);
      
      // Show toast for any error (validation or API)
      toast.error("Failed to create experiment", {
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
      
      // Reset progress on error
      setProgressMessage("");
      setProgressPercentage(0);
    }
  };

  const isCreating = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full md:w-auto">
          <Plus className="mr-2 h-5 w-5" />
          New Experiment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Experiment</DialogTitle>
            <DialogDescription>
              Create a new LLM experiment with different parameter combinations to compare responses.
            </DialogDescription>
          </DialogHeader>
          
          {!isCreating ? (
            <>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="prompt">Prompt</Label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Enter your prompt here..."
                    maxLength={500}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="temperatures">Temperatures</Label>
                  <Input
                    id="temperatures"
                    value={temperatures}
                    onChange={(e) => setTemperatures(e.target.value)}
                    placeholder="0.3, 0.7, 1.0"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated values between 0 and 2 (max 5 values)
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="topP">Top-P</Label>
                  <Input
                    id="topP"
                    value={topP}
                    onChange={(e) => setTopP(e.target.value)}
                    placeholder="0.9, 1.0"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated values between 0 and 1 (max 5 values)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Create Experiment
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="py-8 space-y-4">
              {/* Progress Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {isComplete ? "Complete!" : "Creating Experiment..."}
                  </span>
                  <span className="text-muted-foreground">{progressPercentage}%</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isComplete ? "bg-green-500" : "bg-primary"
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                
                {/* Progress Message */}
                <div className="flex items-center gap-2 min-h-[24px]">
                  {isComplete ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {progressMessage}
                      </p>
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">
                        {progressMessage}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Step Indicators */}
              <div className="grid grid-cols-4 gap-2 pt-4">
                {['Started', 'Processing', 'Generating', 'Complete'].map((step, idx) => {
                  const stepPercentage = ((idx + 1) / 4) * 100;
                  const isActive = progressPercentage >= stepPercentage - 1;
                  const isPast = progressPercentage > stepPercentage;
                  
                  return (
                    <div key={step} className="text-center space-y-1">
                      <div
                        className={`w-full h-1 rounded-full ${
                          isPast
                            ? "bg-green-500"
                            : isActive
                            ? "bg-primary"
                            : "bg-muted"
                        }`}
                      />
                      <p
                        className={`text-xs ${
                          isActive ? "text-foreground font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {step}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
