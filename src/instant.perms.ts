// Docs: https://www.instantdb.com/docs/permissions

const rules = {
  users: {
    read: "true",
    write: "users.id === auth.id",
  },
  groups: {
    read: "exists(groupMembers) && groupMembers.groupId === groups.id && groupMembers.userId === auth.id",
    write: "auth.id !== null",
  },
  commitments: {
    read: "commitments.userId === auth.id || (commitments.groupId !== null && exists(groupMembers) && groupMembers.groupId === commitments.groupId && groupMembers.userId === auth.id)",
    write: "commitments.userId === auth.id",
  },
  completions: {
    read: "completions.userId === auth.id || (exists(commitments) && commitments.id === completions.commitmentId && commitments.groupId !== null && exists(groupMembers) && groupMembers.groupId === commitments.groupId && groupMembers.userId === auth.id)",
    write: "completions.userId === auth.id",
  },
  groupMembers: {
    read: "groupMembers.userId === auth.id || (exists(groups) && groups.id === groupMembers.groupId && exists(groupMembers) && groupMembers.groupId === groups.id && groupMembers.userId === auth.id)",
    write: "groupMembers.userId === auth.id",
  },
};

export default rules as any;
