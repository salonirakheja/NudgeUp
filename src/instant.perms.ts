// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const rules = {
  users: {
    allow: {
      view: "true",
      create: "users.id == auth.id",
      update: "users.id == auth.id",
      delete: "users.id == auth.id",
    },
  },
  groups: {
    allow: {
      view: "exists(groupMembers) && groupMembers.groupId == groups.id && groupMembers.userId == auth.id",
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },
  commitments: {
    allow: {
      view: "commitments.userId == auth.id || (commitments.groupId != null && exists(groupMembers) && groupMembers.groupId == commitments.groupId && groupMembers.userId == auth.id)",
      create: "commitments.userId == auth.id",
      update: "commitments.userId == auth.id",
      delete: "commitments.userId == auth.id",
    },
  },
  completions: {
    allow: {
      view: "completions.userId == auth.id || (exists(commitments) && commitments.id == completions.commitmentId && commitments.groupId != null && exists(groupMembers) && groupMembers.groupId == commitments.groupId && groupMembers.userId == auth.id)",
      create: "completions.userId == auth.id",
      update: "completions.userId == auth.id",
      delete: "completions.userId == auth.id",
    },
  },
  groupMembers: {
    allow: {
      view: "groupMembers.userId == auth.id || (exists(groups) && groups.id == groupMembers.groupId && exists(groupMembers) && groupMembers.groupId == groups.id && groupMembers.userId == auth.id)",
      create: "groupMembers.userId == auth.id",
      update: "groupMembers.userId == auth.id",
      delete: "groupMembers.userId == auth.id",
    },
  },
  nudges: {
    allow: {
      view: "data.toUserId == auth.id || data.fromUserId == auth.id",
      create: "data.fromUserId == auth.id",
      // Allow both sender and recipient to update nudges
      // Sender can update any field, recipient can update resolvedAt to mark as resolved
      update: "data.fromUserId == auth.id || data.toUserId == auth.id",
      delete: "data.fromUserId == auth.id || data.toUserId == auth.id",
    },
  },
} satisfies InstantRules;

export default rules;
