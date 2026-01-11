import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-pink-50 to-indigo-50">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "rounded-3xl",
            card: "rounded-3xl shadow-xl border-2 border-gray-200",
          },
        }}
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/dashboard"
      />
    </div>
  );
}
