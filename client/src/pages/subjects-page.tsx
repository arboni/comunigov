import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Loader2,
  PenSquare,
  Trash2,
  Eye,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { Subject } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { useTranslation } from "@/hooks/use-translation";

// Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import SubjectDialog from "@/components/dialogs/subject-dialog";
import SubjectViewDialog from "@/components/dialogs/subject-view-dialog";
import SubjectEditDialog from "@/components/dialogs/subject-edit-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function SubjectsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useSimpleAuth();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [createSubjectOpen, setCreateSubjectOpen] = useState(false);
  const [viewSubjectOpen, setViewSubjectOpen] = useState(false);
  const [editSubjectOpen, setEditSubjectOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Fetch subjects
  const { data: subjects = [], isLoading: isLoadingSubjects } = useQuery({
    queryKey: ["/api/subjects"],
  });

  // Delete subject mutation
  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({
        title: t("subjects.delete_subject"),
        description: t("notifications.success.deleted", { item: t("subjects.title").toLowerCase() }),
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: t("notifications.error.delete", { item: t("subjects.title").toLowerCase() }),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSubject = () => {
    if (selectedSubject) {
      deleteSubjectMutation.mutate(selectedSubject.id);
    }
  };

  const handleViewSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setViewSubjectOpen(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setEditSubjectOpen(true);
  };

  // Filter and sort subjects
  const filteredSubjects = subjects
    .filter((subject: Subject) => {
      // Apply search query filter
      const matchesSearch =
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (subject.description && subject.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    })
    .sort((a: Subject, b: Subject) => {
      // Apply sorting
      let compareResult = 0;

      switch (sortField) {
        case "name":
          compareResult = a.name.localeCompare(b.name);
          break;
        case "createdAt":
          compareResult = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          compareResult = 0;
      }

      return sortDirection === "asc" ? compareResult : -compareResult;
    });

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Page header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-800">Subjects</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Manage and organize subjects for task categorization
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  console.log("Opening create subject dialog");
                  setCreateSubjectOpen(true);
                }}
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> New Subject
              </Button>
            </div>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Search & Sort Subjects</CardTitle>
              <CardDescription>
                Find subjects by name or description
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search subjects..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSortField("name")}
                    className="w-full justify-between"
                  >
                    Sort by Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <Button
                    variant="outline"
                    onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                    className="w-full justify-between"
                  >
                    Order: {sortDirection === "asc" ? "Ascending" : "Descending"}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subjects List */}
          <Card>
            <CardHeader>
              <CardTitle>Subjects</CardTitle>
              <CardDescription>
                {filteredSubjects.length} {filteredSubjects.length === 1 ? "subject" : "subjects"} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSubjects ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No subjects found with the current filters
                  </p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setSearchQuery("");
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Name</TableHead>
                        <TableHead className="w-[400px]">Description</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubjects.map((subject: Subject) => (
                        <TableRow key={subject.id}>
                          <TableCell className="font-medium">{subject.name}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {subject.description || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">ID: {subject.createdBy}</Badge>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <time dateTime={subject.createdAt.toString()}>
                                    {format(new Date(subject.createdAt), "MMM d, yyyy")}
                                  </time>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {format(new Date(subject.createdAt), "EEEE, MMMM d, yyyy h:mm a")}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewSubject(subject)}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditSubject(subject)}
                              >
                                <PenSquare className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSubject(subject)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <SubjectDialog
        open={createSubjectOpen}
        onOpenChange={setCreateSubjectOpen}
      />
      
      {selectedSubject && (
        <>
          <SubjectViewDialog
            open={viewSubjectOpen}
            onOpenChange={setViewSubjectOpen}
            subject={selectedSubject}
          />
          
          <SubjectEditDialog
            open={editSubjectOpen}
            onOpenChange={setEditSubjectOpen}
            subject={selectedSubject}
          />
        </>
      )}
      
      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the subject "{selectedSubject?.name}". 
              This action cannot be undone and may affect tasks that are assigned to this subject.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteSubject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}