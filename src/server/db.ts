import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Task, Project } from '../types';

const DB_FILE = path.join(process.cwd(), 'db.json');

interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  tasks: Task[];
  projects: Project[];
}

// Initial seed data
const getInitialData = (): DatabaseSchema => {
  const salt = bcrypt.genSaltSync(10);
  return {
    users: [
      {
        id: 'user-admin',
        email: 'admin@enterprise.com',
        name: 'Sarah Connor',
        role: 'Admin',
        passwordHash: bcrypt.hashSync('admin123', salt),
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
      },
      {
        id: 'user-manager',
        email: 'manager@enterprise.com',
        name: 'John Miller',
        role: 'Project Manager',
        passwordHash: bcrypt.hashSync('manager123', salt),
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
      },
      {
        id: 'user-member1',
        email: 'member1@enterprise.com',
        name: 'Alex Rivera',
        role: 'Team Member',
        passwordHash: bcrypt.hashSync('member123', salt),
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
      },
      {
        id: 'user-member2',
        email: 'member2@enterprise.com',
        name: 'Emily Chen',
        role: 'Team Member',
        passwordHash: bcrypt.hashSync('member123', salt),
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
      }
    ],
    projects: [
      {
        id: 'proj-alpha',
        name: 'Project Alpha (Core API Platform)',
        description: 'Design and build the secure core enterprise APIs with high availability.',
        managerId: 'user-manager'
      },
      {
        id: 'proj-beta',
        name: 'Project Beta (NextGen Dashboard)',
        description: 'Develop the user interface dashboard featuring modern visual state charts.',
        managerId: 'user-manager'
      }
    ],
    tasks: [
      {
        id: 'task-1',
        title: 'Design JWT authentication architecture',
        description: 'Create security middleware to validate JWTs and authorize based on User roles (Admin, PM, Member).',
        status: 'In Progress',
        priority: 'High',
        dueDate: '2026-07-10',
        assigneeId: 'user-member1',
        projectId: 'proj-alpha',
        createdAt: new Date('2026-06-20').toISOString(),
        updatedAt: new Date('2026-06-25').toISOString()
      },
      {
        id: 'task-2',
        title: 'Implement CORS and Rate Limiting',
        description: 'Set up Express middleware to limit api abuse and configure secure cross-origin resource sharing.',
        status: 'Todo',
        priority: 'Medium',
        dueDate: '2026-07-15',
        assigneeId: 'user-member2',
        projectId: 'proj-alpha',
        createdAt: new Date('2026-06-22').toISOString(),
        updatedAt: new Date('2026-06-22').toISOString()
      },
      {
        id: 'task-3',
        title: 'Create Figma dashboard layouts',
        description: 'Design comprehensive UX templates matching modern slate and negative-space styles.',
        status: 'Done',
        priority: 'Low',
        dueDate: '2026-06-24',
        assigneeId: 'user-member2',
        projectId: 'proj-beta',
        createdAt: new Date('2026-06-18').toISOString(),
        updatedAt: new Date('2026-06-24').toISOString()
      },
      {
        id: 'task-4',
        title: 'Conduct end-to-end audit',
        description: 'Audit the RESTful endpoints for RBAC consistency and resource containment checks.',
        status: 'Review',
        priority: 'High',
        dueDate: '2026-07-01',
        assigneeId: 'user-member1',
        projectId: 'proj-alpha',
        createdAt: new Date('2026-06-24').toISOString(),
        updatedAt: new Date('2026-06-25').toISOString()
      }
    ]
  };
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(fileContent);
      }
    } catch (err) {
      console.error('Error reading database file, using seeds', err);
    }
    const seed = getInitialData();
    this.saveData(seed);
    return seed;
  }

  private saveData(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to database file', err);
    }
  }

  public getUsers() {
    return this.data.users;
  }

  public getTasks() {
    return this.data.tasks;
  }

  public getProjects() {
    return this.data.projects;
  }

  public addUser(user: User & { passwordHash: string }) {
    this.data.users.push(user);
    this.saveData(this.data);
  }

  public addTask(task: Task) {
    this.data.tasks.push(task);
    this.saveData(this.data);
    return task;
  }

  public updateTask(taskId: string, updates: Partial<Task>): Task | null {
    const index = this.data.tasks.findIndex(t => t.id === taskId);
    if (index === -1) return null;

    const updatedTask = {
      ...this.data.tasks[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.data.tasks[index] = updatedTask;
    this.saveData(this.data);
    return updatedTask;
  }

  public deleteTask(taskId: string): boolean {
    const index = this.data.tasks.findIndex(t => t.id === taskId);
    if (index === -1) return false;

    this.data.tasks.splice(index, 1);
    this.saveData(this.data);
    return true;
  }

  public addProject(project: Project) {
    this.data.projects.push(project);
    this.saveData(this.data);
    return project;
  }
}

export const db = new Database();
