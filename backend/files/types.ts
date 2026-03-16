import type { ObjectId } from "mongodb";
import type { Query } from "encore.dev/api";

export interface FileDoc {
  _id: ObjectId;
  walletAddress: string;
  name: string;
  type: "file" | "folder";
  parentId: ObjectId | null;
  storageKey: string | null;
  mimeType: string | null;
  size: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFolderRequest {
  name: string;
  parentId: string | null;
}

export interface FileResponse {
  id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null;
  storageKey: string | null;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListFilesRequest {
  parentId?: Query<string>;
}

export interface ListFilesResponse {
  files: FileResponse[];
}

export interface DeleteFileRequest {
  id: string;
}

export interface UpdateFileRequest {
  id: string;
  name?: string;
  parentId?: string | null;
}
