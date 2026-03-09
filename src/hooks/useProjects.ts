import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  client: string | null;
  color: string;
  created_at: string;
}

export function useProjects(userId: string | undefined) {
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("name");
    setProjects((data as Project[]) || []);
  }, [userId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = async (name: string, client?: string, color?: string) => {
    if (!userId) return;
    const { error } = await supabase.from("projects").insert({
      user_id: userId,
      name,
      client: client || null,
      color: color || "#3b82f6",
    });
    if (error) throw error;
    await fetchProjects();
  };

  const deleteProject = async (id: string) => {
    await supabase.from("projects").delete().eq("id", id);
    await fetchProjects();
  };

  return { projects, addProject, deleteProject, refetch: fetchProjects };
}
