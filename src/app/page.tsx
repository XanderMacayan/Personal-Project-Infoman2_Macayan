"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LibraryIcon, UserCheck, Search, Mail, ScanFace, ChevronRight, Lock } from "lucide-react";
import { PURPOSES, MOCK_USERS, LibraryVisitor } from "@/lib/mock-data";
import { useLibraryStore } from "@/hooks/use-library-store";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function VisitorTerminal() {
  const router = useRouter();
  const { toast } = useToast();
  const { addLog, visitors, isLoaded } = useLibraryStore();
  
  const [step, setStep] = useState<"identify" | "welcome">("identify");
  const [email, setEmail] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState<LibraryVisitor | null>(null);
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    const visitor = visitors.find(v => v.email.toLowerCase() === email.toLowerCase());
    
    if (visitor) {
      if (visitor.isBlocked) {
        toast({
          title: "Access Denied",
          description: "Your access to the library has been temporarily restricted. Please contact the librarian.",
          variant: "destructive"
        });
        return;
      }
      setSelectedVisitor(visitor);
      setStep("welcome");
    } else {
      toast({
        title: "Identification Failed",
        description: "Institutional email not recognized. Please try again or tap your RFID.",
        variant: "destructive"
      });
    }
  };

  const handleRfidSimulate = () => {
    // Simulate tapping RFID by picking a random non-blocked user
    const available = visitors.filter(v => !v.isBlocked);
    const randomVisitor = available[Math.floor(Math.random() * available.length)];
    setSelectedVisitor(randomVisitor);
    setStep("welcome");
  };

  const handleCompleteEntry = () => {
    if (!selectedPurpose) {
      toast({
        title: "Purpose Required",
        description: "Please select your primary reason for visiting today.",
        variant: "destructive"
      });
      return;
    }

    if (selectedVisitor) {
      addLog({
        visitorId: selectedVisitor.id,
        visitorName: selectedVisitor.name,
        college: selectedVisitor.college,
        date: format(new Date(), "yyyy-MM-dd"),
        time: format(new Date(), "HH:mm"),
        purpose: selectedPurpose,
        isEmployee: selectedVisitor.isEmployee
      });

      toast({
        title: "Entry Recorded",
        description: `Welcome to NEU Library, ${selectedVisitor.name.split(' ')[0]}!`,
      });

      // Reset
      setStep("identify");
      setEmail("");
      setSelectedVisitor(null);
      setSelectedPurpose("");
    }
  };

  const goToAdmin = () => {
    router.push("/admin/dashboard");
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Admin Quick Access */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="absolute top-4 right-4 text-muted-foreground hover:text-primary"
        onClick={goToAdmin}
      >
        <Lock className="w-4 h-4 mr-2" />
        Admin Portal
      </Button>

      {/* Decorative background elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" />

      <div className="w-full max-w-2xl z-10 space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary rounded-2xl shadow-xl shadow-primary/20">
              <LibraryIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            NEU Library Log
          </h1>
          <p className="text-lg text-muted-foreground">
            {format(currentTime, "EEEE, MMMM do, yyyy | h:mm:ss a")}
          </p>
        </div>

        {step === "identify" ? (
          <Card className="border-none shadow-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl flex items-center gap-2">
                <ScanFace className="w-6 h-6 text-primary" />
                Visitor Identification
              </CardTitle>
              <CardDescription>
                Tap your RFID or enter your institutional email to proceed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <form onSubmit={handleIdentify} className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="jcesperanza@neu.edu.ph" 
                    className="pl-10 h-12 text-lg border-2 focus-visible:ring-primary"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                  Verify Credentials
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-muted" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or tap your ID card</span>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <Button 
                  onClick={handleRfidSimulate}
                  variant="outline" 
                  className="w-full h-24 border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 flex flex-col gap-2 transition-all group"
                >
                  <ScanFace className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-primary font-medium">RFID Sensor Active</span>
                </Button>
                <p className="mt-4 text-xs text-muted-foreground text-center">
                  Place your NEU Student/Employee ID on the terminal's scanner.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                <UserCheck className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold text-primary">
                Welcome to NEU Library!
              </CardTitle>
              <p className="text-lg font-medium text-foreground mt-2">
                {selectedVisitor?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedVisitor?.college}
              </p>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-muted-foreground">
                  Select your purpose of visit:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PURPOSES.map((purpose) => (
                    <Button
                      key={purpose}
                      variant={selectedPurpose === purpose ? "default" : "outline"}
                      className={`h-14 justify-start text-left px-4 ${
                        selectedPurpose === purpose 
                          ? "bg-primary text-white border-primary" 
                          : "hover:border-primary hover:bg-primary/5"
                      }`}
                      onClick={() => setSelectedPurpose(purpose)}
                    >
                      <ChevronRight className={`mr-2 h-4 w-4 ${selectedPurpose === purpose ? "opacity-100" : "opacity-0"}`} />
                      {purpose}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="ghost" 
                  className="flex-1 h-12"
                  onClick={() => setStep("identify")}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-[2] h-12 bg-primary hover:bg-primary/90 text-lg font-semibold shadow-lg shadow-primary/20"
                  onClick={handleCompleteEntry}
                  disabled={!selectedPurpose}
                >
                  Confirm Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}