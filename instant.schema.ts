// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    users: i.entity({
      email: i.string(),
      name: i.string(),
      password: i.string().optional(),
      avatar: i.string().optional(),
      avatarImage: i.string().optional(),
      createdAt: i.number(),
    }),
    commitments: i.entity({
      userId: i.string(),
      name: i.string(),
      icon: i.string(),
      streak: i.number(),
      completed: i.boolean(),
      createdAt: i.number(),
      duration: i.number().optional(),
      groupId: i.string().optional(),
    }),
    completions: i.entity({
      commitmentId: i.string(),
      userId: i.string(),
      date: i.string(),
      completed: i.boolean(),
    }),
    groups: i.entity({
      name: i.string(),
      icon: i.string(),
      description: i.string().optional(),
      totalDays: i.number().optional(),
      inviteCode: i.string().optional(),
      createdAt: i.number(),
    }),
    groupMembers: i.entity({
      groupId: i.string(),
      userId: i.string(),
      completedToday: i.boolean(),
      streak: i.number(),
      memberSince: i.number(),
    }),
  },
  links: {
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
  },
  rooms: {},
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
