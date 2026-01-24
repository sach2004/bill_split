"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useClerk, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Camera, LogIn, LogOut, Sparkles, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    toast("Signed out successfully", "success");
    router.push("/");
  };

  const handleStartSplitting = () => {
    if (!isSignedIn) {
      toast("Please sign in to create bills", "info");
      router.push("/sign-in");
    } else {
      router.push("/create-bill");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <header className="relative z-10 glass sticky top-0">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg glow">
              <span className="text-white font-bold text-xl">₹</span>
            </div>
            <span className="font-bold text-xl text-white">SplitBills</span>
          </div>

          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <>
                <Link href="/dashboard">
                  <Button className="rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white">
                    Dashboard
                  </Button>
                </Link>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="rounded-full border-white/20 text-white hover:bg-white/10"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link href="/sign-in">
                <Button className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg">
                  <LogIn className="mr-2 w-4 h-4" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="relative z-10 px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-white">
                AI-Powered Bill Splitting
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
              Split Bills
              <br />
              Like Magic
            </h1>

            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Scan bills with AI, split with friends, pay via UPI. Simple, fast,
              secure.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button
                onClick={handleStartSplitting}
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-lg rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-2xl glow"
              >
                <Camera className="mr-2 w-6 h-6" />
                {isSignedIn ? "Start Splitting" : "Sign In to Split"}
              </Button>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Camera,
                title: "AI Scanning",
                desc: "Instant extraction",
                color: "from-indigo-500 to-blue-600",
              },
              {
                icon: Users,
                title: "Easy Sharing",
                desc: "Unlimited friends",
                color: "from-purple-500 to-pink-600",
              },
              {
                icon: Zap,
                title: "UPI Payments",
                desc: "Pay instantly",
                color: "from-amber-500 to-orange-600",
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="glass p-6 rounded-2xl hover:bg-white/10 transition-all group border border-white/10"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 mx-auto shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-lg text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
