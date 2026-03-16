
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, UserCheck, Mail, ScanFace, Lock, Quote, Loader2, ShieldCheck, LayoutDashboard, Users, LogOut, ArrowLeft } from "lucide-react";
import { PURPOSES, LibraryVisitor } from "@/lib/mock-data";
import { useLibraryStore } from "@/hooks/use-library-store";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/firebase";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";

export default function VisitorTerminal() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { addLog, visitors, isLoaded, claimAdminStatus, revokeAdminStatus, isAdmin } = useLibraryStore();
  
  const [step, setStep] = useState<"identify" | "role-select" | "welcome">("identify");
  const [email, setEmail] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState<LibraryVisitor | null>(null);
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const libraryQuotes = [
    "A library is not a luxury but one of the necessities of life. — Henry Ward Beecher",
    "Everything you need for better future and success has already been written. — Jim Rohn",
    "The only thing that you absolutely have to know, is the location of the library. — Albert Einstein",
    "Books are a uniquely portable magic. — Stephen King"
  ];
  const [quote, setQuote] = useState("");

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    setQuote(libraryQuotes[Math.floor(Math.random() * libraryQuotes.length)]);
    if (auth) initiateAnonymousSignIn(auth);
    return () => clearInterval(timer);
  }, [auth]);

  const resetTerminal = () => {
    setStep("identify");
    setEmail("");
    setSelectedVisitor(null);
    setSelectedPurpose("");
    revokeAdminStatus();
  };

  const handleIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate identity check with institutional database
    setTimeout(() => {
      const visitor = visitors.find(v => v.email.toLowerCase() === email.toLowerCase());
      
      if (visitor) {
        if (visitor.isBlocked) {
          toast({
            title: "Access Denied",
            description: "Your access to the library has been restricted. Please contact the office.",
            variant: "destructive"
          });
          setIsProcessing(false);
          return;
        }

        setSelectedVisitor(visitor);

        // Logic for role switching based on institutional email
        if (visitor.email === "jcesperanza@neu.edu.ph") {
          setStep("role-select");
        } else if (visitor.email === "admin@neu.edu.ph") {
          claimAdminStatus();
          setStep("welcome");
        } else {
          revokeAdminStatus();
          setStep("welcome");
        }
      } else {
        toast({
          title: "Identification Failed",
          description: "Institutional email not recognized. Please try again or tap your RFID.",
          variant: "destructive"
        });
      }
      setIsProcessing(false);
    }, 600);
  };

  const handleRoleChoice = (role: "admin" | "student") => {
    if (role === "admin") {
      claimAdminStatus();
      toast({
        title: "Administrative Mode",
        description: "Librarian privileges granted for this session.",
      });
    } else {
      revokeAdminStatus();
      toast({
        title: "Student Mode",
        description: "Accessing terminal as a regular patron.",
      });
    }
    setStep("welcome");
  };

  const handleRfidSimulate = () => {
    const available = visitors.filter(v => !v.isBlocked);
    if (available.length === 0) return;
    const randomVisitor = available[Math.floor(Math.random() * available.length)];
    
    setSelectedVisitor(randomVisitor);
    setEmail(randomVisitor.email);

    if (randomVisitor.email === "jcesperanza@neu.edu.ph") {
      setStep("role-select");
    } else if (randomVisitor.email === "admin@neu.edu.ph") {
      claimAdminStatus();
      setStep("welcome");
    } else {
      revokeAdminStatus();
      setStep("welcome");
    }
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
        description: `Welcome back, ${selectedVisitor.name.split(' ')[0]}!`,
      });

      resetTerminal();
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground font-medium animate-pulse">Initializing Library Systems...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 relative overflow-hidden font-body">
      {isAdmin && (
        <Button 
          variant="default" 
          size="sm" 
          className="absolute top-4 right-4 bg-accent text-accent-foreground hover:bg-accent/90 z-50 font-bold shadow-md"
          onClick={() => router.push("/admin/dashboard")}
        >
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Go to Dashboard
        </Button>
      )}

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #1a365d 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-2xl z-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-5 bg-primary rounded-full shadow-2xl ring-8 ring-primary/10">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-6xl uppercase italic">
              NEU Library
            </h1>
            {currentTime && (
              <p className="text-xl font-medium text-muted-foreground/80 min-h-[1.75rem]">
                {format(currentTime, "MMMM do, yyyy • h:mm a")}
              </p>
            )}
          </div>
        </div>

        {step === "identify" && (
          <div className="space-y-6">
            <Card className="border-none shadow-xl border-t-4 border-t-accent bg-white/90 backdrop-blur-md">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                  <ScanFace className="w-6 h-6 text-accent" />
                  Patron Verification
                </CardTitle>
                <CardDescription className="text-base">
                  Identify yourself to access library resources.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleIdentify} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative group">
                      <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        placeholder="institutional.email@neu.edu.ph" 
                        className="pl-12 h-12 text-lg border-2 border-muted focus-visible:border-primary focus-visible:ring-0 rounded-xl"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/95 rounded-xl shadow-lg transition-transform active:scale-95"
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : "Proceed to Entry"}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-muted-foreground font-semibold">Digital RFID Access</span>
                  </div>
                </div>

                <Button 
                  onClick={handleRfidSimulate}
                  variant="outline" 
                  className="w-full h-20 border-2 border-dashed border-primary/20 hover:border-primary hover:bg-primary/5 rounded-xl flex flex-col gap-1 transition-all group"
                  disabled={isProcessing}
                >
                  <ScanFace className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-primary font-bold tracking-tight">Tap Student ID Card</span>
                </Button>
              </CardContent>
            </Card>

            <div className="text-center px-8 animate-in fade-in slide-in-from-bottom-2 duration-1000">
              <div className="flex items-start justify-center gap-2 text-muted-foreground italic">
                <Quote className="w-4 h-4 mt-1 flex-shrink-0 text-accent opacity-50" />
                <p className="text-sm max-w-md">{quote}</p>
              </div>
            </div>
          </div>
        )}

        {step === "role-select" && (
          <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-md animate-in zoom-in-95 duration-300">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold text-primary">Access Mode</CardTitle>
              <CardDescription className="text-base">
                Select how you want to access the library system for <strong>{email}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 gap-4">
                <Button 
                  className="h-20 text-lg font-bold flex flex-col items-center justify-center gap-1 bg-primary hover:bg-primary/90 rounded-xl"
                  onClick={() => handleRoleChoice("admin")}
                >
                  <LayoutDashboard className="w-6 h-6" />
                  <span>Librarian Access</span>
                </Button>
                <Button 
                  variant="outline"
                  className="h-20 text-lg font-bold flex flex-col items-center justify-center gap-1 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary rounded-xl"
                  onClick={() => handleRoleChoice("student")}
                >
                  <Users className="w-6 h-6" />
                  <span>Student Terminal</span>
                </Button>
              </div>
              <Button 
                variant="ghost" 
                className="w-full h-12 font-bold rounded-xl text-muted-foreground hover:text-destructive" 
                onClick={resetTerminal}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Switch to Different Email
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "welcome" && (
          <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-md animate-in zoom-in-95 duration-300">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-24 h-24 rounded-full border-4 border-accent/20 p-1 mb-4">
                <div className="w-full h-full rounded-full bg-accent/10 flex items-center justify-center overflow-hidden">
                   <UserCheck className="w-12 h-12 text-primary" />
                </div>
              </div>
              <CardTitle className="text-3xl font-black text-primary uppercase">
                Happy Learning!
              </CardTitle>
              <div className="space-y-1">
                <p className="text-xl font-bold text-foreground">
                  {selectedVisitor?.name}
                </p>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                  {selectedVisitor?.college}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-4">
                <label className="text-sm font-bold text-primary uppercase tracking-tighter">
                  Primary Research Activity:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PURPOSES.map((purpose) => (
                    <Button
                      key={purpose}
                      variant={selectedPurpose === purpose ? "default" : "outline"}
                      className={`h-14 justify-start text-left px-4 rounded-xl font-medium ${
                        selectedPurpose === purpose 
                          ? "bg-accent text-accent-foreground border-accent shadow-md" 
                          : "border-2 border-muted hover:border-accent/50 hover:bg-accent/5"
                      }`}
                      onClick={() => setSelectedPurpose(purpose)}
                    >
                      <BookOpen className={`mr-2 h-4 w-4 ${selectedPurpose === purpose ? "opacity-100" : "opacity-30"}`} />
                      {purpose}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  variant="ghost" 
                  className="flex-1 h-12 font-bold rounded-xl text-muted-foreground"
                  onClick={resetTerminal}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  className="flex-[2] h-12 bg-primary hover:bg-primary/95 text-lg font-bold rounded-xl shadow-xl active:scale-95 transition-transform"
                  onClick={handleCompleteEntry}
                  disabled={!selectedPurpose}
                >
                  Enter Library
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <footer className="absolute bottom-6 text-muted-foreground/50 text-xs font-medium tracking-widest uppercase">
        Knowledge is Power • NEU Institutional Library System
      </footer>
    </div>
  );
}
