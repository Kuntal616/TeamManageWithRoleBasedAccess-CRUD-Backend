export enum Role {
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  USER = "USER",
  GUEST = "GUEST",
}
export enum TaskStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ON_HOLD = "ON_HOLD",
}

export enum TaskPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  tasks?: Task[];
  comments?: Comment[];
  teamId?: string;
  team?: Team;
  projectsCreated?: Project[];
  createdAt: Date;
  updatedAt: Date;
}
export interface Team {
  id: string;
  name: string;
  description?: string | null;
  code: string;
  members: User[];
  projects: Project[];
  createdAt: Date;
  updatedAt: Date;
}
export interface Project {
  id: string;
  name: string;
  description?: string | null;
  teamId: string;
  team: Team;
  tasks: Task[];
  createdById: string;
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
}
export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueTime?: Date | null;
  assigneeId?: string | null;
  assignee?: User | null;
  projectId: string;
  project: Project;
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}
export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author?: User | null;
  taskId: string;
  task: Task;
  createdAt: Date;
  updatedAt: Date;
}
