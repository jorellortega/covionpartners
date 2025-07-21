"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Building2, Eye, Calendar, DollarSign } from "lucide-react";

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
        .select("id, name, description, visibility, media_files, budget, created_at, status, type")
        .eq("owner_id", userId)
        .eq("visibility", "public")
        .order("created_at", { ascending: false });
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
      <div className="max-w-6xl mx-auto space-y-8">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl">User's Public Projects</CardTitle>
            <CardDescription>All public projects owned by this user.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : error ? (
              <div className="text-red-400 text-center py-8">{error}</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No public projects found for this user.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Card key={project.id} className="bg-gray-900 border-gray-800 hover:border-purple-500/50 transition-colors overflow-hidden group">
                    {/* Project Thumbnail */}
                    <div className="w-full aspect-video relative overflow-hidden">
                      {project.media_files && project.media_files.length > 0 ? (
                        <Image
                          src={project.media_files[0].url}
                          alt={project.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800/50 flex items-center justify-center">
                          <Building2 className="w-16 h-16 text-purple-400/50" />
                        </div>
                      )}
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          project.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          project.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                          project.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                      <CardDescription className="line-clamp-2 text-gray-400">
                        {project.description || 'No description available'}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {/* Project Details */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-400">
                            <DollarSign className="w-4 h-4 mr-2" />
                            <span>Budget</span>
                          </div>
                          <span className="text-white font-medium">
                            {project.budget ? `$${Number(project.budget).toLocaleString()}` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-400">
                            <Building2 className="w-4 h-4 mr-2" />
                            <span>Type</span>
                          </div>
                          <span className="text-white font-medium capitalize">
                            {project.type || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-400">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>Created</span>
                          </div>
                          <span className="text-white font-medium">
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <Link href={`/publicprojects/${project.id}`} passHref legacyBehavior>
                        <Button variant="outline" className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300">
                          <Eye className="w-4 h-4 mr-2" />
                          View Project
                        </Button>
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