export type RoleType =
  | "guest" | "aluno" | "personal" | "nutri" | "instrutor" | "influencer";

export type Permission =
  | "feed:view"           | "feed:post"            | "feed:comment"
  | "feed:like"           | "feed:post_sponsored"  | "feed:poll"
  | "feed:location"       | "feed:mention"         | "feed:gif"
  | "feed:hashtag"        | "feed:story"           | "feed:repost"
  | "feed:search"         | "feed:upload_media"    | "feed:upload_video"
  | "feed:upload_audio"   | "feed:upload_document"
  | "social:follow"       | "social:dm"
  | "profile:view"        | "profile:edit_own"     | "profile:verified_badge"
  | "workout:view"        | "workout:create"       | "workout:edit_own"
  | "workout:log_own"     | "workout:assign_to_student"
  | "student:view_list"   | "student:view_progress"
  | "nutrition:view_own"  | "nutrition:create"     | "nutrition:edit_own"
  | "nutrition:assign_to_patient"
  | "assessment:view_own" | "assessment:create_own"
  | "assessment:view_student" | "assessment:create_for_student";

const ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {
  guest: [
    "feed:view", "feed:search",
    "profile:view", "workout:view",
  ],
  aluno: [
    "feed:view", "feed:post", "feed:comment", "feed:like",
    "feed:poll", "feed:location", "feed:mention", "feed:gif",
    "feed:hashtag", "feed:story", "feed:repost", "feed:search",
    "feed:upload_media", "feed:upload_video",
    "social:follow", "social:dm",
    "profile:view", "profile:edit_own",
    "workout:view", "workout:log_own",
    "nutrition:view_own",
    "assessment:view_own", "assessment:create_own",
  ],
  personal: [
    "feed:view", "feed:post", "feed:comment", "feed:like",
    "feed:poll", "feed:location", "feed:mention", "feed:gif",
    "feed:hashtag", "feed:story", "feed:repost", "feed:search",
    "feed:upload_media", "feed:upload_video",
    "feed:upload_audio", "feed:upload_document",
    "social:follow", "social:dm",
    "profile:view", "profile:edit_own",
    "workout:view", "workout:create", "workout:edit_own",
    "workout:log_own", "workout:assign_to_student",
    "student:view_list", "student:view_progress",
    "assessment:view_own", "assessment:create_own",
    "assessment:view_student", "assessment:create_for_student",
    "nutrition:view_own",
  ],
  nutri: [
    "feed:view", "feed:post", "feed:comment", "feed:like",
    "feed:poll", "feed:location", "feed:mention", "feed:gif",
    "feed:hashtag", "feed:story", "feed:repost", "feed:search",
    "feed:upload_media", "feed:upload_video", "feed:upload_document",
    "social:follow", "social:dm",
    "profile:view", "profile:edit_own",
    "nutrition:view_own", "nutrition:create",
    "nutrition:edit_own", "nutrition:assign_to_patient",
    "student:view_list", "student:view_progress",
    "assessment:view_own", "assessment:create_own", "assessment:view_student",
    "workout:view", "workout:log_own",
  ],
  instrutor: [
    "feed:view", "feed:post", "feed:comment", "feed:like",
    "feed:poll", "feed:location", "feed:mention", "feed:gif",
    "feed:hashtag", "feed:story", "feed:repost", "feed:search",
    "feed:upload_media", "feed:upload_video",
    "feed:upload_audio", "feed:upload_document",
    "social:follow", "social:dm",
    "profile:view", "profile:edit_own",
    "workout:view", "workout:create", "workout:edit_own", "workout:log_own",
    "student:view_list", "student:view_progress",
    "assessment:view_own", "assessment:create_own", "assessment:view_student",
    "nutrition:view_own",
  ],
  influencer: [
    "feed:view", "feed:post", "feed:comment", "feed:like",
    "feed:post_sponsored", "feed:poll", "feed:location", "feed:mention",
    "feed:gif", "feed:hashtag", "feed:story", "feed:repost", "feed:search",
    "feed:upload_media", "feed:upload_video",
    "feed:upload_audio", "feed:upload_document",
    "social:follow", "social:dm",
    "profile:view", "profile:edit_own", "profile:verified_badge",
    "workout:view", "workout:log_own",
    "nutrition:view_own",
    "assessment:view_own", "assessment:create_own",
  ],
};

export function can(role: RoleType | string | undefined, permission: Permission): boolean {
  const r = (role ?? "guest") as RoleType;
  return (ROLE_PERMISSIONS[r] ?? ROLE_PERMISSIONS.guest).includes(permission);
}

export function getPermissions(role: RoleType | string | undefined): Permission[] {
  const r = (role ?? "guest") as RoleType;
  return ROLE_PERMISSIONS[r] ?? ROLE_PERMISSIONS.guest;
}

export function isProfessional(role: RoleType | string | undefined): boolean {
  return can(role, "student:view_list");
}
