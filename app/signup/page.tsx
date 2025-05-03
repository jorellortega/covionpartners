"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PaymentForm from "../components/payments/PaymentForm";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js/pure";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { Suspense } from "react";
import SignupPageContent from "./SignupPageContent";

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupPageContent />
    </Suspense>
  );
} 