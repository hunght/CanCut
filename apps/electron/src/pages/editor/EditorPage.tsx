import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

export default function EditorPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["editor-projects"],
    queryFn: async () => trpcClient.editor.projects.list.query(),
  });

  const createMutation = useMutation({
    mutationFn: async () => trpcClient.editor.projects.create.mutate({ name: "Untitled Project" }),
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: ["editor-projects"] });
      navigate({ to: "/editor", search: { projectId: res.id } });
    },
  });

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Editor</h1>
        <Button onClick={() => createMutation.mutate()}>New Project</Button>
      </div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <ul className="space-y-2">
          {projects?.map((p) => (
            <li key={p.id} className="flex items-center justify-between">
              <div className="truncate">{p.name}</div>
              <div className="text-xs text-muted-foreground">
                {new Date(p.updatedAt ?? p.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
