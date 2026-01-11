import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-50 via-pink-50 to-indigo-50">
      <div className="w-full max-w-md">
        <SignUp 
          appearance={{
            elements: {
              rootBox: "rounded-3xl",
              card: "rounded-3xl shadow-xl border-2 border-gray-200",
            },
          }}
        />
      </div>
    </div>
  );
}
