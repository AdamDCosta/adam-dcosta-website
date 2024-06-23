import { defineCollection, z } from "astro:content";

const blogsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.string(),
    image: z.string(),
  }),
});

const projectsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    url: z.string().url(),
    image: z.string(),
    stack: z.array(z.string()),
  }),
});

export const collections = {
  blogs: blogsCollection,
  projects: projectsCollection,
};
