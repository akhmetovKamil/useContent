import { Bucket } from "encore.dev/storage/objects";

export const userContent = new Bucket("user-content", {
  versioned: false,
});
