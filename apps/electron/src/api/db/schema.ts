import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// =====================
// Editor schema (local)
// =====================

export const editorProjects = sqliteTable(
  "editor_projects",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    thumbnail: text("thumbnail"),
    backgroundType: text("background_type"),
    backgroundColor: text("background_color"),
    blurIntensity: integer("blur_intensity"),
    bookmarksJson: text("bookmarks_json"),
    fps: integer("fps"),
    canvasMode: text("canvas_mode"),
    canvasWidth: integer("canvas_width"),
    canvasHeight: integer("canvas_height"),
    currentSceneId: text("current_scene_id"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("editor_projects_updated_at_idx").on(table.updatedAt)]
);

export const editorScenes = sqliteTable(
  "editor_scenes",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => editorProjects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isMain: integer("is_main", { mode: "boolean" }).default(false),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at"),
  },
  (table) => [
    index("editor_scenes_project_id_idx").on(table.projectId),
    index("editor_scenes_is_main_idx").on(table.isMain),
  ]
);

export const editorMedia = sqliteTable(
  "editor_media",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => editorProjects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull(),
    width: integer("width"),
    height: integer("height"),
    duration: integer("duration"),
    size: integer("size"),
    ephemeral: integer("ephemeral", { mode: "boolean" }),
    filePath: text("file_path").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at"),
  },
  (table) => [index("editor_media_project_id_idx").on(table.projectId)]
);

export const editorTimelines = sqliteTable(
  "editor_timelines",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => editorProjects.id, { onDelete: "cascade" }),
    sceneId: text("scene_id").references(() => editorScenes.id, { onDelete: "cascade" }),
    tracksJson: text("tracks_json").notNull(),
    lastModified: integer("last_modified").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at"),
  },
  (table) => [
    index("editor_timelines_project_id_idx").on(table.projectId),
    unique().on(table.projectId, table.sceneId),
  ]
);

export const editorSavedSounds = sqliteTable(
  "editor_saved_sounds",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    username: text("username"),
    previewUrl: text("preview_url"),
    downloadUrl: text("download_url"),
    duration: integer("duration"),
    tagsJson: text("tags_json"),
    license: text("license"),
    savedAt: integer("saved_at").notNull(),
  },
  (table) => [index("editor_saved_sounds_saved_at_idx").on(table.savedAt)]
);

export type EditorProject = typeof editorProjects.$inferSelect;
export type NewEditorProject = typeof editorProjects.$inferInsert;
export type EditorScene = typeof editorScenes.$inferSelect;
export type NewEditorScene = typeof editorScenes.$inferInsert;
export type EditorMedia = typeof editorMedia.$inferSelect;
export type NewEditorMedia = typeof editorMedia.$inferInsert;
export type EditorTimeline = typeof editorTimelines.$inferSelect;
export type NewEditorTimeline = typeof editorTimelines.$inferInsert;
export type EditorSavedSound = typeof editorSavedSounds.$inferSelect;
export type NewEditorSavedSound = typeof editorSavedSounds.$inferInsert;
