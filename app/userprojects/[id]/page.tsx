"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UserProjectsPage() {
  const params = useParams();
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, description, visibility")
        .eq("owner_id", userId)
        .eq("visibility", "public");
      if (error) {
        setError(error.message);
      } else {
        setProjects(data || []);
      }
      setLoading(false);
    };
    if (userId) fetchProjects();
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>User's Public Projects</CardTitle>
            <CardDescription>All public projects owned by this user.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div className="text-red-400">{error}</div>
            ) : projects.length === 0 ? (
              <div>No public projects found for this user.</div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <Card key={project.id} className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription>{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href={`/publicprojects/${project.id}`} passHref legacyBehavior>
                        <Button variant="outline">View Project</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 