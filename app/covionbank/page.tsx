"use client";

export default function CovionBank() {
  const handleClick = async () => {
    const res = await fetch("/api/stripe/connect/get-onboarding-link");
    const { url } = await res.json();
    window.location.href = url;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Connect Your CovionBank Account</h1>
      <p className="mb-6 text-center max-w-md">
        To receive payments, complete your secure Stripe setup by clicking below.
      </p>
      <button
        onClick={handleClick}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Continue to Stripe
      </button>
    </div>
  );
} 