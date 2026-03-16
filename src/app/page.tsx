
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, UserCheck, Mail, ScanFace, Lock, Quote, Loader2, 
  ShieldCheck, LayoutDashboard, Users, LogOut, ArrowLeft, Shield,
  GraduationCap, Briefcase, Sparkles, PlusCircle, CreditCard
} from "lucide-react";
import { PURPOSES, COLLEGES } from "@/lib/mock-data";
import { useLibraryStore } from "@/hooks/use-library-store";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAuth } from "@/firebase";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function VisitorTerminal() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const { addLog, registerUser, visitors, isLoaded, claimAdminStatus, revokeAdminStatus } = useLibraryStore();
  
  const [step, setStep] = useState<"identify" | "staff-portal" | "rfid-entry" | "guest-register" | "role-select" | "welcome">("identify");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [scanId, setScanId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestCollege, setGuestCollege] = useState("");
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
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

  const heroImage = PlaceHolderImages.find(img => img.id === "library-hero");

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
    setPassword("");
    setScanId("");
    setGuestName("");
    setGuestCollege("");
    setSelectedVisitor(null);
    setSelectedPurpose("");
    revokeAdminStatus();
  };

  const handleIdentify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    setTimeout(() => {
      const visitor = visitors.find(v => v.email.toLowerCase().trim() === email.toLowerCase().trim());
      
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

        if (step === "staff-portal") {
          if (password !== "admin123") {
            toast({
              title: "Authorization Failed",
              description: "Incorrect librarian password.",
              variant: "destructive"
            });
            setIsProcessing(false);
            return;
          }
        }

        setSelectedVisitor(visitor);
        const needsRoleSelect = visitor.isEmployee || visitor.email.toLowerCase().trim() === "jcesperanza@neu.edu.ph" || visitor.email.toLowerCase().includes("admin");

        if (needsRoleSelect) {
          setStep("role-select");
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

  const handleRfidScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanId.trim()) return;

    setIsProcessing(true);
    setTimeout(() => {
      const visitor = visitors.find(v => v.rfid === scanId || v.id === scanId);
      
      if (visitor) {
        if (visitor.isBlocked) {
          toast({
            title: "Access Restricted",
            description: "This ID has been restricted from entry.",
            variant: "destructive"
          });
          setIsProcessing(false);
          return;
        }
        setSelectedVisitor(visitor);
        setStep("welcome");
      } else {
        setStep("guest-register");
      }
      setIsProcessing(false);
    }, 500);
  };

  const handleGuestRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestCollege) {
      toast({ title: "Details Required", description: "Please provide a name and college.", variant: "destructive" });
      return;
    }

    const newId = scanId || `GUEST-${Math.random().toString(36).substr(2, 9)}`;
    const newVisitor = {
      id: newId,
      name: guestName,
      college: guestCollege,
      email: `${newId.toLowerCase()}@guest.neu.edu.ph`,
      isEmployee: false,
      rfid: scanId || undefined
    };

    registerUser(newVisitor);
    setSelectedVisitor(newVisitor);
    toast({ title: "Guest Registered", description: `Welcome to the library, ${guestName}!` });
    setStep("welcome");
  };

  const handleRoleChoice = (role: "admin" | "student") => {
    if (role === "admin") {
      claimAdminStatus();
      toast({
        title: "Administrative Mode",
        description: "Librarian privileges granted for this session.",
      });
      router.push("/admin/dashboard");
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
        description: `Welcome, ${selectedVisitor.name.split(' ')[0]}!`,
      });

      resetTerminal();
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground font-semibold animate-pulse tracking-tight">INITIALIZING NEU CORE SYSTEMS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center p-4 relative overflow-hidden font-body">
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #1a365d 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-4xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column */}
        <div className="lg:col-span-5 space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 shadow-sm">
              <div className="p-2 bg-primary rounded-full text-white">
                <BookOpen size={16} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Institutional Terminal</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-primary uppercase italic leading-none">
              NEU<br />Library
            </h1>
            {currentTime && (
              <div className="inline-block">
                <p className="text-2xl font-bold text-muted-foreground/90">
                  {format(currentTime, "h:mm:ss a")}
                </p>
                <p className="text-sm font-medium text-muted-foreground/60 uppercase tracking-widest">
                  {format(currentTime, "EEEE, MMMM do")}
                </p>
              </div>
            )}
          </div>

          <div className="hidden lg:block relative group overflow-hidden rounded-3xl shadow-2xl border-4 border-white aspect-video">
            {heroImage && (
              <Image 
                src={heroImage.imageUrl} 
                alt={heroImage.description}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                data-ai-hint={heroImage.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
               <p className="text-xs font-medium italic opacity-80 leading-relaxed">
                 "{quote.split(' — ')[0]}"
               </p>
               <p className="text-[10px] font-bold uppercase tracking-widest mt-1">
                 — {quote.split(' — ')[1]}
               </p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7">
          {step === "identify" && (
            <Card className="glass-card border-none overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-black text-primary flex items-center gap-2">
                  <ScanFace className="w-6 h-6 text-accent" />
                  IDENTITY SCAN
                </CardTitle>
                <CardDescription className="text-sm font-medium">
                  Enter credentials or use your student ID for immediate access.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleIdentify} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative group">
                      <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        placeholder="institutional.email@neu.edu.ph" 
                        className="pl-12 h-14 text-lg border-2 border-muted focus-visible:border-primary focus-visible:ring-0 rounded-2xl bg-white/50"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-black bg-primary hover:bg-primary/95 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : "VERIFY EMAIL"}
                  </Button>
                </form>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted/50" />
                  </div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="bg-[#FDFDFF] px-4 text-muted-foreground/60">Alternate Access</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => setStep("rfid-entry")}
                    variant="outline" 
                    className="h-24 border-2 border-dashed border-primary/20 hover:border-primary hover:bg-primary/5 rounded-2xl flex flex-col gap-1 transition-all group"
                  >
                    <CreditCard className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase">ID / RFID TAP</span>
                  </Button>
                  <Button 
                    onClick={() => setStep("staff-portal")}
                    variant="outline" 
                    className="h-24 border-2 border-dashed border-accent/20 hover:border-accent hover:bg-accent/5 rounded-2xl flex flex-col gap-1 transition-all group"
                  >
                    <Shield className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-bold uppercase">STAFF GATE</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "rfid-entry" && (
            <Card className="glass-card border-none animate-in fade-in zoom-in-95 duration-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <CreditCard className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-black text-primary uppercase">ID IDENTIFICATION</CardTitle>
                <CardDescription className="text-sm font-medium">
                  Enter your Student ID number or scan your RFID tag.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleRfidScan} className="space-y-4">
                  <Input 
                    placeholder="Enter ID Number (e.g. 2023-1234)" 
                    className="h-14 text-lg text-center font-bold border-2 border-muted focus-visible:border-primary focus-visible:ring-0 rounded-2xl bg-white/50"
                    value={scanId}
                    onChange={(e) => setScanId(e.target.value)}
                    required
                    autoFocus
                  />
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-black bg-primary hover:bg-primary/95 rounded-2xl"
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : "PROCEED"}
                  </Button>
                </form>
                <Button variant="ghost" className="w-full h-12 font-bold text-xs uppercase tracking-widest" onClick={() => setStep("identify")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "guest-register" && (
            <Card className="glass-card border-none animate-in fade-in zoom-in-95 duration-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                  <PlusCircle className="w-8 h-8 text-accent" />
                </div>
                <CardTitle className="text-2xl font-black text-primary uppercase">NEW PATRON</CardTitle>
                <CardDescription className="text-sm font-medium">
                  ID <strong>{scanId}</strong> not found. Please provide quick details to enter as a guest.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleGuestRegister} className="space-y-4">
                  <Input 
                    placeholder="Full Name" 
                    className="h-12 border-2 border-muted rounded-xl bg-white/50"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                  />
                  <Select value={guestCollege} onValueChange={setGuestCollege}>
                    <SelectTrigger className="h-12 border-2 border-muted rounded-xl bg-white/50">
                      <SelectValue placeholder="Select College / Office" />
                    </SelectTrigger>
                    <SelectContent>
                      {COLLEGES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-black bg-accent text-accent-foreground hover:bg-accent/90 rounded-2xl"
                  >
                    REGISTER & ENTER
                  </Button>
                </form>
                <Button variant="ghost" className="w-full h-12 font-bold text-xs uppercase tracking-widest" onClick={() => setStep("rfid-entry")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Different ID
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "staff-portal" && (
            <Card className="glass-card border-none animate-in zoom-in-95 duration-300">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                  <Lock className="w-8 h-8 text-accent" />
                </div>
                <CardTitle className="text-2xl font-black text-primary uppercase italic">Librarian Access</CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Restricted Administrative Portal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <form onSubmit={handleIdentify} className="space-y-4">
                  <div className="space-y-3">
                    <Input 
                      placeholder="Staff Email" 
                      className="h-12 border-2 border-muted rounded-xl bg-white/50"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <Input 
                      type="password"
                      placeholder="Security Credentials" 
                      className="h-12 border-2 border-muted rounded-xl bg-white/50"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-black bg-accent text-accent-foreground hover:bg-accent/90 rounded-2xl shadow-lg shadow-accent/20"
                  >
                    AUTHORIZE
                  </Button>
                </form>
                <Button 
                  variant="ghost" 
                  className="w-full h-12 font-bold text-xs uppercase tracking-widest" 
                  onClick={() => setStep("identify")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "role-select" && (
            <Card className="glass-card border-none animate-in zoom-in-95 duration-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-black text-primary uppercase">ACCESS MODE</CardTitle>
                <CardDescription className="text-sm font-medium">
                  Select your operations environment for <strong>{email}</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="grid grid-cols-1 gap-4">
                  <Button 
                    className="h-24 text-lg font-black flex flex-col items-center justify-center gap-1 bg-primary hover:bg-primary/95 rounded-2xl shadow-xl shadow-primary/10"
                    onClick={() => handleRoleChoice("admin")}
                  >
                    <LayoutDashboard className="w-6 h-6 mb-1" />
                    <span>LIBRARIAN CONSOLE</span>
                    <span className="text-[10px] font-normal opacity-60">Manage visitors and view analytics</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-24 text-lg font-black flex flex-col items-center justify-center gap-1 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary rounded-2xl"
                    onClick={() => handleRoleChoice("student")}
                  >
                    <Users className="w-6 h-6 mb-1" />
                    <span>STUDENT TERMINAL</span>
                    <span className="text-[10px] font-normal opacity-60">Standard patron log-in access</span>
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full h-12 font-bold text-xs uppercase tracking-widest text-muted-foreground" 
                  onClick={resetTerminal}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancel Selection
                </Button>
              </CardContent>
            </Card>
          )}

          {step === "welcome" && (
            <Card className="glass-card border-none animate-in fade-in zoom-in-95 duration-500 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />
              <CardHeader className="text-center pb-6">
                <div className="mx-auto w-24 h-24 rounded-full border-4 border-accent/20 p-2 mb-4">
                  <div className="w-full h-full rounded-full bg-primary/5 flex items-center justify-center relative">
                    <UserCheck className="w-12 h-12 text-primary" />
                    <Sparkles className="absolute top-0 right-0 w-6 h-6 text-accent animate-pulse" />
                  </div>
                </div>
                <CardTitle className="text-4xl font-black text-primary tracking-tighter uppercase italic">
                  WELCOME BACK!
                </CardTitle>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">
                    {selectedVisitor?.name}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    {selectedVisitor?.isEmployee ? (
                       <Briefcase className="w-3 h-3 text-primary" />
                    ) : (
                       <GraduationCap className="w-3 h-3 text-accent" />
                    )}
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                      {selectedVisitor?.college}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] block text-center">
                    SELECT SCHOLARLY ACTIVITY
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {PURPOSES.map((purpose) => (
                      <Button
                        key={purpose}
                        variant={selectedPurpose === purpose ? "default" : "outline"}
                        className={`h-16 justify-center flex flex-col gap-1 rounded-2xl transition-all duration-300 ${
                          selectedPurpose === purpose 
                            ? "bg-primary text-white scale-105 shadow-xl shadow-primary/20 ring-2 ring-primary ring-offset-2" 
                            : "border-2 border-muted hover:border-accent/40 hover:bg-accent/5"
                        }`}
                        onClick={() => setSelectedPurpose(purpose)}
                      >
                        <span className="text-sm font-bold truncate w-full px-2">{purpose}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-14 font-black text-xs uppercase tracking-widest text-muted-foreground"
                    onClick={resetTerminal}
                  >
                    BACK
                  </Button>
                  <Button 
                    className="flex-[2] h-14 bg-primary hover:bg-primary/95 text-xl font-black rounded-2xl shadow-2xl shadow-primary/20 transition-all active:scale-95"
                    onClick={handleCompleteEntry}
                    disabled={!selectedPurpose}
                  >
                    LOG ENTRY
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <footer className="absolute bottom-8 text-muted-foreground/30 text-[10px] font-black tracking-[0.4em] uppercase">
        NEU INSTITUTIONAL LIBRARY SERVICES • EST. 1975
      </footer>
    </div>
  );
}
