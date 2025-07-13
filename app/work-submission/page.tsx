"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Briefcase, UserPlus, FileText, DollarSign, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function WorkSubmissionPage() {
  const { user, signUp, signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submission, setSubmission] = useState({
    title: "",
    description: "",
    category: "",
    budget_min: "",
    budget_max: "",
    timeline_days: "",
    skills_required: "",
    deliverables: "",
    additional_requirements: ""
  });
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    full_name: ""
  });

  const categories = [
    "Web Development",
    "Mobile Development", 
    "UI/UX Design",
    "Graphic Design",
    "Content Writing",
    "Digital Marketing",
    "SEO",
    "Data Analysis",
    "Video Production",
    "Audio Production",
    "Translation",
    "Virtual Assistant",
    "Other"
  ];

  const handleSignUp = async () => {
    if (!authForm.email || !authForm.password || !authForm.full_name) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(authForm.email, authForm.password, authForm.full_name, "", "viewer");
      if (error) throw error;
      
      toast.success("Account created successfully! Please check your email to verify your account.");
      setShowSignUp(false);
      setAuthForm({ email: "", password: "", full_name: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!authForm.email || !authForm.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn(authForm.email, authForm.password);
      if (error) throw error;
      
      toast.success("Signed in successfully!");
      setShowSignIn(false);
      setAuthForm({ email: "", password: "", full_name: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!user) {
      toast.error("Please sign in to submit work");
      return;
    }

    if (!submission.title || !submission.description || !submission.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("work_submissions")
        .insert([
          {
            user_id: user.id,
            title: submission.title,
            description: submission.description,
            category: submission.category,
            budget_min: submission.budget_min ? Number(submission.budget_min) : null,
            budget_max: submission.budget_max ? Number(submission.budget_max) : null,
            timeline_days: submission.timeline_days ? Number(submission.timeline_days) : null,
            skills_required: submission.skills_required ? submission.skills_required.split(',').map(s => s.trim()) : [],
            deliverables: submission.deliverables,
            additional_requirements: submission.additional_requirements,
            status: "pending"
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setSubmissionSuccess(true);
      setSubmission({
        title: "",
        description: "",
        category: "",
        budget_min: "",
        budget_max: "",
        timeline_days: "",
        skills_required: "",
        deliverables: "",
        additional_requirements: ""
      });
      toast.success("Work submission sent successfully! We'll review it and get back to you soon.");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit work");
    } finally {
      setLoading(false);
    }
  };

  if (submissionSuccess) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Card className="leonardo-card border-gray-800 max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Submission Successful!</h2>
            <p className="text-gray-400 mb-6">
              Your work submission has been sent successfully. Our team will review it and get back to you within 24-48 hours.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => setSubmissionSuccess(false)} 
                className="w-full bg-cyan-700 text-white"
              >
                Submit Another Project
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/work-dashboard'} 
                className="w-full"
              >
                Go to Work Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="leonardo-header sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex flex-col gap-2 py-4 px-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-blue-400" /> Work for Hire Submission
          </h1>
          <p className="text-gray-400 text-base">
            Submit your work requirements and we'll match you with the right professionals
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        {/* Account Requirement Notice */}
        {!user && (
          <Card className="leonardo-card border-yellow-600 bg-yellow-900/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">Account Required</h3>
                  <p className="text-yellow-200 mb-4">
                    You need to create an account or sign in to submit work requests. This helps us track your submissions and provide better service.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Dialog open={showSignUp} onOpenChange={setShowSignUp}>
                      <DialogTrigger asChild>
                        <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                          <UserPlus className="w-4 h-4 mr-2" />
                          Create Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create Account</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="signup-name">Full Name</Label>
                            <Input
                              id="signup-name"
                              placeholder="Enter your full name"
                              value={authForm.full_name}
                              onChange={(e) => setAuthForm({ ...authForm, full_name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="signup-email">Email</Label>
                            <Input
                              id="signup-email"
                              type="email"
                              placeholder="Enter your email"
                              value={authForm.email}
                              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="signup-password">Password</Label>
                            <Input
                              id="signup-password"
                              type="password"
                              placeholder="Enter your password"
                              value={authForm.password}
                              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                            />
                          </div>
                          <Button 
                            onClick={handleSignUp} 
                            disabled={loading}
                            className="w-full bg-cyan-700 text-white"
                          >
                            {loading ? <LoadingSpinner /> : "Create Account"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={showSignIn} onOpenChange={setShowSignIn}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/20">
                          Sign In
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Sign In</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="signin-email">Email</Label>
                            <Input
                              id="signin-email"
                              type="email"
                              placeholder="Enter your email"
                              value={authForm.email}
                              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="signin-password">Password</Label>
                            <Input
                              id="signin-password"
                              type="password"
                              placeholder="Enter your password"
                              value={authForm.password}
                              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                            />
                          </div>
                          <Button 
                            onClick={handleSignIn} 
                            disabled={loading}
                            className="w-full bg-cyan-700 text-white"
                          >
                            {loading ? <LoadingSpinner /> : "Sign In"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Work Submission Form */}
        <Card className="leonardo-card border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-cyan-400" />
              Work Requirements
            </CardTitle>
            <CardDescription>
              Tell us about the work you need done. Be as detailed as possible to help us match you with the right professionals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Website Redesign for E-commerce Store"
                  value={submission.title}
                  onChange={(e) => setSubmission({ ...submission, title: e.target.value })}
                  disabled={!user}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={submission.category} onValueChange={(value) => setSubmission({ ...submission, category: value })}>
                  <SelectTrigger disabled={!user}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Project Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your project in detail. What do you want to achieve? What are your goals?"
                value={submission.description}
                onChange={(e) => setSubmission({ ...submission, description: e.target.value })}
                rows={4}
                disabled={!user}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="budget-min">Minimum Budget</Label>
                <div className="flex items-center bg-gray-900 border border-gray-700 rounded px-3 focus-within:ring-2 focus-within:ring-cyan-500">
                  <span className="text-gray-400 mr-2 select-none w-5 text-center">$</span>
                  <input
                    id="budget-min"
                    className="bg-transparent outline-none w-full text-white py-2 pl-0"
                    placeholder="0"
                    type="number"
                    value={submission.budget_min}
                    onChange={(e) => setSubmission({ ...submission, budget_min: e.target.value })}
                    min="0"
                    step="0.01"
                    disabled={!user}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget-max">Maximum Budget</Label>
                <div className="flex items-center bg-gray-900 border border-gray-700 rounded px-3 focus-within:ring-2 focus-within:ring-cyan-500">
                  <span className="text-gray-400 mr-2 select-none w-5 text-center">$</span>
                  <input
                    id="budget-max"
                    className="bg-transparent outline-none w-full text-white py-2 pl-0"
                    placeholder="0"
                    type="number"
                    value={submission.budget_max}
                    onChange={(e) => setSubmission({ ...submission, budget_max: e.target.value })}
                    min="0"
                    step="0.01"
                    disabled={!user}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeline">Timeline (Days)</Label>
                <Input
                  id="timeline"
                  placeholder="e.g., 30"
                  type="number"
                  value={submission.timeline_days}
                  onChange={(e) => setSubmission({ ...submission, timeline_days: e.target.value })}
                  min="1"
                  disabled={!user}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Required Skills</Label>
              <Input
                id="skills"
                placeholder="e.g., React, Node.js, UI/UX Design (separate with commas)"
                value={submission.skills_required}
                onChange={(e) => setSubmission({ ...submission, skills_required: e.target.value })}
                disabled={!user}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliverables">Deliverables</Label>
              <Textarea
                id="deliverables"
                placeholder="What specific deliverables do you expect? (e.g., source code, design files, documentation)"
                value={submission.deliverables}
                onChange={(e) => setSubmission({ ...submission, deliverables: e.target.value })}
                rows={3}
                disabled={!user}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Additional Requirements</Label>
              <Textarea
                id="requirements"
                placeholder="Any additional requirements, preferences, or special considerations?"
                value={submission.additional_requirements}
                onChange={(e) => setSubmission({ ...submission, additional_requirements: e.target.value })}
                rows={3}
                disabled={!user}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSubmitWork}
                disabled={!user || loading}
                className="bg-cyan-700 text-white hover:bg-cyan-600"
              >
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <Briefcase className="w-4 h-4 mr-2" />
                    Submit Work Request
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="leonardo-card border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="w-6 h-6 text-blue-400" />
                <h3 className="font-semibold text-white">Review Process</h3>
              </div>
              <p className="text-gray-400 text-sm">
                We review all submissions within 24-48 hours and will contact you with next steps.
              </p>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="w-6 h-6 text-green-400" />
                <h3 className="font-semibold text-white">Pricing</h3>
              </div>
              <p className="text-gray-400 text-sm">
                We work with you to find the best pricing that fits your budget and project requirements.
              </p>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-6 h-6 text-purple-400" />
                <h3 className="font-semibold text-white">Quality Assurance</h3>
              </div>
              <p className="text-gray-400 text-sm">
                All work goes through our quality assurance process to ensure you get the best results.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 